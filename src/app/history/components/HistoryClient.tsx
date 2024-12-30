'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Credits from '@/components/Credits';
import ModelViewer from '@/components/ModelViewer';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Clock, Box, CreditCard, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import '../history.css';
import { Card } from '@/components/ui/card';
import DownloadReceiptButton from '@/app/history/DownloadReceiptButton';
import Image from 'next/image';
import { toast } from 'sonner';
import { Transaction as DBTransaction } from '@/models/UserCredits';

type ModelHistory = {
  id: string;
  type: 'text-to-3d' | 'image-to-3d';
  prompt?: string;
  negative_prompt?: string;
  art_style?: string;
  thumbnail_url?: string;
  model_urls?: {
    glb?: string;
    fbx?: string;
    obj?: string;
    mtl?: string;
    usdz?: string;
  };
  status: 'SUCCEEDED' | 'FAILED' | 'PENDING';
  created_at: number;
  finished_at?: number;
  task_error?: {
    message: string;
  };
  credits: number;
};

type Transaction = {
  id: string;
  type: DBTransaction['type'];
  amount?: number;
  credits?: number;
  status: DBTransaction['status'];
  timestamp: string;
  razorpayPaymentId?: string;
  modelType?: DBTransaction['modelType'];
  prompt?: string;
  imageUrl?: string;
  modelUrl?: string;
};

interface HistoryClientProps {}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasMore: boolean;
}

const getTransactionTitle = (type: string) => {
  switch (type) {
    case 'topup':
      return 'Credit Purchase';
    case 'usage':
      return 'Credit Usage';
    case 'subscription':
      return 'Subscription';
    default:
      return 'Transaction';
  }
};

const ModelThumbnail = ({ url }: { url: string }) => {
  const [error, setError] = useState(false);

  if (!url || error) {
    return (
      <div className="w-24 h-24 flex items-center justify-center rounded-lg bg-[var(--background-secondary)]">
        <Box className="w-8 h-8 text-[var(--foreground-secondary)]" />
      </div>
    );
  }

  return (
    <div className="w-24 h-24 relative rounded-lg overflow-hidden bg-[var(--background-secondary)]">
      <Image
        src={url}
        alt="Model thumbnail"
        fill
        className="object-cover object-center"
        sizes="96px"
        onError={() => setError(true)}
        unoptimized // Skip Next.js image optimization
      />
    </div>
  );
};

