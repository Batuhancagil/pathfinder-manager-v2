import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';

export async function POST() {
  try {
    await connectDB();

    // Check if demo users already exist
    const existingAdmin = await (User as any).findOne({ email: 'admin@demo.com' });
    const existingPlayer = await (User as any).findOne({ email: 'player@demo.com' });

    const createdUsers = [];

    // Create admin user if not exists
    if (!existingAdmin) {
      const adminUser = new (User as any)({
        email: 'admin@demo.com',
        password: 'password',
        name: 'Demo Admin',
        role: 'admin'
      });
      await adminUser.save();
      createdUsers.push('admin@demo.com');
    }

    // Create player user if not exists
    if (!existingPlayer) {
      const playerUser = new (User as any)({
        email: 'player@demo.com',
        password: 'password',
        name: 'Demo Player',
        role: 'player'
      });
      await playerUser.save();
      createdUsers.push('player@demo.com');
    }

    return NextResponse.json({
      success: true,
      message: `Demo users setup completed`,
      createdUsers,
      existingUsers: [
        ...(existingAdmin ? ['admin@demo.com'] : []),
        ...(existingPlayer ? ['player@demo.com'] : [])
      ]
    });

  } catch (error) {
    console.error('Demo setup error:', error);
    return NextResponse.json({
      error: 'Failed to setup demo users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
