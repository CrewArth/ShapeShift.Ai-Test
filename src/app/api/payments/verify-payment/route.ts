import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongoose';
import UserCredits from '@/models/UserCredits';
import { topupPlans } from '@/config/subscriptionPlans';
import Razorpay from 'razorpay';
import { generateReceipt } from '@/utils/generateReceipt';
import { sendEmail } from '@/utils/sendEmail';

// Define error types
interface DatabaseError extends Error {
  code?: string;
  name: string;
  message: string;
}

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, orderId, subscriptionId, signature } = body;

    console.log('[API] Payment verification request:', {
      body,
      env: process.env.NODE_ENV,
      keySecret: process.env.KEY_SECRET?.substring(0, 10) + '...'
    });

    // Skip signature verification in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('[API] Skipping signature verification in development mode');
    } else {
      // Verify the payment signature
      const secret = process.env.KEY_SECRET || '';
      
      // Create the signature verification string based on Razorpay's format
      let text = orderId + "|" + paymentId;
      if (subscriptionId) {
        text = subscriptionId + "|" + paymentId;
      }

      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(text)
        .digest('hex');

      if (generatedSignature !== signature) {
        console.error('[API] Payment signature verification failed:', {
          generatedSignature,
          receivedSignature: signature,
          text
        });
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    await connectToDatabase();

    // Get current user from Clerk
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    try {
      // Find or create user credits
      let userCredits = await UserCredits.findOne({ userId });
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

      // Handle topup payment
      if (orderId) {
        // Get plan from orderId metadata
        const plan = await getPlanFromOrder(orderId);
        if (!plan) {
          console.error('[API] Invalid plan for order:', orderId);
          return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        console.log('[API] Processing topup payment:', {
          userId,
          planId: plan.id,
          credits: plan.credits,
          amount: plan.price
        });

        // Update user credits and add transaction
        const updatedUser = await UserCredits.findOneAndUpdate(
          { userId },
          {
            $inc: { credits: plan.credits },
            $push: {
              transactions: {
                type: 'topup',
                amount: plan.price,
                credits: plan.credits,
                razorpayPaymentId: paymentId,
                razorpayOrderId: orderId,
                status: 'success',
                timestamp: new Date()
              }
            }
          },
          { new: true }
        );

        if (!updatedUser) {
          throw new Error('Failed to update user credits');
        }

        console.log('[API] Successfully processed payment:', {
          userId,
          newCredits: updatedUser.credits,
          planCredits: plan.credits
        });

        // Generate receipt
        try {
          const receiptData = {
            orderId: orderId,
            paymentId: paymentId,
            date: new Date().toLocaleDateString(),
            amount: plan.price,
            credits: plan.credits,
            customerName: `${clerkUser.firstName} ${clerkUser.lastName}`,
            customerEmail: clerkUser.emailAddresses[0].emailAddress
          };
          
          const pdfBuffer = await generateReceipt(receiptData);
          
          // Only send email if PDF generation was successful
          if (pdfBuffer.length > 0) {
            await sendEmail({
              to: clerkUser.emailAddresses[0].emailAddress,
              subject: 'Your ShapeShift AI Purchase Receipt',
              text: 'Thank you for your purchase! Please find your receipt attached.',
              attachments: [{
                filename: `receipt-${orderId}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
              }]
            }).catch(error => {
              console.error('[API] Failed to send receipt email:', error);
              // Don't throw error, continue with response
            });
          } else {
            console.warn('[API] Receipt generation failed, skipping email');
          }
        } catch (error) {
          console.error('[API] Receipt generation/email error:', error);
          // Don't throw error, continue with response
        }

        return NextResponse.json({
          success: true,
          currentCredits: updatedUser.credits,
          transaction: {
            type: 'topup',
            credits: plan.credits,
            amount: plan.price,
            timestamp: new Date()
          }
        });
      }

      // Handle subscription payment
      if (subscriptionId) {
        // Create transaction record for subscription
        await UserCredits.findOneAndUpdate(
          { userId },
          {
            $push: {
              transactions: {
                type: 'subscription',
                razorpayPaymentId: paymentId,
                razorpaySubscriptionId: subscriptionId,
                status: 'success',
                timestamp: new Date()
              }
            }
          }
        );

        return NextResponse.json({ 
          success: true,
          transaction: {
            type: 'subscription',
            status: 'success',
            timestamp: new Date()
          }
        });
      }

      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
    } catch (dbError) {
      const error = dbError as DatabaseError;
      console.error('[API] Database error:', error);
      return NextResponse.json(
        { error: 'Database operation failed', details: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    const err = error as Error;
    console.error('[API] Payment verification error:', err);
    return NextResponse.json(
      { error: 'Failed to verify payment', details: err.message },
      { status: 500 }
    );
  }
}

// Helper function to get plan details from order ID
async function getPlanFromOrder(orderId: string): Promise<typeof topupPlans[keyof typeof topupPlans] | null> {
  try {
    // Get the plan ID from the order notes
    const instance = getRazorpayInstance();
    const order = await instance.orders.fetch(orderId);
    const planId = order.notes?.planId;
    
    if (!planId) {
      console.error('[API] No plan ID found in order notes:', orderId);
      return null;
    }

    const plan = topupPlans[planId as keyof typeof topupPlans];
    if (!plan) {
      console.error('[API] Invalid plan ID in order notes:', planId);
      return null;
    }

    return plan;
  } catch (error) {
    console.error('[API] Error getting plan from order:', error);
    return null;
  }
}

function getRazorpayInstance(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay API keys are not configured');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
} 