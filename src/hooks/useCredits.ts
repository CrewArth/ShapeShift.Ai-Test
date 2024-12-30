import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

export function useCredits() {
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
    const checkCredits = async () => {
      try {
        const token = await getToken();
        const response = await fetch('/api/credits/check', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setCredits(data.credits);
        }
      } catch (error) {
        console.error('Error checking credits:', error);
      } finally {
        setLoading(false);
      }
    };

    checkCredits();
  }, [getToken]);

  return { credits, loading };
} 