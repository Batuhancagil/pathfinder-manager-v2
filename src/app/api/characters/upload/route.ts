import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '../../../../lib/mongodb';
import Character from '../../../../models/Character';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('pdfFile') as unknown as File;
    const characterName = data.get('characterName') as string;

    if (!file || !characterName) {
      return NextResponse.json({ error: 'PDF file and character name are required' }, { status: 400 });
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = process.env.UPLOAD_PATH || '/app/uploads';
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const fileId = uuidv4();
    const fileName = `${fileId}-${file.name}`;
    const filePath = join(uploadDir, fileName);

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Connect to database
    try {
      await connectDB();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Save character to database
    let character;
    try {
      character = new (Character as any)({
        name: characterName,
        pdfUrl: `/api/files/${fileName}`,
        pdfFileName: fileName,
        userId: 'temp-user-id' // TODO: Get from auth
      });

      await character.save();
    } catch (dbError) {
      console.error('Database save error:', dbError);
      return NextResponse.json({ error: 'Failed to save character to database' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      character: {
        id: character._id,
        name: character.name,
        pdfUrl: character.pdfUrl
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 });
  }
}
