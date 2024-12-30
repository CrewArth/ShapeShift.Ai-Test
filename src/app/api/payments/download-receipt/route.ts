import { auth, currentUser } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { generateReceipt } from '@/utils/generateReceipt';
import { connectToDatabase } from '@/lib/mongoose';
import UserCredits from '@/models/UserCredits';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { userId } = auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - Please sign in again' }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('paymentId');
    if (!paymentId) {
      return new NextResponse(
        JSON.stringify({ error: 'Payment ID is required' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    await connectToDatabase();

    // Find the transaction
    const userCredits = await UserCredits.findOne({
      userId,
      'transactions.razorpayPaymentId': paymentId,
      'transactions.status': 'success'
    });

    if (!userCredits) {
      return new NextResponse(
        JSON.stringify({ error: 'Transaction not found' }),
        { 
          status: 404, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const transaction = userCredits.transactions.find(
      (t: any) => t.razorpayPaymentId === paymentId
    );

    if (!transaction) {
      return new NextResponse(
        JSON.stringify({ error: 'Transaction details not found' }),
        { 
          status: 404, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get user email
    const userEmail = user.emailAddresses.find(email => email.id === user.primaryEmailAddressId)?.emailAddress || '';

    try {
      // Generate basic receipt
      const receiptData = {
        orderId: '', // Removed as requested
        paymentId: paymentId,
        date: new Date(transaction.timestamp).toLocaleDateString('en-IN'),
        amount: transaction.amount || 0,
        credits: transaction.credits || 0,
        customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer',
        customerEmail: userEmail,
      };

      const pdfBuffer = await generateReceipt(receiptData);

      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="receipt-${paymentId}.pdf"`,
          'Content-Length': pdfBuffer.length.toString()
        },
      });
    } catch (error) {
      console.error('[API] Error generating receipt:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to generate receipt' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('[API] Error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 