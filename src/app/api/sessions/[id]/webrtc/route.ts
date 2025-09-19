import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '../../../../../lib/mongodb';
import Session from '../../../../../models/Session';
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

    const body = await request.json();
    const { type, data, targetUserId } = body;

    console.log('WebRTC signaling:', type, 'from user:', decoded.userId, 'to:', targetUserId);

    // Find session to verify user is participant
    const session = await (Session as any).findById(id);
    if (!session) {
      return NextResponse.json({
        error: 'Session not found'
      }, { status: 404 });
    }

    // Check if user is participant
    const isParticipant = session.players.some((player: any) => 
      player.userId === decoded.userId
    ) || session.dmId === decoded.userId;

    if (!isParticipant) {
      return NextResponse.json({
        error: 'You are not a participant in this session'
      }, { status: 403 });
    }

    // Broadcast WebRTC signaling message
    broadcastToSession(id, {
      type: 'webrtc_signal',
      signalType: type,
      data: data,
      fromUserId: decoded.userId,
      targetUserId: targetUserId,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Signal sent'
    });

  } catch (error) {
    console.error('WebRTC signaling error:', error);
    return NextResponse.json({
      error: 'Failed to send signal'
    }, { status: 500 });
  }
}
