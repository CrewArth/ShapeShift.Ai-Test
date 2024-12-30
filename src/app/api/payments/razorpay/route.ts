import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongoose';
import UserCredits from '@/models/UserCredits';
import { generateReceipt } from '@/utils/generateReceipt';
import { sendEmail } from '@/utils/sendEmail';

// Initialize Razorpay
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.error('[API] Razorpay API keys not configured');
  throw new Error('Razorpay API keys not configured');
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function connectWithRetry(retries = MAX_RETRIES): Promise<void> {
  try {
    await connectToDatabase();
  } catch (error) {
    if (retries > 0) {
      console.log(`[MongoDB] Retrying connection... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectWithRetry(retries - 1);
    }
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    console.log('[API] Received order creation request');
    
    const { userId, user } = auth();
    if (!userId || !user) {
      console.error('[API] Unauthorized request');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { amount, credits } = await req.json();
    console.log('[API] Order details:', { amount, credits, userId });

    // Try to connect to MongoDB with retries
    try {
      await connectWithRetry();
    } catch (error) {
      console.error('[API] MongoDB connection failed after retries:', error);
      return new NextResponse(
        JSON.stringify({
          error: 'Database connection failed',
          details: 'Please try again in a few moments'
        }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const orderNotes = {
      userId,
      credits: credits.toString(),
      customerName: `${user.firstName} ${user.lastName}`,
      customerEmail: user.emailAddresses[0].emailAddress,
    };

    console.log('[API] Creating Razorpay order with notes:', orderNotes);

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: orderNotes,
    });

    console.log('[API] Razorpay order created:', {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: keyId,
    });
  } catch (error) {
    console.error('[API] Razorpay order creation error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to create order',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { orderId, paymentId, signature } = await req.json();

    // Verify payment signature
    const text = orderId + '|' + paymentId;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest('hex');

    if (generated_signature !== signature) {
      return new NextResponse('Invalid signature', { status: 400 });
    }

    // Fetch order details
    const order = await razorpay.orders.fetch(orderId);
    
    // Extract notes with type assertion
    const notes = order.notes as Record<string, string>;
    const userId = notes.userId;
    const credits = notes.credits;
    const customerName = notes.customerName;
    const customerEmail = notes.customerEmail;

    if (!userId || !credits || !customerName || !customerEmail) {
      throw new Error('Invalid order notes');
    }

    await connectToDatabase();

    // Update user credits
    const updatedUser = await UserCredits.findOneAndUpdate(
      { userId },
      {
        $inc: { credits: parseInt(credits) },
        $push: {
          transactions: {
            type: 'topup',
            amount: Number(order.amount) / 100, // Convert from paise to rupees
            credits: parseInt(credits),
            razorpayPaymentId: paymentId,
            razorpayOrderId: orderId,
            status: 'success',
            timestamp: new Date(),
          },
        },
      },
      { new: true, upsert: true }
    );

    if (!updatedUser) {
      throw new Error('Failed to update user credits');
    }

    try {
      // Generate and send receipt
      const receiptData = {
        orderId,
        paymentId,
        date: new Date().toLocaleDateString(),
        amount: Number(order.amount) / 100,
        credits: parseInt(credits),
        customerName,
        customerEmail,
      };

      const receiptPdf = await generateReceipt(receiptData);

      await sendEmail({
        to: customerEmail,
        subject: 'Your ShapeShift AI Purchase Receipt',
        text: `Thank you for your purchase!\n\nOrder Details:\nCredits: ${credits}\nAmount: ₹${(Number(order.amount) / 100).toFixed(2)}`,
        attachments: [{
          filename: `receipt-${orderId}.pdf`,
          content: receiptPdf,
          contentType: 'application/pdf'
        }],
      });
    } catch (error) {
      // Log receipt generation/email error but don't fail the transaction
      console.error('Receipt generation/email error:', error);
    }

    return NextResponse.json({
      success: true,
      currentCredits: updatedUser.credits,
    });
  } catch (error) {
    console.error('Razorpay payment verification error:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Payment verification failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 