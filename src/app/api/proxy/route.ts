import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const modelUrl = url.searchParams.get('url');

    if (!modelUrl) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    // Handle URL decoding
    let targetUrl: string;
    try {
      // First, try to decode if it's encoded
      targetUrl = decodeURIComponent(modelUrl);
      // Validate the URL
      new URL(targetUrl);
    } catch (error) {
      console.error('URL validation error:', error);
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Set up headers for the request
    const headers: Record<string, string> = {
      'Accept': '*/*',
    };

    // Add Meshy API key for Meshy URLs
    if (targetUrl.includes('meshy.ai')) {
      const apiKey = process.env.MESHY_API_KEY;
      if (!apiKey) {
        throw new Error('MESHY_API_KEY not configured');
      }
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    console.log('Proxying request to:', targetUrl);
    
    const response = await fetch(targetUrl, {
      headers,
      redirect: 'follow',
    });

    if (!response.ok) {
      console.error('Proxy error:', {
        status: response.status,
        statusText: response.statusText,
        url: targetUrl
      });
      return NextResponse.json({ 
        error: `Failed to fetch: ${response.status} ${response.statusText}` 
      }, { status: response.status });
    }

    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Log successful proxy
    console.log('Successfully proxied:', {
      url: targetUrl,
      contentType,
      size: blob.size
    });

    // Return the proxied response with appropriate headers
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000',
      }
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch resource' },
      { status: 500 }
    );
  }
} 