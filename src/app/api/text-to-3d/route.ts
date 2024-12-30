import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { MESHY_API_V2_BASE_URL } from '@/config/constants';
import { connectToDatabase } from '@/lib/mongodb';
import UserCredits from '@/models/UserCredits';
import { CREDIT_COST_PER_GENERATION } from '@/config/subscriptionPlans';

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { taskId, prompt, negative_prompt, art_style, mode, preview_task_id, enable_pbr } = data;

    // If taskId is provided, we're checking status
    if (taskId) {
      try {
        const response = await fetch(`${MESHY_API_V2_BASE_URL}/text-to-3d/${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.MESHY_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.json();
          return NextResponse.json(error, { status: response.status });
        }

        const taskData = await response.json();
        return NextResponse.json(taskData);
      } catch (error: any) {
        return NextResponse.json({ 
          error: error.message || 'Failed to check task status' 
        }, { status: 500 });
      }
    }

    // Check credits before starting generation
    await connectToDatabase();
    const userCredits = await UserCredits.findOne({ userId });
    const currentCredits = userCredits?.credits || 0;

    // Only deduct credits for preview mode, not for refine mode
    if (mode === 'preview') {
      if (!userCredits || currentCredits < CREDIT_COST_PER_GENERATION) {
        return NextResponse.json({
          error: `Insufficient credits. You need ${CREDIT_COST_PER_GENERATION} credits to generate a 3D model.`,
          creditsNeeded: CREDIT_COST_PER_GENERATION,
          currentCredits,
        }, { status: 400 });
      }

      // Deduct credits before starting the task
      await UserCredits.updateOne(
        { userId },
        { 
          $inc: { credits: -CREDIT_COST_PER_GENERATION },
          $push: {
            transactions: {
              type: 'usage',
              modelType: 'text-to-3d',
              prompt: prompt,
              credits: -CREDIT_COST_PER_GENERATION,
              description: 'Text to 3D generation (including textures)',
              status: 'success',
              timestamp: new Date()
            }
          }
        }
      );
    }

    // Create new task
    let endpoint = `${MESHY_API_V2_BASE_URL}/text-to-3d`;
    let payload: any = {};

    try {
      console.log('[API] Creating text-to-3d task with payload:', {
        prompt,
        mode,
        art_style,
        negative_prompt,
        preview_task_id
      });

      if (mode === 'preview') {
        payload = {
          mode: 'preview',
          prompt,
          negative_prompt,
          art_style,
          ai_model: 'meshy-4',
          topology: 'quad',
          target_polycount: 30000,
          should_remesh: true,
          guidance_scale: 7.5,
          num_inference_steps: 100,
          scheduler: 'euler_a',
          enable_pbr: false,
          turbo_mode: false
        };
      } else if (mode === 'refine') {
        console.log('[API] Starting refinement with task ID:', preview_task_id);
        payload = {
          mode: 'refine',
          preview_task_id,
          enable_pbr: false
        };
      }

      console.log('[API] Sending request to Meshy with payload:', payload);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.MESHY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      console.log('[API] Meshy API response:', {
        status: response.status,
        data: responseData,
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        console.error('[API] Meshy API error:', {
          status: response.status,
          data: responseData,
          timestamp: new Date().toISOString()
        });

        // Refund credits on failure
        await UserCredits.updateOne(
          { userId },
          { 
            $inc: { credits: CREDIT_COST_PER_GENERATION },
            $push: {
              transactions: {
                type: 'refund',
                credits: CREDIT_COST_PER_GENERATION,
                description: 'Refund for failed Text to 3D generation',
                status: 'success',
                timestamp: new Date()
              }
            }
          }
        );

        return NextResponse.json(responseData, { status: response.status });
      }

      console.log('[API] Task created successfully:', {
        taskId: responseData.result,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({ taskId: responseData.result });
    } catch (error: any) {
      console.error('[API] Error in text-to-3d route:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[API] Error in text-to-3d route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
