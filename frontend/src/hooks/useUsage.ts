import { useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface UsageData {
  remaining_uploads: number;
  remaining_recordings: number;
  usage_period_end?: string;
}

export const useUsage = () => {
  const { token, user } = useAuth();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousSubscriptionStatus = useRef(user?.subscription_status);

  const fetchUsage = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/usage/summary', { token });
      setUsageData({
        remaining_uploads: data.remaining_uploads,
        remaining_recordings: data.remaining_recordings,
        usage_period_end: data.usage_period_end
      });
    } catch (err) {
      setError('Failed to fetch usage data.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const currentSubscriptionStatus = user?.subscription_status;
    const hasSubscriptionChanged = previousSubscriptionStatus.current !== currentSubscriptionStatus;
    
    if (hasSubscriptionChanged && previousSubscriptionStatus.current) {
      // Subscription status changed - add a small delay to ensure backend is updated
      const timer = setTimeout(() => {
        fetchUsage();
      }, 1000);
      
      previousSubscriptionStatus.current = currentSubscriptionStatus;
      return () => clearTimeout(timer);
    } else {
      // Initial load or token change - fetch immediately
      fetchUsage();
      previousSubscriptionStatus.current = currentSubscriptionStatus;
    }
  }, [fetchUsage, user?.subscription_status]);

  return { usageData, isLoading, error, refetch: fetchUsage };
}; 