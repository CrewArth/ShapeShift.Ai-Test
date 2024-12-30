import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { ImageTo3DHistory, TextTo3DHistory } from '@/models/History';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get page from query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 10; // Items per page

    await connectToDatabase();

    // Fetch both types of history
    const [rawImageHistory, rawTextHistory] = await Promise.all([
      ImageTo3DHistory.find({ userId }).sort({ createdAt: -1 }).lean(),
      TextTo3DHistory.find({ userId }).sort({ createdAt: -1 }).lean()
    ]);

    // Transform the histories
    const transformedImageHistory = rawImageHistory.map(model => ({
      id: model._id?.toString() || model._id,
      type: 'image-to-3d' as const,
      thumbnail_url: model.thumbnailUrl || '',
      model_urls: {
        glb: model.modelUrl || '',
        obj: (model.modelUrl || '').replace('.glb', '.obj'),
        fbx: (model.modelUrl || '').replace('.glb', '.fbx'),
        usdz: (model.modelUrl || '').replace('.glb', '.usdz')
      },
      status: model.status?.toUpperCase() || 'UNKNOWN',
      created_at: model.createdAt ? new Date(model.createdAt).getTime() : Date.now(),
      task_error: model.taskError
    }));

    const transformedTextHistory = rawTextHistory.map(model => ({
      id: model._id?.toString() || model._id,
      type: 'text-to-3d' as const,
      prompt: model.prompt || '',
      negative_prompt: model.negativePrompt,
      art_style: model.artStyle,
      thumbnail_url: model.thumbnailUrl || '',
      model_urls: {
        glb: model.modelUrl || '',
        obj: (model.modelUrl || '').replace('.glb', '.obj'),
        fbx: (model.modelUrl || '').replace('.glb', '.fbx'),
        usdz: (model.modelUrl || '').replace('.glb', '.usdz')
      },
      status: model.status?.toUpperCase() || 'UNKNOWN',
      created_at: model.createdAt ? new Date(model.createdAt).getTime() : Date.now(),
      task_error: model.taskError
    }));

    // Combine and sort by creation date
    const allModels = [...transformedImageHistory, ...transformedTextHistory]
      .sort((a, b) => b.created_at - a.created_at);

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const totalItems = allModels.length;
    const totalPages = Math.ceil(totalItems / limit);
    const paginatedModels = allModels.slice(startIndex, endIndex);

    const pagination = {
      currentPage: page,
      totalPages,
      totalItems,
      hasMore: endIndex < totalItems
    };

    return NextResponse.json({ 
      models: paginatedModels,
      pagination
    });
  } catch (error) {
    console.error('Error fetching model history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch model history' },
      { status: 500 }
    );
  }
} 