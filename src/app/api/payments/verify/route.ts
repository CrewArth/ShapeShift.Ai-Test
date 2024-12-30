import { auth, currentUser } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import UserCredits from '@/models/UserCredits';
import { generateReceipt } from '@/utils/generateReceipt';
import { sendEmail } from '@/utils/sendEmail';

function getEmailTemplate(data: {
  customerName: string;
  paymentId: string;
  amount: number;
  credits: number;
  date: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .details { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 0.9em; color: #666; }
        .highlight { color: #7C3AED; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Thank You for Your Purchase!</h2>
        </div>
        
        <p>Dear ${data.customerName},</p>
        
        <p>Your payment has been successfully processed. Please find your receipt attached to this email.</p>
        
        <div class="details">
          <h3>Transaction Details:</h3>
          <p><strong>Payment ID:</strong> ${data.paymentId}</p>
          <p><strong>Amount:</strong> ₹${(data.amount / 100).toFixed(2)}</p>
          <p><strong>Credits Purchased:</strong> ${data.credits}</p>
          <p><strong>Date:</strong> ${data.date}</p>
        </div>
        
        <p>Your credits have been added to your account and are ready to use.</p>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        
        <div class="footer">
          <p>Best regards,<br>ShapeShift AI Team</p>
          <p class="highlight">Transforming Ideas into Reality</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const body = await req.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the pending transaction
    const userCredits = await UserCredits.findOne({
      userId,
      'transactions.razorpayOrderId': razorpay_order_id,
      'transactions.status': 'pending'
    });

    if (!userCredits) {
      return new NextResponse(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404 }
      );
    }

    const transaction = userCredits.transactions.find(
      (t: any) => t.razorpayOrderId === razorpay_order_id
    );

    if (!transaction) {
      return new NextResponse(
        JSON.stringify({ error: 'Transaction details not found' }),
        { status: 404 }
      );
    }

    // Update transaction status
    transaction.status = 'success';
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature;
    
    // Add credits to user's balance
    userCredits.balance += transaction.credits;
    
    await userCredits.save();

    // Generate and send receipt
    try {
      const userEmail = user.emailAddresses.find(email => email.id === user.primaryEmailAddressId)?.emailAddress;
      
      if (userEmail) {
        // Generate receipt
        const receiptData = {
          orderId: '', // Removed as requested
          paymentId: razorpay_payment_id,
          date: new Date(transaction.timestamp).toLocaleDateString('en-IN'),
          amount: transaction.amount || 0,
          credits: transaction.credits || 0,
          customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer',
          customerEmail: userEmail,
        };

        const pdfBuffer = await generateReceipt(receiptData);

        // Generate email HTML
        const emailHtml = getEmailTemplate({
          customerName: receiptData.customerName,
          paymentId: receiptData.paymentId,
          amount: receiptData.amount,
          credits: receiptData.credits,
          date: receiptData.date,
        });

        // Send email with receipt
        await sendEmail({
          to: userEmail,
          subject: 'Your ShapeShift AI Purchase Receipt',
          html: emailHtml,
          attachments: [{
            filename: `receipt-${razorpay_payment_id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }]
        });
      }
    } catch (error) {
      console.error('Error sending receipt email:', error);
      // Don't fail the transaction if email fails
    }

    return new NextResponse(
      JSON.stringify({ 
        message: 'Payment verified successfully',
        credits: userCredits.balance
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error verifying payment:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
} 