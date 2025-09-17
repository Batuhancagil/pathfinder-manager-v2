import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '../../../../../lib/mongodb';
import Session from '../../../../../models/Session';
import User from '../../../../../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    // Get and verify JWT token
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

    // Find session
    const session = await (Session as any).findById(id);
    if (!session) {
      return NextResponse.json({
        error: 'Session not found'
      }, { status: 404 });
    }

    console.log('Auto-join check for user:', user.name, 'in session:', session.title);
    console.log('Current players:', session.players.length);

    // Check if user is DM
    if (session.dmId === user._id.toString()) {
      console.log('User is DM, no need to join as player');
      return NextResponse.json({
        success: true,
        isParticipant: true,
        role: 'dm',
        session: {
          id: session._id,
          title: session.title,
          players: session.players,
          dmId: session.dmId,
          dmName: session.dmName
        }
      });
    }

    // Check if user is already a player
    const existingPlayer = session.players.find((player: any) => player.userId === user._id.toString());
    if (existingPlayer) {
      console.log('User already in session as player');
      existingPlayer.isOnline = true;
      await session.save();
      
      return NextResponse.json({
        success: true,
        isParticipant: true,
        role: 'player',
        session: {
          id: session._id,
          title: session.title,
          players: session.players,
          dmId: session.dmId,
          dmName: session.dmName
        }
      });
    }

    // Auto-join user as player
    console.log('Auto-joining user as player');
    session.players.push({
      userId: user._id.toString(),
      characterName: `${user.name}`,
      joinedAt: new Date(),
      isOnline: true
    });

    // Add system message
    session.chatMessages.push({
      id: `msg_${Date.now()}`,
      userId: 'system',
      username: 'System',
      message: `${user.name} joined the session`,
      timestamp: new Date(),
      type: 'system'
    });

    await session.save();

    console.log('Auto-join completed, players now:', session.players.length);

    // Broadcast update
    try {
      const { broadcastToSession } = await import('../../../../../lib/sessionBroadcast');
      broadcastToSession(session._id.toString(), {
        type: 'session_update',
        session: {
          id: session._id,
          title: session.title,
          players: session.players,
          chatMessages: session.chatMessages.slice(-50),
          isActive: session.isActive
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to broadcast auto-join update:', error);
    }

    return NextResponse.json({
      success: true,
      isParticipant: true,
      role: 'player',
      session: {
        id: session._id,
        title: session.title,
        players: session.players,
        dmId: session.dmId,
        dmName: session.dmName
      }
    });

  } catch (error) {
    console.error('Auto-join error:', error);
    return NextResponse.json({
      error: 'Failed to auto-join session'
    }, { status: 500 });
  }
}
