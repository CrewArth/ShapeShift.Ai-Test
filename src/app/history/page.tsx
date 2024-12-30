import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { default as HistoryClient } from './components/HistoryClient';

export default async function HistoryPage() {
  const { userId } = auth();
  if (!userId) {
    redirect('/sign-in');
  }

  return <HistoryClient />;
} 