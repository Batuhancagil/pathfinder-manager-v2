import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '../../../lib/mongodb';
import Session from '../../../models/Session';
import User from '../../../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
    const { title, description, maxPlayers, isPublic } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json({
        error: 'Title is required'
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
      creatorId: user._id.toString(),
      creatorName: user.name,
      dmId: null, // DM henüz atanmamış
      dmName: null,
      maxPlayers: maxPlayers || 6,
      isPublic: isPublic || false,
      players: [],
      chatMessages: [],
      chatRooms: [
        {
          id: 'general',
          name: 'General',
          description: 'Main chat room for everyone',
          isDefault: true,
          createdBy: user._id.toString(),
          createdAt: new Date(),
          isPrivate: false,
          allowedUsers: []
        },
        {
          id: 'dice',
          name: 'Dice',
          description: 'Roll dice and see results here',
          isDefault: false,
          createdBy: user._id.toString(),
          createdAt: new Date(),
          isPrivate: false,
          allowedUsers: []
        }
      ],
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
        creatorName: session.creatorName,
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
