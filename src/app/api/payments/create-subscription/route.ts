import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs';
import { createSubscription, createCustomer } from '@/lib/razorpay';
import { connectToDatabase } from '@/lib/mongodb';
import UserCredits from '@/models/UserCredits';
import { subscriptionPlans } from '@/config/subscriptionPlans';

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { planId } = body;

    // Validate plan
    const plan = subscriptionPlans[planId as keyof typeof subscriptionPlans];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Get user details from Clerk
    const user = await clerkClient.users.getUser(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create or get Razorpay customer
    const customer = await createCustomer(
      `${user.firstName} ${user.lastName}`,
      user.emailAddresses[0].emailAddress
    );

    // Create subscription
    const subscription = await createSubscription(planId, customer.id);

    // Store subscription details in user credits
    await connectToDatabase();
    await UserCredits.findOneAndUpdate(
      { userId },
      {
        $set: {
          'subscription.type': planId,
          'subscription.razorpaySubscriptionId': subscription.id,
          'subscription.startDate': new Date(),
          'subscription.endDate': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          'subscription.status': 'active',
        },
        $push: {
          transactions: {
            type: 'subscription',
            amount: plan.price,
            credits: plan.credits,
            razorpayPaymentId: subscription.id,
            status: 'pending',
          },
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      subscriptionId: subscription.id,
      amount: subscription.total_count * plan.price,
      currency: 'INR',
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create subscription' },
      { status: 500 }
    );
  }
} 