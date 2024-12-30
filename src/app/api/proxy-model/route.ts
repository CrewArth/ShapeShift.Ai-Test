import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    const isForumView = request.nextUrl.searchParams.get('isForumView') === 'true';
    
    if (!url) {
      return new NextResponse('Missing URL parameter', { status: 400 });
    }

    // Handle double-encoded URLs (when the URL contains another proxy URL)
    let finalUrl = url;
    if (url.includes('/api/proxy')) {
      const nestedUrl = new URL(url, request.url).searchParams.get('url');
      if (nestedUrl) {
        finalUrl = decodeURIComponent(nestedUrl);
      }
    }

    console.log('Fetching model from:', finalUrl, { isForumView }); // Debug log

    // Check if the request is for a forum model
    const isForum = isForumView || request.headers.get('Referer')?.includes('/forum') || false;
    const { userId } = auth();

    // For forum views, always use API key
    const headers: HeadersInit = {
      'Accept': '*/*',
    };

    if (isForum || userId) {
      headers['Authorization'] = `Bearer ${process.env.API_KEY}`;
    }

    const response = await fetch(finalUrl, { headers });

    if (!response.ok) {
      console.error('Fetch error:', {
        status: response.status,
        statusText: response.statusText,
        url: finalUrl,
        isForum,
        hasAuth: !!userId
      });
      
      // Handle different error cases
      if (response.status === 401) {
        if (isForum) {
          // For forum views, try to fetch with API key
          const authResponse = await fetch(finalUrl, {
            headers: {
              'Accept': '*/*',
              'Authorization': `Bearer ${process.env.API_KEY}`
            }
          });

          if (authResponse.ok) {
            const buffer = await authResponse.arrayBuffer();
            return new NextResponse(buffer, {
              headers: {
                'Content-Type': 'model/gltf-binary',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=31536000',
              },
            });
          }
        }
        return new NextResponse('Please sign in to view this model', { status: 401 });
      }

      if (response.status === 403) {
        return new NextResponse('Access denied', { status: 403 });
      }

      if (response.status === 404) {
        return new NextResponse('Model not found', { status: 404 });
      }

      return new NextResponse(`Failed to fetch model: ${response.statusText}`, { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'model/gltf-binary',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error proxying model:', {
      error,
      url: request.nextUrl.toString(),
      originalUrl: request.nextUrl.searchParams.get('url')
    });
    return new NextResponse(error instanceof Error ? error.message : 'Internal Server Error', { status: 500 });
  }
}
