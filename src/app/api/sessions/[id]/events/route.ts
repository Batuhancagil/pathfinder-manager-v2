import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '../../../../../lib/mongodb';
import Session from '../../../../../models/Session';
import { addConnection, removeConnection, broadcastToSession } from '../../../../../lib/sessionBroadcast';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value || 
                  request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return new Response('Unauthorized', { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (error) {
      return new Response('Invalid token', { status: 401 });
    }

    await connectDB();

    // Verify session exists and user has access
    const session = await (Session as any).findById(id);
    if (!session) {
      return new Response('Session not found', { status: 404 });
    }

    // Create SSE stream
    let streamController: ReadableStreamDefaultController;
    
    const stream = new ReadableStream({
      start(controller) {
        streamController = controller;
        
        // Add connection to the map
        addConnection(id, controller);

        // Send initial connection message
        const data = JSON.stringify({
          type: 'connected',
          sessionId: id,
          userId: decoded.userId,
          timestamp: new Date().toISOString()
        });
        
        controller.enqueue(`data: ${data}\n\n`);

        // Send current session state
        const sessionData = JSON.stringify({
          type: 'session_update',
          session: {
            id: session._id,
            title: session.title,
            players: session.players,
            chatMessages: session.chatMessages.slice(-50), // Last 50 messages
            isActive: session.isActive
          },
          timestamp: new Date().toISOString()
        });
        
        controller.enqueue(`data: ${sessionData}\n\n`);

        // Notify other participants about new connection
        broadcastToSession(id, {
          type: 'participant_joined',
          userId: decoded.userId,
          timestamp: new Date().toISOString()
        }, controller);
      },

      cancel() {
        // Remove connection when client disconnects
        removeConnection(id, streamController);

        // Notify other participants about disconnection
        broadcastToSession(id, {
          type: 'participant_left',
          userId: decoded.userId,
          timestamp: new Date().toISOString()
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });

  } catch (error) {
    console.error('SSE error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
