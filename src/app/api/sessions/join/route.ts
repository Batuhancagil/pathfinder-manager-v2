import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Session from '../../../../models/Session';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { sessionKey, userId, username, characterId, characterName } = body;

    // Validate required fields
    if (!sessionKey || !userId || !username) {
      return NextResponse.json({
        error: 'Session key, user ID, and username are required'
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

    // Check if user is already in session
    const existingPlayer = session.players.find((player: any) => player.userId === userId);
    if (existingPlayer) {
      // Update existing player info
      existingPlayer.characterId = characterId;
      existingPlayer.characterName = characterName;
      existingPlayer.isOnline = true;
      existingPlayer.joinedAt = new Date();
    } else {
      // Add new player
      session.players.push({
        userId,
        characterId,
        characterName,
        joinedAt: new Date(),
        isOnline: true
      });

      // Add system message
      session.chatMessages.push({
        id: `msg_${Date.now()}`,
        userId: 'system',
        username: 'System',
        message: `${username} joined the session${characterName ? ` with ${characterName}` : ''}`,
        timestamp: new Date(),
        type: 'system'
      });
    }

    await session.save();

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
