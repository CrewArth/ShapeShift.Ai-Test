import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import axios from 'axios';
import { MESHY_API_BASE_URL } from '@/config/constants';
import { connectToDatabase } from '@/lib/mongoose';
import UserCredits from '@/models/UserCredits';
import { CREDIT_COST_PER_GENERATION } from '@/config/subscriptionPlans';
import { ImageTo3DHistory } from '@/models/History';

interface Transaction {
  type: 'usage' | 'refund';
  credits: number;
  description: string;
  status: 'success' | 'failed';
  timestamp: Date;
}

interface UserCreditDocument {
  userId: string;
  credits: number;
  transactions?: Transaction[];
}

interface MeshyResponse {
  id: string;
  model_urls: {
    glb: string;
    fbx: string;
    obj: string;
    usdz: string;
  };
  thumbnail_url: string;
  progress: number;
  status: string;
  task_error?: {
    message: string;
  };
  texture_urls?: Array<{
    base_color: string;
    metallic: string;
    normal: string;
    roughness: string;
  }>;
}

async function updateHistory(
  taskId: string, 
  status: 'PROCESSING' | 'SUCCEEDED' | 'FAILED', 
  modelUrls: string[], 
  thumbnailUrl: string,
  creditsUsed: number = 1
) {
  try {
    const historyEntry = new ImageTo3DHistory({
      taskId,
      userId: auth().userId,
      type: 'image-to-3d',
      status,
      modelUrl: modelUrls[0] || '',
      thumbnailUrl: thumbnailUrl || '',
      taskError: {
        message: ''
      },
      createdAt: new Date()
    });

    await historyEntry.save();
    console.log('History entry created:', historyEntry);
  } catch (error) {
    console.error('Error updating history:', error);
    // Don't throw error to prevent cascading failures
  }
}

