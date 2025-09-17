import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Session from '../../../models/Session';

// Generate random session key
function generateSessionKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create new session
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { title, description, maxPlayers, isPublic, dmId, dmName } = body;

    // Validate required fields
    if (!title || !dmId || !dmName) {
      return NextResponse.json({
        error: 'Title, DM ID, and DM name are required'
      }, { status: 400 });
    }

    // Generate unique session key
    let sessionKey = generateSessionKey();
    let keyExists = true;
    let attempts = 0;

    // Ensure unique session key
    while (keyExists && attempts < 10) {
      const existingSession = await (Session as any).findOne({ sessionKey });
      if (!existingSession) {
        keyExists = false;
      } else {
        sessionKey = generateSessionKey();
        attempts++;
      }
    }

    if (attempts >= 10) {
      return NextResponse.json({
        error: 'Failed to generate unique session key'
      }, { status: 500 });
    }

    // Create session
    const session = new (Session as any)({
      title,
      description: description || '',
      sessionKey,
      dmId,
      dmName,
      maxPlayers: maxPlayers || 6,
      isPublic: isPublic || false,
      players: [],
      chatMessages: [],
      initiativeOrder: [],
      isActive: true
    });

    await session.save();

    return NextResponse.json({
      success: true,
      session: {
        id: session._id,
        title: session.title,
        description: session.description,
        sessionKey: session.sessionKey,
        dmName: session.dmName,
        maxPlayers: session.maxPlayers,
        playerCount: session.players.length,
        isActive: session.isActive,
        createdAt: session.createdAt
      }
    });

  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({
      error: 'Failed to create session'
    }, { status: 500 });
  }
}

// Get sessions list
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const dmId = searchParams.get('dmId');
    const isPublic = searchParams.get('public') === 'true';

    let query: any = { isActive: true };

    if (dmId) {
      query.dmId = dmId;
    } else if (isPublic) {
      query.isPublic = true;
    }

    const sessions = await (Session as any)
      .find(query)
      .sort({ createdAt: -1 })
      .select('title description sessionKey dmName maxPlayers players isPublic createdAt')
      .lean();

    // Add player count to each session
    const sessionsWithCount = sessions.map((session: any) => ({
      ...session,
      playerCount: session.players?.length || 0
    }));

    return NextResponse.json({
      sessions: sessionsWithCount
    });

  } catch (error) {
    console.error('Sessions fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch sessions'
    }, { status: 500 });
  }
}
