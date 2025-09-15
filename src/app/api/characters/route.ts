import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Character from '../../../models/Character';

export async function GET() {
  try {
    await connectDB();
    
    const characters = await (Character as any).find({ userId: 'temp-user-id' })
      .sort({ createdAt: -1 })
      .select('name pdfUrl pdfFileName createdAt');

    return NextResponse.json({ characters });
  } catch (error) {
    console.error('Characters fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch characters' }, { status: 500 });
  }
}
