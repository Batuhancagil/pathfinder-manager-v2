import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '../../../../lib/mongodb';
import Character from '../../../../models/Character';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    
    const character = await (Character as any).findById(id);
    
    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    return NextResponse.json({ character });
  } catch (error) {
    console.error('Character fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch character' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    await connectDB();

    // Get existing character
    const existingCharacter = await (Character as any).findById(id);
    if (!existingCharacter) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    // Delete old PDF file
    try {
      const oldFilePath = join(process.env.UPLOAD_PATH || '/app/uploads', existingCharacter.pdfFileName);
      await unlink(oldFilePath);
    } catch (error) {
      console.warn('Could not delete old PDF file:', error);
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = process.env.UPLOAD_PATH || '/app/uploads';
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const fileId = uuidv4();
    const fileName = `${fileId}-${file.name}`;
    const filePath = join(uploadDir, fileName);

    // Save new file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Update character in database
    const updatedCharacter = await (Character as any).findByIdAndUpdate(
      id,
      {
        name: characterName,
        pdfUrl: `/api/files/${fileName}`,
        pdfFileName: fileName,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      character: {
        id: updatedCharacter._id,
        name: updatedCharacter.name,
        pdfUrl: updatedCharacter.pdfUrl
      }
    });

  } catch (error) {
    console.error('Character update error:', error);
    return NextResponse.json({ error: 'Failed to update character' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    // Get character to delete PDF file
    const character = await (Character as any).findById(id);
    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    // Delete PDF file
    try {
      const filePath = join(process.env.UPLOAD_PATH || '/app/uploads', character.pdfFileName);
      await unlink(filePath);
    } catch (error) {
      console.warn('Could not delete PDF file:', error);
    }

    // Delete character from database
    await (Character as any).findByIdAndDelete(id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Character delete error:', error);
    return NextResponse.json({ error: 'Failed to delete character' }, { status: 500 });
  }
}
