import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface UsageData {
  remaining_uploads: number;
  remaining_recordings: number;
  usage_period_end?: string;
}

export const useUsage = () => {
  const { token } = useAuth();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    fetchUsage();
  }, [fetchUsage]);

  return { usageData, isLoading, error, refetch: fetchUsage };
}; 