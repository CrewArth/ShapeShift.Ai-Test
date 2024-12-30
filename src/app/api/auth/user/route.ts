import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

// Create or update user
export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const body = await request.json();
    const { email, name, profilePicture } = body;

    // Try to find existing user
    let user = await User.findOne({ clerkUserId: userId });

    if (user) {
      // Update existing user
      user = await User.findOneAndUpdate(
        { clerkUserId: userId },
        {
          $set: {
            email,
            name,
            profilePicture,
            lastLogin: new Date()
          }
        },
        { new: true }
      );
    } else {
      // Create new user
      user = await User.create({
        clerkUserId: userId,
        email,
        name,
        profilePicture,
        lastLogin: new Date()
      });
    }

    return NextResponse.json({
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Error in user API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get user profile
export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ clerkUserId: userId });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Error in user API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 