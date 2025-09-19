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

    const user = await (User as any).findById(decoded.userId);
    if (!user) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 });
    }

    const body = await request.json();
    const { targetUserId, reason } = body;

    if (!targetUserId) {
      return NextResponse.json({
        error: 'Target user ID is required'
      }, { status: 400 });
    }

    const session = await (Session as any).findById(id);
    if (!session) {
      return NextResponse.json({
        error: 'Session not found'
      }, { status: 404 });
    }

    // Only session creator can kick players
    if (session.creatorId !== user._id.toString()) {
      return NextResponse.json({
        error: 'Only the session creator can kick players'
      }, { status: 403 });
    }

    // Cannot kick yourself
    if (targetUserId === user._id.toString()) {
      return NextResponse.json({
        error: 'You cannot kick yourself'
      }, { status: 400 });
    }

    // Find the target player
    const targetPlayerIndex = session.players.findIndex((player: any) => 
      player.userId === targetUserId
    );

    if (targetPlayerIndex === -1) {
      return NextResponse.json({
        error: 'Player not found in session'
      }, { status: 404 });
    }

    const targetPlayer = session.players[targetPlayerIndex];
    const targetUser = await (User as any).findById(targetUserId);
    const targetName = targetUser?.name || targetPlayer.characterName || 'Unknown Player';

    // Remove player from session
    session.players.splice(targetPlayerIndex, 1);

    // If target was DM, remove DM status
    if (session.dmId === targetUserId) {
      session.dmId = undefined;
      session.dmName = undefined;
    }

    // Remove from initiative order if present
    session.initiativeOrder = session.initiativeOrder.filter((entry: any) => 
      entry.userId !== targetUserId
    );

    // Add system message
    const kickMessage = reason 
      ? `${targetName} was kicked from the session by ${user.name}. Reason: ${reason}`
      : `${targetName} was kicked from the session by ${user.name}.`;

    session.chatMessages.push({
      id: `msg_${Date.now()}`,
      userId: 'system',
      username: 'System',
      message: kickMessage,
      timestamp: new Date(),
      type: 'system',
      roomId: 'general'
    });

    await session.save();

    // Broadcast session update
    try {
      broadcastToSession(session._id.toString(), {
        type: 'session_update',
        session: {
          id: session._id,
          title: session.title,
          players: session.players,
          dmId: session.dmId,
          dmName: session.dmName,
          creatorId: session.creatorId,
          creatorName: session.creatorName,
          chatMessages: session.chatMessages.slice(-50),
          isActive: session.isActive
        },
        timestamp: new Date().toISOString()
      });

      // Broadcast kick notification to the kicked user
      broadcastToSession(session._id.toString(), {
        type: 'user_kicked',
        targetUserId: targetUserId,
        reason: reason,
        timestamp: new Date().toISOString()
      });
    } catch (broadcastError) {
      console.warn('Failed to broadcast kick update:', broadcastError);
    }

    return NextResponse.json({
      success: true,
      message: `${targetName} has been kicked from the session`,
      kickedUser: {
        id: targetUserId,
        name: targetName
      }
    });

  } catch (error) {
    console.error('Kick player error:', error);
    return NextResponse.json({ error: 'Failed to kick player' }, { status: 500 });
  }
}
