import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import UserCredits, { Transaction } from '@/models/UserCredits';

export const dynamic = 'force-dynamic';

interface TransformedTransaction {
  id: string;
  type: Transaction['type'];
  amount: number;
  credits: number;
  status: Transaction['status'];
  timestamp: string;
  razorpayPaymentId?: string;
  modelType?: Transaction['modelType'];
  prompt?: string;
  imageUrl?: string;
  modelUrl?: string;
}

export async function GET(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      console.log('[Transactions API] No userId found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Transactions API] Fetching transactions for userId:', userId);

    await connectToDatabase();

    // Fetch user credits document which contains transactions
    const userCredits = await UserCredits.findOne({ userId });
    console.log('[Transactions API] Found user credits document');

    if (!userCredits?.transactions?.length) {
      console.log('[Transactions API] No transactions found');
      return NextResponse.json({ 
        transactions: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          hasMore: false
        }
      });
    }

    // Get all transactions and sort by timestamp
    const allTransactions = userCredits.transactions;
    console.log('[Transactions API] Total transactions found:', allTransactions.length);

    const sortedTransactions = [...allTransactions].sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA;
    });

    // Get page from query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 10;

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex);

    // Transform transactions
    const transformedTransactions: TransformedTransaction[] = paginatedTransactions.map(transaction => ({
      id: transaction._id?.toString() || '',
      type: transaction.type,
      amount: transaction.amount || 0,
      credits: transaction.credits || 0,
      status: transaction.status,
      timestamp: new Date(transaction.timestamp).toISOString(),
      razorpayPaymentId: transaction.razorpayPaymentId,
      modelType: transaction.modelType,
      prompt: transaction.prompt,
      imageUrl: transaction.imageUrl,
      modelUrl: transaction.modelUrl
    }));

    const totalItems = sortedTransactions.length;
    const totalPages = Math.ceil(totalItems / limit);

    const pagination = {
      currentPage: page,
      totalPages,
      totalItems,
      hasMore: endIndex < totalItems
    };

    console.log('[Transactions API] Sending response with', transformedTransactions.length, 'transactions');
    console.log('[Transactions API] Pagination:', pagination);

    return NextResponse.json({
      transactions: transformedTransactions,
      pagination
    });
  } catch (error) {
    console.error('[Transactions API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
} 