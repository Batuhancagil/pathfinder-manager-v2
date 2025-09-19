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

    // Find session
    const session = await (Session as any).findById(id);
    if (!session) {
      return NextResponse.json({
        error: 'Session not found'
      }, { status: 404 });
    }

    console.log('User leaving session:', user.name, 'from session:', session.title);

    // Check if user is session creator
    const isCreator = session.creatorId === user._id.toString();
    
    // Check if user is DM
    const isDM = session.dmId === user._id.toString();

    // Remove user from players array
    const initialPlayerCount = session.players.length;
    session.players = session.players.filter((player: any) => player.userId !== user._id.toString());
    const playerRemoved = session.players.length < initialPlayerCount;

    // Handle DM leaving
    if (isDM) {
      console.log('DM is leaving, removing DM assignment');
      session.dmId = null;
      session.dmName = null;
      
      // Add system message about DM leaving
      session.chatMessages.push({
        id: `msg_${Date.now()}`,
        userId: 'system',
        username: 'System',
        message: `${user.name} left the session and is no longer the DM`,
        timestamp: new Date(),
        type: 'system'
      });
    } else if (playerRemoved) {
      // Add system message about player leaving
      session.chatMessages.push({
        id: `msg_${Date.now()}`,
        userId: 'system',
        username: 'System',
        message: `${user.name} left the session`,
        timestamp: new Date(),
        type: 'system'
      });
    }

    // Handle creator leaving
    if (isCreator) {
      console.log('Session creator is leaving');
      
      // If there are other players, transfer ownership to first player
      if (session.players.length > 0) {
        const newCreator = session.players[0];
        session.creatorId = newCreator.userId;
        session.creatorName = newCreator.characterName || 'New Creator';
        
        session.chatMessages.push({
          id: `msg_${Date.now()}`,
          userId: 'system',
          username: 'System',
          message: `${user.name} left the session. ${session.creatorName} is now the session creator.`,
          timestamp: new Date(),
          type: 'system'
        });
      } else {
        // No other players, mark session as inactive
        console.log('No other players, deactivating session');
        session.isActive = false;
        
        session.chatMessages.push({
          id: `msg_${Date.now()}`,
          userId: 'system',
          username: 'System',
          message: `Session ended - all participants have left`,
          timestamp: new Date(),
          type: 'system'
        });
      }
    }

    await session.save();

    console.log('User left session successfully');

    // Broadcast update to remaining participants
    if (session.isActive) {
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
    }

    return NextResponse.json({
      success: true,
      message: 'Left session successfully',
      sessionEnded: !session.isActive
    });

  } catch (error) {
    console.error('Leave session error:', error);
    return NextResponse.json({
      error: 'Failed to leave session'
    }, { status: 500 });
  }
}
