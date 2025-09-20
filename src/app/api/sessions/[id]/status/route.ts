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

    let isOnline;
    
    // Handle both JSON and FormData (for sendBeacon)
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const body = await request.json();
      isOnline = body.isOnline;
    } else {
      // FormData from sendBeacon
      const formData = await request.formData();
      isOnline = formData.get('isOnline') === 'true';
    }

    // Find session
    const session = await (Session as any).findById(id);
    if (!session) {
      return NextResponse.json({
        error: 'Session not found'
      }, { status: 404 });
    }

    // Update user's online status
    const player = session.players.find((p: any) => p.userId === decoded.userId);
    if (player) {
      const previousStatus = player.isOnline;
      const now = new Date();
      
      // Only update if status actually changed
      const statusChanged = player.isOnline !== isOnline;
      
      player.isOnline = isOnline;
      player.lastSeen = now;
      
      await session.save();

      console.log(`User ${decoded.userId} status updated to: ${isOnline ? 'online' : 'offline'} (changed: ${statusChanged})`);

      // Only broadcast if status actually changed (optimization)
      if (statusChanged) {
        console.log(`Broadcasting status change for user ${decoded.userId}: ${previousStatus} → ${isOnline}`);
        
        broadcastToSession(session._id.toString(), {
          type: 'participant_status_update',
          userId: decoded.userId,
          isOnline,
          previousStatus,
          timestamp: now.toISOString()
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Status updated',
        statusChanged
      });
    }

    return NextResponse.json({
      error: 'User not found in session'
    }, { status: 404 });

  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json({
      error: 'Failed to update status'
    }, { status: 500 });
  }
}
