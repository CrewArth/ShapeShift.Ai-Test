'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface DownloadReceiptButtonProps {
  orderId: string;
}

export function DownloadReceiptButton({ orderId }: DownloadReceiptButtonProps) {
  const handleDownloadReceipt = async () => {
    try {
      const response = await fetch(`/api/payments/download-receipt?orderId=${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt. Please try again.');
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownloadReceipt}
      className="flex items-center gap-2"
    >
      <Download className="w-4 h-4" />
      Download Receipt
    </Button>
  );
} 