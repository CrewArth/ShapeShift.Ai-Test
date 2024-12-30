import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useNotification } from './NotificationContext';

interface CreditsContextType {
  credits: number;
  subscription: {
    type: 'none' | 'ninja' | 'pro' | 'promax';
    status: 'active' | 'cancelled' | 'expired';
    endDate?: Date;
  };
  loading: boolean;
  checkCredits: () => Promise<void>;
  deductCredits: () => Promise<boolean>;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  const [credits, setCredits] = useState(0);
  const [subscription, setSubscription] = useState({
    type: 'none' as const,
    status: 'active' as const,
  });
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  const checkCredits = async () => {
    try {
      const response = await fetch('/api/credits/check');
      if (!response.ok) throw new Error('Failed to check credits');
      
      const data = await response.json();
      setCredits(data.credits);
      setSubscription(data.subscription);
    } catch (error) {
      console.error('Error checking credits:', error);
      showNotification('Failed to check credits', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleCreditsUpdate = (event: CustomEvent<number>) => {
      setCredits(event.detail);
    };

    window.addEventListener('credits-updated', handleCreditsUpdate as EventListener);

    return () => {
      window.removeEventListener('credits-updated', handleCreditsUpdate as EventListener);
    };
  }, []);

  const deductCredits = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/credits/deduct', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 400 && data.error === 'Insufficient credits') {
          showNotification(
            'Insufficient credits. Please purchase more credits or subscribe to continue.',
            'error'
          );
          return false;
        }
        throw new Error('Failed to deduct credits');
      }

      const data = await response.json();
      setCredits(data.remainingCredits);
      
      window.dispatchEvent(new CustomEvent('credits-updated', { detail: data.remainingCredits }));
      
      return true;
    } catch (error) {
      console.error('Error deducting credits:', error);
      showNotification('Failed to deduct credits', 'error');
      return false;
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      checkCredits();
    }
  }, [isLoaded, isSignedIn]);

  return (
    <CreditsContext.Provider
      value={{
        credits,
        subscription,
        loading,
        checkCredits,
        deductCredits,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
} 