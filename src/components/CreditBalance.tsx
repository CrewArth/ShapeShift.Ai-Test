'use client';

import { useCredits } from '@/contexts/CreditsContext';
import { Coins } from 'lucide-react';
import './creditBalance.css';

export default function CreditBalance() {
  const { credits, loading } = useCredits();

  if (loading) {
    return null;
  }

  return (
    <div className="credit-balance-container">
      <Coins className="credit-balance-icon" />
      <span className="credit-balance-text">{credits} Credits</span>
    </div>
  );
} 