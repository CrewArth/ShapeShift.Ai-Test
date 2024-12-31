import { NextRequest, NextResponse } from 'next/server';
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
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED', 
  modelUrls: string[] = [], 
  thumbnailUrl: string = '',
  creditsUsed: number = 1
) {
  try {
    const userId = auth().userId;
    if (!userId) {
      console.error('[API] No userId found while updating history');
      return;
    }

    const update = {
      userId,
      type: 'image-to-3d',
      status,
      modelUrl: modelUrls[0] || '',
      thumbnailUrl: thumbnailUrl || '',
      taskError: { message: '' },
      creditsUsed,
      updatedAt: new Date()
    };

    // Only set createdAt on first creation
    const options = {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    };

    const result = await ImageTo3DHistory.findOneAndUpdate(
      { taskId },
      update,
      options
    );

    console.log('[API] History entry updated:', {
      taskId,
      status,
      userId,
      success: !!result
    });
  } catch (error) {
    console.error('[API] Error updating history:', error);
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

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Starting image-to-3d request');
    
    const { userId } = auth();
    if (!userId) {
      console.log('[API] Unauthorized - no userId found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    // Check credits
    const userCredits = await UserCredits.findOne({ userId });
    if (!userCredits || userCredits.credits < CREDIT_COST_PER_GENERATION) {
      console.log('[API] Insufficient credits:', {
        userId,
        currentCredits: userCredits?.credits,
        required: CREDIT_COST_PER_GENERATION
      });
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 400 }
      );
    }

    // Get the image from the request
    let formData: FormData;
    try {
      formData = await request.formData();
      console.log('[API] FormData received:', {
        keys: Array.from(formData.keys()),
        hasImage: formData.has('image')
      });
    } catch (error) {
      console.error('[API] FormData parsing error:', error);
      return NextResponse.json({ 
        error: 'Invalid request format. Expected multipart/form-data.' 
      }, { status: 400 });
    }

    const image = formData.get('image') as File | null;
    if (!image) {
      console.log('[API] No image found in request');
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    console.log('[API] Image details:', {
      name: image.name,
      type: image.type,
      size: image.size
    });

    // Validate image format
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(image.type)) {
      console.log('[API] Invalid image type:', image.type);
      return NextResponse.json({ 
        error: 'Invalid image format. Only JPG and PNG are supported.' 
      }, { status: 400 });
    }

    // Validate image size (max 10MB)
    if (image.size > 10 * 1024 * 1024) {
      console.log('[API] Image too large:', image.size);
      return NextResponse.json({ 
        error: 'Image size should be less than 10MB' 
      }, { status: 400 });
    }

    // Convert image to base64
    const imageBuffer = await image.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const dataUri = `data:${image.type};base64,${base64Image}`;

    console.log('[API] Image processed successfully');

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
          'Authorization': `Bearer ${process.env.MESHY_API_KEY}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('[API] Meshy API response:', {
      taskId: response.data.result,
      status: response.status
    });

    // Deduct credits
    const updatedCredits = await UserCredits.findOneAndUpdate(
      { userId },
      { 
        $inc: { credits: -CREDIT_COST_PER_GENERATION },
        $push: {
          transactions: {
            type: 'usage',
            credits: -CREDIT_COST_PER_GENERATION,
            modelType: 'image-to-3d',
            timestamp: new Date(),
            status: 'success'
          }
        }
      },
      { new: true }
    );

    // Initialize history entry
    await updateHistory(
      response.data.result,
      'PROCESSING',
      [],
      dataUri,
      CREDIT_COST_PER_GENERATION
    );

    // Return the result along with updated credits
    return NextResponse.json({
      taskId: response.data.result,
      status: 'PROCESSING',
      message: 'Task created successfully',
      thumbnail_url: dataUri,
      remainingCredits: updatedCredits.credits
    });

  } catch (error) {
    console.error('[API] Error in image-to-3d:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process image' },
      { status: 500 }
    );
  }
}

// Add GET method to handle status checks
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = request.nextUrl.searchParams.get('taskId');
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    console.log('[API] Checking task status:', { taskId, userId });

    const response = await axios.get(
      `${MESHY_API_BASE_URL}/image-to-3d/${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.MESHY_API_KEY}`,
          'Accept': 'application/json'
        }
      }
    );

    const data = response.data;
    console.log('[API] Task status response:', {
      taskId,
      status: data.status,
      progress: data.progress
    });

    // Map Meshy API status to our status
    const statusMap = {
      'SUCCEEDED': 'SUCCEEDED',
      'FAILED': 'FAILED',
      'PENDING': 'PROCESSING',
      'PROCESSING': 'PROCESSING'
    } as const;

    const mappedStatus = statusMap[data.status as keyof typeof statusMap] || 'PROCESSING';

    if (data.status === 'SUCCEEDED') {
      return NextResponse.json({
        status: mappedStatus,
        progress: 100,
        model_urls: {
          ...data.model_urls,
          textures: data.texture_urls
        },
        thumbnail_url: data.thumbnail_url
      });
    }

    if (data.status === 'FAILED') {
      return NextResponse.json({
        status: 'FAILED',
        error: data.task_error?.message || 'Task failed',
        progress: data.progress || 0
      });
    }

    return NextResponse.json({
      status: mappedStatus,
      progress: data.progress || 0,
      thumbnail_url: data.thumbnail_url,
      message: 'Model generation in progress'
    });

  } catch (error) {
    console.error('[API] Status check error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check status' },
      { status: 500 }
    );
  }
} 
