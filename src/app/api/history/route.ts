import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { connectToDatabase } from '@/lib/mongodb';
import { ImageTo3DHistory, TextTo3DHistory } from '@/models/History';

// GET endpoint to fetch history for a user
export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Fetch both types of history
    const [imageTo3DHistory, textTo3DHistory] = await Promise.all([
      ImageTo3DHistory.find({ userId }).sort({ createdAt: -1 }),
      TextTo3DHistory.find({ userId }).sort({ createdAt: -1 })
    ]);

    // Combine and sort by createdAt
    const combinedHistory = [...imageTo3DHistory, ...textTo3DHistory]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({
      success: true,
      history: combinedHistory
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch history' },
      { status: 500 }
    );
  }
}

// POST endpoint to create a history entry
export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, ...historyData } = body;

    await connectToDatabase();

    let historyEntry;
    if (type === 'image-to-3d') {
      historyEntry = await ImageTo3DHistory.create({
        ...historyData,
        userId
      });
    } else if (type === 'text-to-3d') {
      historyEntry = await TextTo3DHistory.create({
        ...historyData,
        userId
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid history type' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      history: historyEntry
    });
  } catch (error) {
    console.error('Error creating history entry:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create history entry' },
      { status: 500 }
    );
  }
} 