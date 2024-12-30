'use client'

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useCredits } from '@/contexts/CreditsContext';
import { useNotification } from '@/contexts/NotificationContext';
import { subscriptionPlans, topupPlans } from '@/config/subscriptionPlans';
import Navbar from '@/components/Navbar';
import { Check, Star, Info } from 'lucide-react';
import './pricing.css';
import Credits from '@/components/Credits';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PricingPage() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const { credits, subscription, checkCredits } = useCredits();
  const { showNotification } = useNotification();
  const [selectedTab, setSelectedTab] = useState<'subscription' | 'topup'>('subscription');
  const [isLoading, setIsLoading] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState<string | null>(null);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    // Set initial tab to 'topup' since subscription is not available
    setSelectedTab('topup');

    // Fetch Razorpay key
    const fetchKey = async () => {
      try {
        const response = await fetch('/api/payments/get-key');
        if (!response.ok) throw new Error('Failed to get Razorpay key');
        const data = await response.json();
        setRazorpayKey(data.key);
      } catch (error) {
        console.error('[Frontend] Failed to get Razorpay key:', error);
        showNotification('Failed to initialize payment system', 'error');
      }
    };

    if (isSignedIn) {
      fetchKey();
    }

    return () => {
      document.body.removeChild(script);
    };
  }, [isSignedIn, showNotification]);

  const handleSubscribe = async (planId: string) => {
    if (!isSignedIn) {
      // Redirect to Clerk sign-in page with return URL
      const returnUrl = encodeURIComponent('http://localhost:3000/dashboard');
      window.location.href = `https://humorous-oarfish-98.accounts.dev/sign-in?redirect_url=${returnUrl}`;
      return;
    }

    if (!razorpayKey) {
      showNotification('Payment system not initialized', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) throw new Error('Failed to create subscription');
      const data = await response.json();

      const options = {
        key: razorpayKey,
        subscription_id: data.subscriptionId,
        name: 'ShapeShift AI',
        description: `${subscriptionPlans[planId as keyof typeof subscriptionPlans].name} Subscription`,
        handler: async (response: any) => {
          try {
            const verifyResponse = await fetch('/api/payments/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentId: response.razorpay_payment_id,
                subscriptionId: response.razorpay_subscription_id,
                signature: response.razorpay_signature,
              }),
            });

            if (!verifyResponse.ok) throw new Error('Payment verification failed');
            
            showNotification('Subscription activated successfully!', 'success');
            checkCredits();
          } catch (error) {
            showNotification('Failed to verify payment', 'error');
          }
        },
        prefill: {
          name: user?.fullName,
          email: user?.primaryEmailAddress?.emailAddress,
        },
        theme: {
          color: '#7C3AED',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Subscription error:', error);
      showNotification('Failed to create subscription', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopup = async (planId: string) => {
    if (!isSignedIn) {
      // Redirect to Clerk sign-in page with return URL
      const returnUrl = encodeURIComponent('http://localhost:3000/dashboard');
      window.location.href = `https://humorous-oarfish-98.accounts.dev/sign-in?redirect_url=${returnUrl}`;
      return;
    }

    if (!razorpayKey) {
      showNotification('Payment system not initialized', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[Frontend] Failed to create order:', errorData);
        throw new Error('Failed to create order');
      }
      const data = await response.json();

      console.log('[Frontend] Order created:', data);

      const options = {
        key: razorpayKey,
        amount: data.amount,
        currency: data.currency,
        name: 'ShapeShift AI',
        description: `${topupPlans[planId as keyof typeof topupPlans].credits} Credits Topup`,
        order_id: data.orderId,
        handler: async (response: any) => {
          try {
            console.log('[Frontend] Payment successful, verifying payment...', {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              env: process.env.NODE_ENV
            });

            const verifyResponse = await fetch('/api/payments/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature || 'test_signature', // Use test signature in development
              }),
            });

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.text();
              console.error('[Frontend] Payment verification failed:', errorData);
              throw new Error('Payment verification failed');
            }
            
            const data = await verifyResponse.json();
            console.log('[Frontend] Payment verified:', data);

            // Update credits in UI
            if (typeof window !== 'undefined' && data.currentCredits) {
              window.dispatchEvent(new CustomEvent('credits-updated', { 
                detail: data.currentCredits 
              }));
            }
            
            showNotification('Credits added successfully!', 'success');
            
            // Refresh credits from server
            await checkCredits();
            
            // Refresh the page to update history
            router.refresh();
          } catch (error) {
            console.error('[Frontend] Payment verification error:', error);
            showNotification('Failed to verify payment. Please contact support if credits were deducted.', 'error');
          }
        },
        prefill: {
          name: user?.fullName,
          email: user?.primaryEmailAddress?.emailAddress,
        },
        theme: {
          color: '#7C3AED',
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('[Frontend] Topup error:', error);
      showNotification('Failed to create order', 'error');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Navbar />
      <Credits />
      
      <main className="flex-1 container mx-auto px-4 flex flex-col" style={{ marginTop: "120px" }}>
        <div className="notification-banner">
          <Info className="w-5 h-5" />
          <p>
            <span className="font-semibold">Coming Soon:</span> Monthly subscription plans are currently under development and will be available soon.
          </p>
        </div>

        <div className="pricing-header">
          <h1 className="pricing-title">
            Choose Your Plan
          </h1>
          <h3 className="pricing-subtitle">
            Get the power to create stunning 3D models with our flexible pricing options
          </h3>
        </div>

        <div className="pricing-tabs mb-12">
          <button
            className={`tab-button ${selectedTab === 'subscription' ? 'active' : ''} disabled`}
            onClick={() => {}}
            disabled
            title="Coming soon"
          >
            Monthly Subscription
          </button>
          <button
            className={`tab-button ${selectedTab === 'topup' ? 'active' : ''}`}
            onClick={() => setSelectedTab('topup')}
          >
            Credit Packs
          </button>
        </div>

        <div className="flex-1 flex items-start justify-center">
          {selectedTab === 'subscription' ? (
            <div className="flex flex-col gap-6">
              <div className="pricing-row">
                {Object.values(subscriptionPlans).map((plan) => (
                  <div key={plan.id} className={`pricing-card ${plan.id === 'pro' ? 'popular' : ''}`}>
                    {plan.id === 'pro' && (
                      <div className="popular-badge">Most Popular</div>
                    )}
                    <div className="pricing-plan-info">
                      <h3 className="pricing-plan-name">{plan.name}</h3>
                      <div className="pricing-plan-price">
                        <span className="currency">₹</span>
                        <span className="amount">{plan.price / 100}</span>
                        <span className="duration">/mo</span>
                      </div>
                      <p className="pricing-plan-credits">
                        {plan.credits} credits per month
                      </p>
                    </div>
                    <div className="pricing-card-features">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="feature-item">
                          <Check className="feature-icon" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      className="pricing-card-button"
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : 'Subscribe Now'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="pricing-row">
                {Object.values(topupPlans).map((plan) => (
                  <div key={plan.id} className="pricing-card">
                    <div className="pricing-plan-info">
                      <h3 className="pricing-plan-name">{plan.credits} Credits</h3>
                      <div className="pricing-plan-price">
                        <span className="currency">₹</span>
                        <span className="amount">{plan.price / 100}</span>
                      </div>
                      {/* <p className="pricing-plan-credits">
                        {(plan.price / 100 / plan.credits).toFixed(2)} ₹ per credit
                      </p> */}
                    </div>
                    <div className="flex-1" />  
                    <button
                      className="pricing-card-button mt-auto"
                      onClick={() => handleTopup(plan.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : 'Buy Now'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 