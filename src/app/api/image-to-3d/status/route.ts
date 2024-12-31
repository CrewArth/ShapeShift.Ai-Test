import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import axios from 'axios';
import { MESHY_API_BASE_URL } from '@/config/constants';

export const dynamic = 'force-dynamic';

// Function to add cache buster to URLs
function addCacheBuster(url: string): string {
  const timestamp = Date.now();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${timestamp}`;
}

// Function to add cache busters to model URLs
function addCacheBustersToUrls(modelUrls: any) {
  if (!modelUrls) return modelUrls;

  const urls = { ...modelUrls };
  // Add cache busters to main model URLs
  if (urls.glb) urls.glb = addCacheBuster(urls.glb);
  if (urls.obj) urls.obj = addCacheBuster(urls.obj);
  if (urls.fbx) urls.fbx = addCacheBuster(urls.fbx);
  if (urls.usdz) urls.usdz = addCacheBuster(urls.usdz);

  // Add cache busters to texture URLs
  if (urls.textures && Array.isArray(urls.textures)) {
    urls.textures = urls.textures.map((texture: any) => ({
      base_color: texture.base_color ? addCacheBuster(texture.base_color) : null,
      metallic: texture.metallic ? addCacheBuster(texture.metallic) : null,
      normal: texture.normal ? addCacheBuster(texture.normal) : null,
      roughness: texture.roughness ? addCacheBuster(texture.roughness) : null,
    }));
  }

  return urls;
}

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

    // Create response with cache control headers
    const createResponse = (data: any) => {
      const response = NextResponse.json(data);
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    };

    if (data.status === 'SUCCEEDED') {
      // Add cache busters to all URLs
      const modelUrls = addCacheBustersToUrls(data.model_urls);
      const thumbnailUrl = addCacheBuster(data.thumbnail_url);

      return createResponse({
        status: mappedStatus,
        progress: 100,
        model_urls: modelUrls,
        thumbnail_url: thumbnailUrl,
        timestamp: Date.now() // Add timestamp to force client-side state update
      });
    }

    if (data.status === 'FAILED') {
      return createResponse({
        status: 'FAILED',
        error: data.task_error?.message || 'Task failed',
        progress: data.progress || 0,
        timestamp: Date.now()
      });
    }

    return createResponse({
      status: mappedStatus,
      progress: data.progress || 0,
      thumbnail_url: data.thumbnail_url ? addCacheBuster(data.thumbnail_url) : null,
      message: 'Model generation in progress',
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('[API] Status check error:', error);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return NextResponse.json({
        status: 'FAILED',
        error: 'Task not found',
        progress: 0,
        timestamp: Date.now()
      }, { status: 404 });
    }
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to check status',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
} 