async function refundCredits(userId: string, reason: string) {
  try {
    console.log(`[API] Attempting to refund credits for user ${userId}. Reason: ${reason}`);
    
    const user = await UserCredits.findOne({ userId }) as UserCreditDocument | null;
    const recentRefund = user?.transactions?.find(
      (t: Transaction) => t.type === 'refund' && 
      t.timestamp > new Date(Date.now() - 5 * 60 * 1000)
    );

    if (recentRefund) {
      console.log('[API] Credits already refunded recently:', {
        userId,
        refundTimestamp: recentRefund.timestamp
      });
      return;
    }

    const transaction: Transaction = {
      type: 'refund',
      credits: CREDIT_COST_PER_GENERATION,
      description: `Refund for failed Image to 3D generation: ${reason}`,
      status: 'success',
      timestamp: new Date()
    };

    await UserCredits.updateOne(
      { userId },
      { 
        $inc: { credits: CREDIT_COST_PER_GENERATION },
        $push: {
          transactions: transaction
        }
      }
    );

    console.log('[API] Credits refunded successfully:', {
      userId,
      amount: CREDIT_COST_PER_GENERATION,
      reason,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Failed to refund credits:', error);
  }
}

async function checkTaskStatus(taskId: string, userId: string) {
  try {
    console.log(`[API] Checking task status for ${taskId}`, {
      userId,
      timestamp: new Date().toISOString()
    });
    
    const response = await axios.get<MeshyResponse>(
      `${MESHY_API_BASE_URL}/image-to-3d/${taskId}`,
      { 
        headers: {
          'Authorization': `Bearer ${process.env.MESHY_API_KEY}`,
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    );

    const data = response.data;
    console.log(`[API] Raw status response for ${taskId}:`, {
      status: data.status,
      progress: data.progress,
      modelUrls: data.model_urls,
      textureUrls: data.texture_urls,
      thumbnailUrl: data.thumbnail_url,
      error: data.task_error,
      timestamp: new Date().toISOString()
    });

    if (!data) {
      throw new Error('No data received from Meshy API');
    }

    // Map Meshy API status to our status
    const statusMap = {
      'SUCCEEDED': 'SUCCEEDED',
      'FAILED': 'FAILED',
      'PENDING': 'PROCESSING',
      'PROCESSING': 'PROCESSING'
    } as const;

    const mappedStatus = statusMap[data.status as keyof typeof statusMap] || 'PROCESSING';

    // For successful completion
    if (data.status === 'SUCCEEDED') {
      const modelUrls = [
        data.model_urls.glb,
        data.model_urls.obj,
        data.model_urls.fbx,
        data.model_urls.usdz
      ].filter(Boolean);

      // Process texture URLs
      const textureUrls = data.texture_urls?.map(texture => ({
        baseColor: texture.base_color,
        metallic: texture.metallic,
        normal: texture.normal,
        roughness: texture.roughness
      }));

      console.log('[API] Processed texture URLs:', textureUrls);

      await updateHistory(
        taskId,
        'SUCCEEDED',
        modelUrls,
        data.thumbnail_url,
        CREDIT_COST_PER_GENERATION
      );

      return {
        status: mappedStatus,
        model_urls: {
          ...data.model_urls,
          textures: textureUrls // Include processed texture URLs
        },
        thumbnail_url: data.thumbnail_url,
        progress: 100
      };
    } 
    
    // For failure
    if (data.status === 'FAILED') {
      await updateHistory(
        taskId,
        'FAILED',
        [],
        data.thumbnail_url || '',
        CREDIT_COST_PER_GENERATION
      );

      await refundCredits(userId, data.task_error?.message || 'Task failed');

      return {
        status: 'FAILED',
        error: data.task_error?.message || 'Task failed',
        progress: data.progress || 0,
        thumbnail_url: data.thumbnail_url
      };
    }

    // For pending or processing status
    return {
      status: mappedStatus,
      progress: data.progress || 0,
      thumbnail_url: data.thumbnail_url,
      message: 'Model generation in progress'
    };
  } catch (error: any) {
    console.error('[API] Task status check failed:', {
      taskId,
      userId,
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    if (error.response?.status === 404) {
      return {
        status: 'FAILED',
        error: 'Task not found',
        progress: 0
      };
    }

    throw new Error(error.response?.data?.message || error.message || 'Failed to check task status');
  }
}

export async function POST(request: Request) {
  try {
    console.log('[API] Starting image-to-3d request processing');
    
    const { userId } = auth();
    if (!userId) {
      console.log('[API] Unauthorized request - no userId found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Log request details
    console.log('[API] Request details:', {
      method: request.method,
      contentType: request.headers.get('content-type'),
      userId,
      timestamp: new Date().toISOString()
    });

    let formData: FormData;
    try {
      formData = await request.formData();
      console.log('[API] FormData parsed successfully:', {
        keys: Array.from(formData.keys()),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[API] Error parsing FormData:', {
        error,
        contentType: request.headers.get('content-type'),
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ 
        error: 'Invalid request format. Expected multipart/form-data.' 
      }, { status: 400 });
    }

    const image = formData.get('image') as File | null;
    const taskId = formData.get('taskId') as string | null;

    console.log('[API] Request parameters:', {
      hasImage: !!image,
      imageType: image?.type,
      imageSize: image?.size,
      taskId,
      timestamp: new Date().toISOString()
    });

    const apiKey = process.env.MESHY_API_KEY;
    if (!apiKey) {
      console.error('[API] Missing API key');
      return NextResponse.json(
        { message: 'Server configuration error: API key not found' },
        { status: 500 }
      );
    }

    // If taskId is provided, check task status
    if (taskId) {
      try {
        const taskStatus = await checkTaskStatus(taskId, userId);
        return NextResponse.json(taskStatus);
      } catch (error: any) {
        console.error('[API] Error checking task status:', {
          error: error.message,
          stack: error.stack,
          taskId,
          userId,
          timestamp: new Date().toISOString()
        });
        return NextResponse.json({ 
          status: 'FAILED',
          message: error.message || 'Failed to check task status',
          error: error.message
        }, { status: 500 });
      }
    }

    // Validate image
    if (!image) {
      console.log('[API] No image provided in request');
      return NextResponse.json({ 
        error: 'No image provided',
        details: 'The request must include an image file.'
      }, { status: 400 });
    }

    // Validate image format
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(image.type)) {
      console.log('[API] Invalid image format:', {
        providedType: image.type,
        allowedTypes,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ 
        error: 'Invalid image format',
        details: 'Only JPG, JPEG, and PNG are supported.',
        providedType: image.type
      }, { status: 400 });
    }

    // Check credits
    await connectToDatabase();
    const userCredits = await UserCredits.findOne({ userId });
    const currentCredits = userCredits?.credits || 0;
    
    console.log('[API] Credit check:', {
      userId,
      currentCredits,
      requiredCredits: CREDIT_COST_PER_GENERATION,
      timestamp: new Date().toISOString()
    });

    if (!userCredits || currentCredits < CREDIT_COST_PER_GENERATION) {
      return NextResponse.json({ 
        error: 'Insufficient credits',
        details: `You need ${CREDIT_COST_PER_GENERATION} credits. Current balance: ${currentCredits}`,
        creditsNeeded: CREDIT_COST_PER_GENERATION,
        currentCredits
      }, { status: 400 });
    }

    try {
      // Convert image to base64
      const imageBuffer = await image.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      const dataUri = `data:${image.type};base64,${base64Image}`;

      console.log('[API] Image processed successfully:', {
        size: imageBuffer.byteLength,
        type: image.type,
        timestamp: new Date().toISOString()
      });

      // Create task
      const response = await axios.post(
        `${MESHY_API_BASE_URL}/image-to-3d`,
        {
          image_url: dataUri,
          ai_model: "meshy-4",
          topology: "quad",
          target_polycount: 30000,
          should_remesh: true,
          enable_pbr: false
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('[API] Meshy API response:', {
        taskId: response.data.result,
        status: response.status,
        timestamp: new Date().toISOString()
      });

      // Initialize history entry
      await updateHistory(
        response.data.result,
        'PROCESSING',
        [],
        dataUri,
        CREDIT_COST_PER_GENERATION
      );

      // Deduct credits
      await UserCredits.updateOne(
        { userId },
        { 
          $inc: { credits: -CREDIT_COST_PER_GENERATION },
          $push: {
            transactions: {
              type: 'usage',
              amount: 0,
              credits: CREDIT_COST_PER_GENERATION,
              modelType: 'image-to-3d',
              description: 'Image to 3D generation',
              status: 'success',
              timestamp: new Date()
            }
          }
        }
      );

      return NextResponse.json({
        taskId: response.data.result,
        status: 'PROCESSING',
        message: 'Task created successfully',
        thumbnail_url: dataUri
      });
    } catch (error: any) {
      console.error('[API] Task creation failed:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      // Refund credits on failure
      await refundCredits(userId, 'Task creation failed');

      return NextResponse.json({ 
        status: 'FAILED',
        message: 'Failed to create image-to-3D task',
        error: error.message,
        details: error.response?.data
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[API] Unhandled error in image-to-3d:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({
      status: 'FAILED',
      message: 'Failed to process request',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error.stack
    }, { status: 500 });
  }
} 