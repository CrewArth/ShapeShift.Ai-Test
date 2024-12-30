'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Credits from '@/components/Credits';
import ModelViewer from '@/components/ModelViewer';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Clock, Box, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import './history.css';
import { Card } from '@/components/ui/card';
import DownloadReceiptButton from './DownloadReceiptButton';
import Image from 'next/image';

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
  type: 'subscription' | 'topup' | 'usage';
  amount?: number;
  credits: number;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  stripePaymentId?: string;
  stripeSessionId?: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
};

interface HistoryClientProps {}

const HistoryClient: React.FC<HistoryClientProps> = () => {
  const { isSignedIn, user, isLoaded } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'models' | 'transactions'>('models');
  const [models, setModels] = useState<ModelHistory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        
        // Fetch model generations
        const modelResponse = await fetch('/api/history/models', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (!modelResponse.ok) throw new Error('Failed to fetch models');
        const modelData = await modelResponse.json();
        
        // Fetch transactions
        const transactionsResponse = await fetch('/api/history/transactions');
        if (!transactionsResponse.ok) throw new Error('Failed to fetch transactions');
        const transactionsData = await transactionsResponse.json();
        
        // Filter credit purchases
        const creditPurchases = transactionsData.transactions
          .filter((t: Transaction) => t.type === 'topup' && t.status === 'success');

        setModels(modelData.models || []);
        setTransactions(creditPurchases);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
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
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Navbar />
      <Credits />
      
      <main className="flex-1 container mx-auto px-4 py-8" style={{ marginTop: "120px" }}>
        <h1 className="history-title">History</h1>

        <div className="history-tabs">
          <button
            className={`tab-button ${activeTab === 'models' ? 'active' : ''}`}
            onClick={() => setActiveTab('models')}
          >
            <Box className="w-4 h-4" />
            Model Generations
          </button>
          <button
            className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <CreditCard className="w-4 h-4" />
            Credit Purchases
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="history-content">
            {activeTab === 'models' && (
              <div className="history-content">
                {models.length === 0 ? (
                  <div className="empty-state">
                    <Box className="w-12 h-12 mb-4 text-[var(--foreground-secondary)]" />
                    <p className="empty-text">No models generated yet</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {models.map((model) => (
                      <Card key={model.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-4">
                            {model.thumbnail_url && (
                              <div className="w-24 h-24 relative rounded-lg overflow-hidden">
                                <Image
                                  src={model.thumbnail_url}
                                  alt="Model thumbnail"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
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
                )}
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="history-content">
                {transactions.length === 0 ? (
                  <div className="empty-state">
                    <CreditCard className="w-12 h-12 mb-4 text-[var(--foreground-secondary)]" />
                    <p className="empty-text">No credit purchases yet</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {transactions.map((transaction) => (
                      <Card key={transaction.id} className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">
                              Order ID: {transaction.stripeSessionId || transaction.razorpayOrderId}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(transaction.timestamp), 'MMM d, yyyy h:mm a')}
                            </p>
                            <p className="mt-1">Credits: {transaction.credits}</p>
                            <p>Amount: ${(transaction.amount || 0) / 100}</p>
                          </div>
                          {(transaction.stripeSessionId || transaction.razorpayOrderId) && (
                            <DownloadReceiptButton 
                              paymentId={transaction.stripePaymentId || transaction.razorpayPaymentId || ''} 
                            />
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default HistoryClient; 