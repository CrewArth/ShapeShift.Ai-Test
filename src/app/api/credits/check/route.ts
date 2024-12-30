import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { connectToDatabase } from '@/lib/mongodb';
import UserCredits from '@/models/UserCredits';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    let userCredits = await UserCredits.findOne({ userId });

    // If user doesn't exist, create with default credits
    if (!userCredits) {
      userCredits = await UserCredits.create({
        userId,
        credits: 25, // Default free credits
        subscription: {
          type: 'none',
          status: 'active',
        },
      });
    }

    // Check if subscription has expired
    if (
      userCredits.subscription.type !== 'none' &&
      userCredits.subscription.endDate &&
      new Date(userCredits.subscription.endDate) < new Date()
    ) {
      await UserCredits.updateOne(
        { userId },
        {
          $set: {
            'subscription.status': 'expired',
            'subscription.type': 'none',
          },
        }
      );
      userCredits.subscription.status = 'expired';
      userCredits.subscription.type = 'none';
    }

    return NextResponse.json({
      credits: userCredits.credits,
      subscription: {
        type: userCredits.subscription.type,
        status: userCredits.subscription.status,
        endDate: userCredits.subscription.endDate,
      },
    });
  } catch (error) {
    console.error('Error checking credits:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check credits' },
      { status: 500 }
    );
  }
} 