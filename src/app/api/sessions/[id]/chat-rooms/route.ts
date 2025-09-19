import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '../../../../../lib/mongodb';
import Session from '../../../../../models/Session';
import User from '../../../../../models/User';
import { broadcastToSession } from '../../../../../lib/sessionBroadcast';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Get chat rooms
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const token = request.cookies.get('auth-token')?.value || 
                  request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const session = await (Session as any).findById(id);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if user is participant
    const isParticipant = session.players.some((player: any) => 
      player.userId === decoded.userId
    ) || session.dmId === decoded.userId || session.creatorId === decoded.userId;

    if (!isParticipant) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      chatRooms: session.chatRooms || []
    });

  } catch (error) {
    console.error('Get chat rooms error:', error);
    return NextResponse.json({ error: 'Failed to get chat rooms' }, { status: 500 });
  }
}

// Create chat room
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const token = request.cookies.get('auth-token')?.value || 
                  request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const user = await (User as any).findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const session = await (Session as any).findById(id);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Only session creator can create chat rooms
    if (session.creatorId !== decoded.userId) {
      return NextResponse.json({ error: 'Only session creator can create chat rooms' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, isPrivate, allowedUsers } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }

    // Check if room name already exists
    const existingRoom = session.chatRooms?.find((room: any) => 
      room.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (existingRoom) {
      return NextResponse.json({ error: 'Room name already exists' }, { status: 400 });
    }

    const newRoom = {
      id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      description: description?.trim() || '',
      isDefault: false,
      createdBy: decoded.userId,
      createdAt: new Date(),
      isPrivate: isPrivate || false,
      allowedUsers: isPrivate ? (allowedUsers || []) : []
    };

    if (!session.chatRooms) {
      session.chatRooms = [];
    }

    session.chatRooms.push(newRoom);

    // Add system message
    session.chatMessages.push({
      id: `msg_${Date.now()}`,
      userId: 'system',
      username: 'System',
      message: `${user.name} created a new chat room: "${newRoom.name}"`,
      timestamp: new Date(),
      type: 'system',
      roomId: 'general'
    });

    await session.save();

    // Broadcast update
    try {
      broadcastToSession(session._id.toString(), {
        type: 'chat_rooms_update',
        chatRooms: session.chatRooms,
        timestamp: new Date().toISOString()
      });
    } catch (broadcastError) {
      console.warn('Failed to broadcast chat rooms update:', broadcastError);
    }

    return NextResponse.json({
      success: true,
      chatRoom: newRoom
    });

  } catch (error) {
    console.error('Create chat room error:', error);
    return NextResponse.json({ error: 'Failed to create chat room' }, { status: 500 });
  }
}
