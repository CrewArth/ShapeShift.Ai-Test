import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { generateReceipt } from '@/utils/generateReceipt';
import { sendEmail } from '@/utils/sendEmail';

export const dynamic = 'force-dynamic';

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })
  : null;

export async function POST(req: Request) {
  try {
    if (!stripe) {
      return new NextResponse('Stripe is not configured', { status: 500 });
    }

    const { userId, user } = auth();
    if (!userId || !user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { amount, credits } = await req.json();
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${credits} Credits`,
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
      metadata: {
        userId,
        credits: credits.toString(),
        customerName: `${user.firstName} ${user.lastName}`,
        customerEmail: user.emailAddresses[0].emailAddress,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Payment error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!stripe) {
      return new NextResponse('Stripe is not configured', { status: 500 });
    }

    const { sessionId } = await req.json();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid' && session.metadata) {
      const metadata = session.metadata as {
        userId: string;
        credits: string;
        customerName: string;
        customerEmail: string;
      };
      
      // Generate receipt
      const receiptData = {
        orderId: session.id,
        paymentId: session.id,
        date: new Date().toLocaleDateString(),
        amount: session.amount_total! / 100,
        credits: parseInt(metadata.credits),
        customerName: metadata.customerName,
        customerEmail: metadata.customerEmail,
      };
      
      const receiptPdf = await generateReceipt(receiptData);
      
      // Send receipt via email
      await sendEmail({
        to: metadata.customerEmail,
        subject: 'Your ShapeShift AI Purchase Receipt',
        text: `Thank you for your purchase! Please find your receipt attached.\n\nOrder Details:\nCredits: ${metadata.credits}\nAmount: $${(session.amount_total! / 100).toFixed(2)}`,
        attachments: [{
          filename: `receipt-${session.id}.pdf`,
          content: receiptPdf,
          contentType: 'application/pdf'
        }],
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false });
  } catch (error) {
    console.error('Payment verification error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
} 