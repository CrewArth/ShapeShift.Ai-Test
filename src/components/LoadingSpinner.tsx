'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
}

export default function LoadingSpinner({ size = 24, message }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className="border-4 border-[var(--border)] border-t-purple-500 rounded-full animate-spin"
        style={{ width: size, height: size }}
      />
      {message && <p className="text-[var(--foreground-secondary)]">{message}</p>}
    </div>
  );
} 