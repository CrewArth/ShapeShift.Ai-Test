import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { connectToDatabase } from '@/lib/mongodb';
import Model from '@/models/Model';

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
    const models = await Model.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { modelUrl, title, description, tags, privacy = 'public' } = body;

    await connectToDatabase();

    const model = await Model.create({
      userId,
      modelUrl,
      title: title || `Model ${new Date().toLocaleDateString()}`,
      description: description || '',
      tags: tags || [],
      privacy,
      meshyTaskId: body.taskId || '',
      format: body.format || 'glb',
      thumbnail: body.previewUrl || null
    });

    return NextResponse.json({
      success: true,
      model: model.getPublicData()
    });
  } catch (error) {
    console.error('Error publishing model:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish model' },
      { status: 500 }
    );
  }
} 