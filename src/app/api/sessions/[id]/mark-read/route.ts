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
    const { roomId, lastMessageId } = body;

    if (!roomId) {
      return NextResponse.json({
        error: 'Room ID is required'
      }, { status: 400 });
    }

    const session = await (Session as any).findById(id);
    if (!session) {
      return NextResponse.json({
        error: 'Session not found'
      }, { status: 404 });
    }

    // Check if user is participant
    const isParticipant = session.players.some((player: any) => 
      player.userId === user._id.toString()
    ) || session.dmId === user._id.toString() || session.creatorId === user._id.toString();

    if (!isParticipant) {
      return NextResponse.json({
        error: 'You are not a participant in this session'
      }, { status: 403 });
    }

    // Find user in players array
    const playerIndex = session.players.findIndex((player: any) => 
      player.userId === user._id.toString()
    );

    if (playerIndex !== -1) {
      // Initialize roomLastSeen if it doesn't exist
      if (!session.players[playerIndex].roomLastSeen) {
        session.players[playerIndex].roomLastSeen = new Map();
      }

      // Update last seen message for this room
      if (lastMessageId) {
        session.players[playerIndex].roomLastSeen.set(roomId, lastMessageId);
      } else {
        // If no specific message ID, mark all current messages as read
        const roomMessages = session.chatMessages.filter((msg: any) => 
          (msg.roomId || 'general') === roomId
        );
        if (roomMessages.length > 0) {
          const latestMessageId = roomMessages[roomMessages.length - 1].id;
          session.players[playerIndex].roomLastSeen.set(roomId, latestMessageId);
        }
      }

      await session.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Room marked as read'
    });

  } catch (error) {
    console.error('Mark room as read error:', error);
    return NextResponse.json({ error: 'Failed to mark room as read' }, { status: 500 });
  }
}
