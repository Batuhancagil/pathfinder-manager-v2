import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '../../../../../lib/mongodb';
import Session from '../../../../../models/Session';
import User from '../../../../../models/User';
import { broadcastToSession } from '../../../../../lib/sessionBroadcast';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Add initiative roll
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    // Verify authentication
    const token = request.cookies.get('auth-token')?.value || 
                  request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (error) {
      return NextResponse.json({
        error: 'Invalid or expired token'
      }, { status: 401 });
    }

    // Get user from database
    const user = await (User as any).findById(decoded.userId);
    if (!user) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 });
    }

    const body = await request.json();
    const { characterName, initiative, rollDetails } = body;

    // Validate required fields
    if (!characterName || initiative === undefined || !rollDetails) {
      return NextResponse.json({
        error: 'Character name, initiative value, and roll details are required'
      }, { status: 400 });
    }

    // Find session
    const session = await (Session as any).findById(id);
    if (!session) {
      return NextResponse.json({
        error: 'Session not found'
      }, { status: 404 });
    }

    // Check if user is participant
    const isParticipant = session.players.some((player: any) => 
      player.userId === user._id.toString()
    ) || session.dmId === user._id.toString() || session.creatorId === user._id.toString();

    if (!isParticipant) {
      return NextResponse.json({
        error: 'You are not a participant in this session'
      }, { status: 403 });
    }

    // Create initiative entry
    const initiativeEntry = {
      id: `init_${Date.now()}_${user._id}`,
      characterName,
      initiative,
      rollDetails,
      userId: user._id.toString(),
      userName: user.name,
      isActive: true,
      isDead: false,
      addedAt: new Date()
    };

    // Remove existing initiative for same character from same user
    session.initiativeOrder = session.initiativeOrder.filter((entry: any) => 
      !(entry.characterName === characterName && entry.userId === user._id.toString())
    );

    // Add new initiative entry
    session.initiativeOrder.push(initiativeEntry);

    // Sort by initiative (highest first)
    session.initiativeOrder.sort((a: any, b: any) => b.initiative - a.initiative);

    await session.save();

    console.log(`Initiative added: ${characterName} rolled ${initiative}`);

    // Broadcast update
    broadcastToSession(session._id.toString(), {
      type: 'initiative_update',
      initiativeOrder: session.initiativeOrder,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      initiative: initiativeEntry,
      initiativeOrder: session.initiativeOrder
    });

  } catch (error) {
    console.error('Initiative add error:', error);
    return NextResponse.json({
      error: 'Failed to add initiative'
    }, { status: 500 });
  }
}

// Remove initiative roll
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    // Verify authentication
    const token = request.cookies.get('auth-token')?.value || 
                  request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (error) {
      return NextResponse.json({
        error: 'Invalid or expired token'
      }, { status: 401 });
    }

    const body = await request.json();
    const { initiativeId } = body;

    if (!initiativeId) {
      return NextResponse.json({
        error: 'Initiative ID is required'
      }, { status: 400 });
    }

    // Find session
    const session = await (Session as any).findById(id);
    if (!session) {
      return NextResponse.json({
        error: 'Session not found'
      }, { status: 404 });
    }

    // Find initiative entry
    const initiativeEntry = session.initiativeOrder.find((entry: any) => entry.id === initiativeId);
    if (!initiativeEntry) {
      return NextResponse.json({
        error: 'Initiative entry not found'
      }, { status: 404 });
    }

    // Check permissions: user can remove their own initiatives, DM/creator can remove any
    const isDM = session.dmId === decoded.userId;
    const isCreator = session.creatorId === decoded.userId;
    const isOwner = initiativeEntry.userId === decoded.userId;

    if (!isOwner && !isDM && !isCreator) {
      return NextResponse.json({
        error: 'You can only remove your own initiative rolls'
      }, { status: 403 });
    }

    // Remove initiative entry
    session.initiativeOrder = session.initiativeOrder.filter((entry: any) => entry.id !== initiativeId);
    await session.save();

    console.log(`Initiative removed: ${initiativeEntry.characterName}`);

    // Broadcast update
    broadcastToSession(session._id.toString(), {
      type: 'initiative_update',
      initiativeOrder: session.initiativeOrder,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      initiativeOrder: session.initiativeOrder
    });

  } catch (error) {
    console.error('Initiative remove error:', error);
    return NextResponse.json({
      error: 'Failed to remove initiative'
    }, { status: 500 });
  }
}
