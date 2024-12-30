import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get URL and format from query parameters
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const format = searchParams.get('format');

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('[API] Downloading model:', {
      url,
      format,
      userId,
      timestamp: new Date().toISOString()
    });

    // Download the model through our server with Meshy API key
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${process.env.MESHY_API_KEY}`,
        'Accept': 'application/json',
      },
      responseType: 'arraybuffer'
    });

    // Get the content type from the response
    const contentType = response.headers['content-type'];

    // Create the response with the file data
    return new NextResponse(response.data, {
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename=model.${format || 'glb'}`
      }
    });
  } catch (error: any) {
    console.error('[API] Download error:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });

    return NextResponse.json(
      { error: 'Failed to fetch model', details: error.message },
      { status: error.response?.status || 500 }
    );
  }
} 