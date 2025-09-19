import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '../../../../../lib/mongodb';
import Session from '../../../../../models/Session';
import User from '../../../../../models/User';
import { broadcastToSession } from '../../../../../lib/sessionBroadcast';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
    const { dmUserId, dmCharacterName } = body;

    // Find session
    const session = await (Session as any).findById(id);
    if (!session) {
      return NextResponse.json({
        error: 'Session not found'
      }, { status: 404 });
    }

    // Check if user is session creator
    if (session.creatorId !== user._id.toString()) {
      return NextResponse.json({
        error: 'Only session creator can assign DM'
      }, { status: 403 });
    }

    // Validate DM user
    if (!dmUserId) {
      return NextResponse.json({
        error: 'DM user ID is required'
      }, { status: 400 });
    }

    // Get DM user info
    const dmUser = await (User as any).findById(dmUserId);
    if (!dmUser) {
      return NextResponse.json({
        error: 'DM user not found'
      }, { status: 404 });
    }

    // Check if DM user is in session (as player or creator)
    const isDmInSession = session.players.some((player: any) => player.userId === dmUserId) || 
                         session.creatorId === dmUserId;

    if (!isDmInSession) {
      return NextResponse.json({
        error: 'DM must be a participant in the session'
      }, { status: 400 });
    }

    // Assign DM
    session.dmId = dmUserId;
    session.dmName = dmCharacterName || dmUser.name;

    // Add system message
    session.chatMessages.push({
      id: `msg_${Date.now()}`,
      userId: 'system',
      username: 'System',
      message: `${dmCharacterName || dmUser.name} has been assigned as Dungeon Master`,
      timestamp: new Date(),
      type: 'system'
    });

    await session.save();

    // Broadcast update
    broadcastToSession(session._id.toString(), {
      type: 'session_update',
      session: {
        id: session._id,
        title: session.title,
        creatorId: session.creatorId,
        creatorName: session.creatorName,
        dmId: session.dmId,
        dmName: session.dmName,
        players: session.players,
        chatMessages: session.chatMessages.slice(-50),
        isActive: session.isActive
      },
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'DM assigned successfully',
      session: {
        id: session._id,
        title: session.title,
        creatorName: session.creatorName,
        dmName: session.dmName,
        dmId: session.dmId
      }
    });

  } catch (error) {
    console.error('DM assignment error:', error);
    return NextResponse.json({
      error: 'Failed to assign DM'
    }, { status: 500 });
  }
}
