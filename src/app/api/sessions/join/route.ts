import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '../../../../lib/mongodb';
import Session from '../../../../models/Session';
import User from '../../../../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { sessionKey, characterName } = body;

    // Validate required fields
    if (!sessionKey) {
      return NextResponse.json({
        error: 'Session key is required'
      }, { status: 400 });
    }

    // Find session by key
    const session = await (Session as any).findOne({ 
      sessionKey: sessionKey.toUpperCase(),
      isActive: true 
    });

    if (!session) {
      return NextResponse.json({
        error: 'Session not found or inactive'
      }, { status: 404 });
    }

    // Check if session is full
    if (session.players.length >= session.maxPlayers) {
      return NextResponse.json({
        error: 'Session is full'
      }, { status: 400 });
    }

    console.log('Current players before join:', session.players.length);
    console.log('User trying to join:', user.name, user._id.toString());

    // Check if user is already in session
    const existingPlayer = session.players.find((player: any) => player.userId === user._id.toString());
    if (existingPlayer) {
      console.log('User already in session, updating info');
      // Update existing player info
      existingPlayer.characterName = characterName;
      existingPlayer.isOnline = true;
      existingPlayer.joinedAt = new Date();
    } else {
      console.log('Adding new player to session');
      // Add new player
      session.players.push({
        userId: user._id.toString(),
        characterName,
        joinedAt: new Date(),
        isOnline: true
      });

      // Add system message
      session.chatMessages.push({
        id: `msg_${Date.now()}`,
        userId: 'system',
        username: 'System',
        message: `${user.name} joined the session${characterName ? ` with ${characterName}` : ''}`,
        timestamp: new Date(),
        type: 'system'
      });
    }

    console.log('Players after join:', session.players.length);

    await session.save();

    // Broadcast to all connected clients in this session
    try {
      const { broadcastToSession } = await import('../../../../lib/sessionBroadcast');
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
      console.warn('Failed to broadcast session update:', error);
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session._id,
        title: session.title,
        description: session.description,
        sessionKey: session.sessionKey,
        dmName: session.dmName,
        players: session.players,
        maxPlayers: session.maxPlayers,
        isActive: session.isActive
      },
      redirectTo: `/sessions/${session._id}/dashboard`
    });

  } catch (error) {
    console.error('Session join error:', error);
    return NextResponse.json({
      error: 'Failed to join session'
    }, { status: 500 });
  }
}
