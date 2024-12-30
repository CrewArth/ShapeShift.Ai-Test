'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { useClerk } from '@clerk/nextjs';

interface DownloadReceiptButtonProps {
  paymentId: string;
}

export default function DownloadReceiptButton({ paymentId }: DownloadReceiptButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { openSignIn } = useClerk();

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      console.log('Downloading receipt for payment:', paymentId);
      
      const response = await fetch(`/api/payments/download-receipt?paymentId=${paymentId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          toast.error('Please sign in again to download your receipt', {
            action: {
              label: 'Sign In',
              onClick: () => openSignIn(),
            },
          });
          return;
        }
        throw new Error(errorData.error || 'Failed to download receipt');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('Receipt downloaded successfully');
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Failed to download receipt. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={isLoading}
      className="ml-2"
    >
      <Download className="h-4 w-4 mr-1" />
      {isLoading ? 'Downloading...' : 'Receipt'}
    </Button>
  );
} 