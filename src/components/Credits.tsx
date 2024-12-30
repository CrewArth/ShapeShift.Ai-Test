'use client';

import { useCredits } from '@/contexts/CreditsContext';
import { Coins } from 'lucide-react';

export default function Credits() {
  const { credits, subscription, loading } = useCredits();

  if (loading) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg p-4 shadow-lg">
      <div className="flex items-center gap-3">
        <Coins className="w-5 h-5 text-yellow-500" />
        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">
            {credits} Credits
          </p>
          {subscription.type !== 'none' && (
            <p className="text-xs text-[var(--foreground-secondary)]">
              {subscription.type.toUpperCase()} Plan Active
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 