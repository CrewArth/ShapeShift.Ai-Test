import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { connectToDatabase } from '@/lib/mongodb';
import UserCredits from '@/models/UserCredits';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const userCredits = await UserCredits.findOne({ userId });
    
    return NextResponse.json({
      credits: userCredits?.credits || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Error fetching credit balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit balance' },
      { status: 500 }
    );
  }
} 