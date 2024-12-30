import { NextResponse } from 'next/server';
import axios from 'axios';

const MESHY_API_BASE_URL = 'https://api.meshy.ai/openapi/v1';

// Helper function to check task status
async function checkTaskStatus(taskId: string, apiKey: string) {
  const headers = { 
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json'
  };

  try {
    const response = await axios.get(
      `${MESHY_API_BASE_URL}/text-to-texture/${taskId}`,
      { headers }
    );
    return response.data;
  } catch (error: any) {
    console.error('[API] Texture task status check failed:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taskId, modelUrl, objectPrompt, stylePrompt, artStyle, negativePrompt } = body;

    const apiKey = process.env.MESHY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { message: 'Server configuration error: API key not found' },
        { status: 500 }
      );
    }

    const headers = { 
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    // If taskId is provided, check task status
    if (taskId) {
      try {
        const taskStatus = await checkTaskStatus(taskId, apiKey);
        return NextResponse.json(taskStatus);
      } catch (error: any) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Failed to check texture task status';
        return NextResponse.json({ message }, { status });
      }
    }

    // Create new texturing task
    try {
      const response = await axios.post(
        `${MESHY_API_BASE_URL}/text-to-texture`,
        {
          model_url: modelUrl,
          object_prompt: objectPrompt,
          style_prompt: stylePrompt,
          art_style: artStyle || 'realistic',
          negative_prompt: negativePrompt,
          enable_original_uv: true,
          enable_pbr: true,
          resolution: '2048'
        },
        { headers }
      );
      
      return NextResponse.json({
        taskId: response.data.result,
        status: 'PENDING'
      });
    } catch (error: any) {
      console.error('[API] Texture task creation failed:', error);
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || 'Failed to create texturing task';
      return NextResponse.json({ message }, { status });
    }
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 