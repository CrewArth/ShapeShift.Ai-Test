import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { connectToDatabase } from '@/lib/mongodb';
import UserCredits from '@/models/UserCredits';

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { 
      taskId, 
      status, 
      modelUrls, 
      type, 
      prompt, 
      imageUrl, 
      thumbnail,
      creditsUsed = 1 
    } = body;

    if (!taskId || !type || !status) {
      return new NextResponse("Missing required fields: taskId, type, status", { status: 400 });
    }

    // Validate type
    if (!['text-to-3d', 'image-to-3d'].includes(type)) {
      return new NextResponse("Invalid type. Must be 'text-to-3d' or 'image-to-3d'", { status: 400 });
    }

    // Validate required fields based on type
    if (type === 'text-to-3d' && !prompt) {
      return new NextResponse("Prompt is required for text-to-3d", { status: 400 });
    }
    if (type === 'image-to-3d' && !imageUrl) {
      return new NextResponse("Image URL is required for image-to-3d", { status: 400 });
    }

    await connectToDatabase();
    const userCredits = await UserCredits.findOne({ userId });

    if (!userCredits) {
      return new NextResponse("User credits not found", { status: 404 });
    }

    // Create new transaction
    const transaction = {
      type: 'usage',
      modelType: type,
      status: status,
      modelUrl: Array.isArray(modelUrls) ? modelUrls[0] : modelUrls,
      credits: -Math.abs(creditsUsed), // Negative because we're using credits
      timestamp: new Date(),
      // Add fields based on type
      ...(type === 'text-to-3d' ? { prompt } : {}),
      ...(type === 'image-to-3d' ? { 
        imageUrl,
        thumbnail: thumbnail || imageUrl // Use thumbnail if provided, otherwise use original image
      } : {})
    };

    // Add transaction to user's history
    userCredits.transactions.push(transaction);

    // Save the updated user credits document
    await userCredits.save();

    return NextResponse.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('[HISTORY_UPDATE_TRANSACTION]', error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Error", 
      { status: 500 }
    );
  }
} 