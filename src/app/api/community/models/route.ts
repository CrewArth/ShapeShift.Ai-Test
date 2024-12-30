import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CommunityModel from '@/models/CommunityModel';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('Database connected');

    let query = {};
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } }
        ]
      };
    }

    console.log('Fetching models with query:', query);
    const models = await CommunityModel.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
      .exec();

    console.log(`Found ${models.length} models`);

    return NextResponse.json({
      success: true,
      models
    });
  } catch (error) {
    console.error('Error fetching community models:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch models',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 