const HistoryClient = () => {
  const { isSignedIn, user, isLoaded } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'models' | 'transactions'>('models');
  const [models, setModels] = useState<ModelHistory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelsPagination, setModelsPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasMore: false
  });
  const [transactionsPagination, setTransactionsPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasMore: false
  });

  const fetchModels = async (page = 1) => {
    try {
      const modelResponse = await fetch(`/api/history/models?page=${page}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!modelResponse.ok) {
        const errorData = await modelResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch models');
      }
      const data = await modelResponse.json();
      return {
        models: data.models || [],
        pagination: data.pagination
      };
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  };

  const fetchTransactions = async (page = 1) => {
    try {
      console.log('[History] Fetching transactions for page:', page);
      const response = await fetch(`/api/history/transactions?page=${page}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[History] Failed to fetch transactions:', errorData);
        throw new Error(errorData.error || 'Failed to fetch transactions');
      }
      
      const data = await response.json();
      console.log('[History] Received transactions data:', data);
      
      return {
        transactions: data.transactions || [],
        pagination: data.pagination
      };
    } catch (error) {
      console.error('[History] Error fetching transactions:', error);
      throw error;
    }
  };

  const loadMore = async () => {
    try {
      setLoading(true);
      if (activeTab === 'models') {
        const nextPage = modelsPagination.currentPage + 1;
        const { models: newModels, pagination } = await fetchModels(nextPage);
        setModels(prev => [...prev, ...newModels]);
        setModelsPagination(pagination);
      } else {
        const nextPage = transactionsPagination.currentPage + 1;
        const { transactions: newTransactions, pagination } = await fetchTransactions(nextPage);
        setTransactions(prev => [...prev, ...newTransactions]);
        setTransactionsPagination(pagination);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load more items';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('[History] Fetching initial data');
        const [modelsData, transactionsData] = await Promise.all([
          fetchModels(1),
          fetchTransactions(1)
        ]);

        console.log('[History] Setting initial transactions:', transactionsData.transactions);
        setTransactions(transactionsData.transactions || []);
        setTransactionsPagination(transactionsData.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          hasMore: false
        });
        
        setModels(modelsData.models || []);
        setModelsPagination(modelsData.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          hasMore: false
        });
      } catch (error) {
        console.error('[History] Error fetching initial data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load history';
        setError(errorMessage);
        toast.error(errorMessage, {
          action: {
            label: 'Retry',
            onClick: () => fetchInitialData(),
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [isLoaded]);

  // Show loading state while auth is being checked
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <LoadingSpinner size={40} />
      </div>
    );
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'succeeded':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTransactionContent = (transaction: Transaction) => {
    console.log('[History] Rendering transaction:', transaction);
    const isSuccessful = transaction.status.toLowerCase() === 'success' || 
                        transaction.status.toLowerCase() === 'succeeded';
    
    return (
      <Card key={transaction.id} className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{getTransactionTitle(transaction.type)}</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(transaction.timestamp), 'MMM d, yyyy h:mm a')}
            </p>
            <div className="mt-2 flex items-center gap-4">
              {transaction.amount !== undefined && transaction.amount > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <IndianRupee className="h-4 w-4" />
                  <span>{transaction.amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm">
                <CreditCard className="h-4 w-4" />
                <span>{transaction.credits} credits</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(transaction.status)}`}>
              {transaction.status}
            </span>
            {isSuccessful && transaction.type === 'topup' && transaction.razorpayPaymentId && (
              <DownloadReceiptButton paymentId={transaction.razorpayPaymentId} />
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderContent = () => {
    const currentPagination = activeTab === 'models' ? modelsPagination : transactionsPagination;

    if (!currentPagination) {
      return null;
    }

    if (activeTab === 'models') {
      if (models.length === 0) {
        return (
          <div className="empty-state">
            <Box className="w-12 h-12 mb-4 text-[var(--foreground-secondary)]" />
            <p className="empty-text">No models generated yet</p>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <div className="grid gap-4">
            {models.map((model) => (
              <Card key={model.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <ModelThumbnail url={model.thumbnail_url || ''} />
                    <div>
                      <h3 className="font-medium">
                        {model.type === 'text-to-3d' ? 'Text to 3D' : 'Image to 3D'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(model.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                      {model.prompt && (
                        <p className="mt-2 text-sm">Prompt: {model.prompt}</p>
                      )}
                      {model.task_error && (
                        <p className="mt-2 text-sm text-red-500">{model.task_error.message}</p>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(model.status)}`}>
                    {model.status}
                  </span>
                </div>
              </Card>
            ))}
          </div>
          {currentPagination?.hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full py-2 text-center text-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>
      );
    }

    if (transactions.length === 0) {
      return (
        <div className="empty-state">
          <CreditCard className="w-12 h-12 mb-4 text-[var(--foreground-secondary)]" />
          <p className="empty-text">No transactions yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 max-w-4xl mx-auto px-4">
        <div className="grid gap-4">
          {transactions.map((transaction) => renderTransactionContent(transaction))}
        </div>
        {currentPagination?.hasMore && (
          <button
            onClick={loadMore}
            disabled={loading}
            className="w-full py-2 text-center text-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-bold mb-6">History</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('models')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'models'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--background-secondary)] text-[var(--foreground)]'
              }`}
            >
              Models
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'transactions'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--background-secondary)] text-[var(--foreground)]'
              }`}
            >
              Transactions
            </button>
          </div>
          <div className="mt-4 w-full max-w-4xl flex justify-end">
            <Credits />
          </div>
        </div>

        {error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : loading && (!models.length && !transactions.length) ? (
          <div className="flex justify-center">
            <LoadingSpinner size={40} />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {renderContent()}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryClient; 