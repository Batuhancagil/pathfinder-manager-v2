import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb'

export async function GET() {
  try {
    // Test MongoDB connection
    await connectDB();
    
    return NextResponse.json({ 
      status: 'ok', 
      message: 'Pathfinder Manager API is running',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Database connection failed',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
