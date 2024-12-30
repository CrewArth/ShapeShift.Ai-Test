import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { connectToDatabase } from '@/lib/mongodb';
import UserCredits from '@/models/UserCredits';
import { CREDIT_COST_PER_GENERATION } from '@/config/subscriptionPlans';

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const userCredits = await UserCredits.findOne({ userId });

    if (!userCredits) {
      return NextResponse.json({ error: 'User credits not found' }, { status: 404 });
    }

    // Check if user has enough credits
    if (userCredits.credits < CREDIT_COST_PER_GENERATION) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          creditsNeeded: CREDIT_COST_PER_GENERATION,
          currentCredits: userCredits.credits
        },
        { status: 400 }
      );
    }

    // Deduct credits and record transaction
    await UserCredits.updateOne(
      { userId },
      {
        $inc: { credits: -CREDIT_COST_PER_GENERATION },
        $push: {
          transactions: {
            type: 'usage',
            credits: -CREDIT_COST_PER_GENERATION,
            status: 'success',
          },
        },
      }
    );

    return NextResponse.json({
      success: true,
      remainingCredits: userCredits.credits - CREDIT_COST_PER_GENERATION,
      deductedCredits: CREDIT_COST_PER_GENERATION,
    });
  } catch (error) {
    console.error('Error deducting credits:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to deduct credits' },
      { status: 500 }
    );
  }
} 