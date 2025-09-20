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
    console.log('Session creator:', session.creatorName, 'DM:', session.dmName || 'Not assigned');

    // Check if user is session creator
    const isCreator = session.creatorId === user._id.toString();
    
    // Check if user is assigned DM
    const isDM = session.dmId === user._id.toString();

    if (isCreator) {
      console.log('User is session creator');
    }
    
    if (isDM) {
      console.log('User is assigned DM');
    }

    // Check if user is already a player
    const existingPlayer = session.players.find((player: any) => player.userId === user._id.toString());
    if (existingPlayer) {
      console.log('User already in session as player');
      existingPlayer.isOnline = true;
      existingPlayer.lastSeen = new Date();
      await session.save();
      
      return NextResponse.json({
        success: true,
        isParticipant: true,
        role: isDM ? 'dm' : isCreator ? 'creator' : 'player',
        session: {
          id: session._id,
          title: session.title,
          players: session.players,
          creatorId: session.creatorId,
          creatorName: session.creatorName,
          dmId: session.dmId,
          dmName: session.dmName
        }
      });
    }

    // Auto-join user as player (unless they're creator and don't want to be a player)
    console.log('Auto-joining user as player');
    session.players.push({
      userId: user._id.toString(),
      characterName: `${user.name}`,
      joinedAt: new Date(),
      isOnline: true,
      lastSeen: new Date(),
      roomLastSeen: new Map() // Initialize empty roomLastSeen
    });

    // Add system message
    session.chatMessages.push({
      id: `msg_${Date.now()}`,
      userId: 'system',
      username: 'System',
      message: `${user.name} joined the session${isCreator ? ' (Session Creator)' : ''}`,
      timestamp: new Date(),
      type: 'system'
    });

    await session.save();

    console.log('Auto-join completed, players now:', session.players.length);

    // Broadcast update
    try {
      const { broadcastToSession } = await import('../../../../../lib/sessionBroadcast');
      
      // Broadcast session update
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

      // Broadcast critical online status change
      broadcastToSession(session._id.toString(), {
        type: 'user_status_critical',
        userId: user._id.toString(),
        userName: user.name,
        isOnline: true,
        statusType: 'joined_session',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to broadcast auto-join update:', error);
    }

    return NextResponse.json({
      success: true,
      isParticipant: true,
      role: isDM ? 'dm' : isCreator ? 'creator' : 'player',
      session: {
        id: session._id,
        title: session.title,
        players: session.players,
        creatorId: session.creatorId,
        creatorName: session.creatorName,
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
