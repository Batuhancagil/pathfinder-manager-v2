import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '../../../../../../lib/mongodb';
import Session from '../../../../../../models/Session';
import { broadcastToSession } from '../../../../../../lib/sessionBroadcast';

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

    // Check if user is DM or creator (only they can mark characters as dead)
    const isDM = session.dmId === decoded.userId;
    const isCreator = session.creatorId === decoded.userId;

    if (!isDM && !isCreator) {
      return NextResponse.json({
        error: 'Only DM or session creator can toggle death status'
      }, { status: 403 });
    }

    // Find and toggle initiative entry
    const initiativeEntry = session.initiativeOrder.find((entry: any) => entry.id === initiativeId);
    if (!initiativeEntry) {
      return NextResponse.json({
        error: 'Initiative entry not found'
      }, { status: 404 });
    }

    // Toggle dead status
    initiativeEntry.isDead = !initiativeEntry.isDead;
    await session.save();

    const statusText = initiativeEntry.isDead ? 'marked as dead' : 'revived';
    console.log(`${initiativeEntry.characterName} ${statusText}`);

    // Add system message
    session.chatMessages.push({
      id: `msg_${Date.now()}`,
      userId: 'system',
      username: 'System',
      message: `💀 ${initiativeEntry.characterName} has been ${statusText}`,
      timestamp: new Date(),
      type: 'system'
    });

    await session.save();

    // Broadcast update
    broadcastToSession(session._id.toString(), {
      type: 'initiative_update',
      initiativeOrder: session.initiativeOrder,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      character: initiativeEntry.characterName,
      isDead: initiativeEntry.isDead,
      initiativeOrder: session.initiativeOrder
    });

  } catch (error) {
    console.error('Toggle dead error:', error);
    return NextResponse.json({
      error: 'Failed to toggle death status'
    }, { status: 500 });
  }
}
