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

    // Get user from database
    const user = await (User as any).findById(decoded.userId);
    if (!user) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 });
    }

    const body = await request.json();
    const { message, type = 'chat' } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({
        error: 'Message is required'
      }, { status: 400 });
    }

    // Find session
    const session = await (Session as any).findById(id);
    if (!session) {
      return NextResponse.json({
        error: 'Session not found'
      }, { status: 404 });
    }

    // Check if user is in session
    const isParticipant = session.players.some((player: any) => 
      player.userId === user._id.toString()
    ) || session.dmId === user._id.toString();

    if (!isParticipant) {
      return NextResponse.json({
        error: 'You are not a participant in this session'
      }, { status: 403 });
    }

    // Add message to session
    const chatMessage = {
      id: `msg_${Date.now()}_${user._id}`,
      userId: user._id.toString(),
      username: user.name,
      message: message.trim(),
      timestamp: new Date(),
      type: type
    };

    session.chatMessages.push(chatMessage);
    await session.save();

    // Broadcast to all connected clients
    try {
      const { broadcastToSession } = await import('../../../../../lib/sessionBroadcast');
      broadcastToSession(id, {
        type: 'new_message',
        message: chatMessage,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to broadcast message:', error);
    }

    return NextResponse.json({
      success: true,
      message: chatMessage
    });

  } catch (error) {
    console.error('Chat message error:', error);
    return NextResponse.json({
      error: 'Failed to send message'
    }, { status: 500 });
  }
}
