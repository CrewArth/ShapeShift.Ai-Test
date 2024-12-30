import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface MeshyResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  created_at: string;
  updated_at: string;
  result?: {
    preview_url?: string;
    model_url?: string;
    texture_url?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface TextureRequest {
  model_url: string;
  style: 'realistic' | 'cartoon' | 'stylized';
  material: 'plastic' | 'metal' | 'wood';
  resolution: '1k' | '2k' | '4k';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('task_id');
  const API_KEY = process.env.NEXT_PUBLIC_MESHY_API_KEY;

  if (!taskId) {
    return NextResponse.json({ message: 'Task ID is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.meshy.ai/v2/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking task status:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to check task status' 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  console.log('Starting Meshy API request...');
  const API_KEY = process.env.NEXT_PUBLIC_MESHY_API_KEY;
  
  try {
    // Check if this is a texture request
    const contentType = req.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      // Handle texture application
      const body = await req.json() as TextureRequest;
      console.log('Applying texture with options:', body);

      const response = await fetch('https://api.meshy.ai/v2/text-to-texture/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model_url: body.model_url,
          style: body.style,
          material_type: body.material,
          resolution: body.resolution,
          format: 'png'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to apply texture');
      }

      return NextResponse.json({
        success: true,
        task_id: data.task_id,
        status: data.status,
        message: 'Texture application started'
      });
    } else {
      // Handle image-to-3D conversion
      const formData = await req.formData();
      const imageFile = formData.get('image') as File;
      
      if (!imageFile) {
        return NextResponse.json({
          error: 'No image file provided'
        }, { status: 400 });
      }

      console.log('Processing image:', {
        name: imageFile.name,
        type: imageFile.type,
        size: imageFile.size
      });

      const meshyFormData = new FormData();
      meshyFormData.append('image', imageFile);
      meshyFormData.append('mode', 'mesh');
      meshyFormData.append('format', 'glb');

      const response = await fetch('https://api.meshy.ai/v2/image-to-3d/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json'
        },
        body: meshyFormData
      });

      const data: MeshyResponse = await response.json();

      if (!response.ok) {
        console.error('Meshy API Error:', data);
        return NextResponse.json({
          error: data.error?.message || 'Failed to create 3D model',
          status: response.status,
          details: data
        }, { status: response.status });
      }

      return NextResponse.json({
        success: true,
        task_id: data.task_id,
        status: data.status,
        message: 'Model generation started',
        created_at: data.created_at
      });
    }
  } catch (error) {
    console.error('Error in Meshy API request:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 