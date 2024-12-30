import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { MESHY_API_V2_BASE_URL } from '@/config/constants';
import { auth } from '@clerk/nextjs';

async function updateHistory(taskId: string, status: string, modelUrls: string[], prompt: string, creditsUsed: number = 1) {
  try {
    const response = await fetch('/api/history/update-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId,
        type: 'text-to-3d',
        status,
        modelUrls,
        prompt,
        creditsUsed
      })
    });

    if (!response.ok) {
      console.error('Failed to update history:', await response.text());
    }
  } catch (error) {
    console.error('Error updating history:', error);
  }
}

async function checkTaskStatus(taskId: string) {
  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey) {
    throw new Error('MESHY_API_KEY not configured');
  }

  const response = await axios.get(
    `${MESHY_API_V2_BASE_URL}/text-to-3d/${taskId}`,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // If task is completed, update history
  if (response.data.status === 'COMPLETED' && response.data.result?.urls) {
    await updateHistory(
      taskId,
      'success',
      response.data.result.urls,
      response.data.prompt || ''
    );
  } else if (response.data.status === 'FAILED') {
    await updateHistory(
      taskId,
      'failed',
      [],
      response.data.prompt || ''
    );
  }

  return response.data;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.MESHY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'MESHY_API_KEY not configured' }, { status: 500 });
    }

    const {
      taskId,
      prompt,
      negative_prompt,
      mode,
      art_style,
      ai_model,
      topology,
      target_polycount,
      should_remesh,
      preview_task_id
    } = await request.json();

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };

    // If taskId is provided, check task status
    if (taskId) {
      try {
        const taskStatus = await checkTaskStatus(taskId);
        return NextResponse.json(taskStatus);
      } catch (error: any) {
        if (error.response?.status === 404) {
          // Update history for failed task
          await updateHistory(taskId, 'failed', [], prompt || '');
          return NextResponse.json({ 
            status: 'FAILED',
            message: 'Task not found'
          }, { status: 404 });
        }
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Failed to check task status';
        return NextResponse.json({ message }, { status });
      }
    }

    // Create new task
    try {
      console.log('[API] Creating text-to-3d task with payload:', {
        prompt,
        mode,
        art_style,
        ai_model,
        preview_task_id
      });

      const payload = mode === 'refine' ? {
        mode,
        preview_task_id,
        enable_pbr: false
      } : {
        prompt,
        negative_prompt,
        mode,
        art_style,
        ai_model,
        topology,
        target_polycount,
        should_remesh
      };

      const response = await axios.post(
        `${MESHY_API_V2_BASE_URL}/text-to-3d`,
        payload,
        { headers }
      );
      
      console.log('[API] Task creation response:', {
        taskId: response.data.result,
        status: response.status,
        timestamp: new Date().toISOString()
      });

      // Initialize history entry for new task
      await updateHistory(
        response.data.result,
        'pending',
        [],
        prompt || ''
      );

      return NextResponse.json({
        taskId: response.data.result,
        status: 'PENDING',
        message: 'Task created successfully'
      });
    } catch (error: any) {
      console.error('[API] Task creation failed:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || 'Failed to create text-to-3D task';
      return NextResponse.json({ message }, { status });
    }
  } catch (error) {
    console.error('Error in text-to-3d:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
} 