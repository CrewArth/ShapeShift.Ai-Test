import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs';
import { connectToDatabase } from '@/lib/mongodb';
import CommunityModel from '@/models/CommunityModel';

export async function POST(request: Request) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user details from Clerk
    const user = await clerkClient.users.getUser(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, originalImage, modelUrl, tags, thumbnailUrl, type, prompt } = body;

    // Validate required fields
    if (!title || !originalImage || !modelUrl || !thumbnailUrl || !type) {
      return NextResponse.json(
        { error: 'Missing required fields (title, originalImage, modelUrl, thumbnailUrl, type)' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Create community model
    const communityModel = await CommunityModel.create({
      userId,
      userName: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`
        : user.username || 'Anonymous',
      title,
      description,
      originalImage,
      thumbnailUrl,
      modelUrl,
      type,
      prompt,
      tags: tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      model: communityModel
    });
  } catch (error) {
    console.error('Error publishing model:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to publish model',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 