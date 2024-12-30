'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';
import LoadingSpinner from './LoadingSpinner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface BuyCreditsButtonProps {
  credits: number;
  amount: number;
  onSuccess?: () => void;
}

export function BuyCreditsButton({ credits, amount, onSuccess }: BuyCreditsButtonProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const loadScript = () => {
      return new Promise((resolve) => {
        if (document.getElementById('razorpay-script')) {
          console.log('[Frontend] Razorpay script already loaded');
          setScriptLoaded(true);
          resolve(true);
          return;
        }

        console.log('[Frontend] Loading Razorpay script...');
        const script = document.createElement('script');
        script.id = 'razorpay-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        
        script.onload = () => {
          console.log('[Frontend] Razorpay script loaded successfully');
          setScriptLoaded(true);
          resolve(true);
        };
        
        script.onerror = (error) => {
          console.error('[Frontend] Failed to load Razorpay script:', error);
          setScriptLoaded(false);
          resolve(false);
        };
        
        document.head.appendChild(script);
      });
    };

    loadScript();
  }, []);

  const handlePayment = async () => {
    try {
      console.log('[Frontend] Starting payment process...');
      
      if (!scriptLoaded) {
        console.error('[Frontend] Script not loaded yet');
        alert('Payment system is initializing. Please try again in a moment.');
        return;
      }

      if (typeof window.Razorpay !== 'function') {
        console.error('[Frontend] Razorpay not initialized properly:', typeof window.Razorpay);
        alert('Payment system not initialized properly. Please refresh the page.');
        return;
      }

      setLoading(true);
      console.log('[Frontend] Creating order...', { amount, credits });

      // Create order
      const response = await fetch('/api/payments/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, credits }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('[Frontend] Order creation failed:', errorData);
        throw new Error(errorData?.error || 'Failed to create order');
      }

      const data = await response.json();
      console.log('[Frontend] Order created successfully:', data);

      if (!data.key || !data.amount || !data.currency || !data.id) {
        console.error('[Frontend] Invalid order data received:', data);
        throw new Error('Invalid order data received from server');
      }

      // Initialize Razorpay
      console.log('[Frontend] Initializing Razorpay with options:', {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        orderId: data.id
      });

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'ShapeShift AI',
        description: `${credits} Credits`,
        order_id: data.id,
        handler: async function (response: any) {
          console.log('[Frontend] Payment successful, verifying payment...', {
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature
          });

          try {
            const verifyResponse = await fetch('/api/payments/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json().catch(() => null);
              console.error('[Frontend] Verification failed:', errorData);
              throw new Error(errorData?.error || 'Payment verification failed');
            }

            const result = await verifyResponse.json();
            console.log('[Frontend] Payment verified successfully:', result);
            if (result.success) {
              onSuccess?.();
            }
          } catch (error) {
            console.error('[Frontend] Payment verification error:', error);
            alert('Payment verification failed. Please contact support if credits were deducted.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function() {
            console.log('[Frontend] Payment modal dismissed');
            setLoading(false);
          },
          escape: true,
          animation: true,
          backdropClose: true
        },
        prefill: {
          name: user?.firstName + ' ' + user?.lastName,
          email: user?.emailAddresses[0].emailAddress,
        },
        theme: {
          color: '#6366f1',
        },
        retry: {
          enabled: true,
          max_count: 3
        }
      };

      console.log('[Frontend] Creating Razorpay instance...');
      try {
        const razorpay = new window.Razorpay(options);
        
        razorpay.on('payment.failed', function (response: any) {
          console.error('[Frontend] Payment failed:', response.error);
          alert(`Payment failed: ${response.error.description}`);
          setLoading(false);
        });

        console.log('[Frontend] Opening Razorpay modal...');
        razorpay.open();
        console.log('[Frontend] Razorpay modal opened');
      } catch (error) {
        console.error('[Frontend] Error creating/opening Razorpay:', error);
        throw new Error('Failed to initialize payment window');
      }

    } catch (error) {
      console.error('[Frontend] Payment error:', error);
      alert(error instanceof Error ? error.message : 'Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={loading || !scriptLoaded}
      className="w-full"
    >
      {loading ? (
        <LoadingSpinner size={20} />
      ) : (
        `Buy ${credits} Credits for ₹${amount}`
      )}
    </Button>
  );
} 