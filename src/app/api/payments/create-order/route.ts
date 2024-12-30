import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createOrder } from '@/lib/razorpay';
import { connectToDatabase } from '@/lib/mongoose';
import UserCredits from '@/models/UserCredits';
import { topupPlans } from '@/config/subscriptionPlans';

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { planId } = body;

    console.log('[API] Creating order:', {
      userId,
      planId,
      keyId: process.env.RAZORPAY_KEY_ID?.substring(0, 10) + '...',
      keySecret: process.env.RAZORPAY_KEY_SECRET?.substring(0, 5) + '...',
      environment: process.env.NODE_ENV
    });

    // Validate plan
    const plan = topupPlans[planId as keyof typeof topupPlans];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Create Razorpay order
    try {
      // Amount is already in paise in the plan configuration
      const amountInPaise = plan.price;
      
      console.log('[API] Creating Razorpay order:', {
        amount: amountInPaise,
        planId,
        planCredits: plan.credits
      });

      const order = await createOrder(amountInPaise, planId);
      console.log('[API] Order created successfully:', {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      });

      // Store order details in database
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

      return NextResponse.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      });
    } catch (razorpayError: any) {
      console.error('[API] Razorpay error:', {
        error: razorpayError.message,
        details: razorpayError.error,
        statusCode: razorpayError.statusCode,
        stack: razorpayError.stack
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to create order',
          details: razorpayError.error?.description || razorpayError.message
        },
        { status: razorpayError.statusCode || 500 }
      );
    }
  } catch (error: any) {
    console.error('[API] Error creating order:', {
      error: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
} 