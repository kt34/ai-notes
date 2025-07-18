import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../utils/api';

interface UsageData {
  remaining_uploads: number;
  remaining_recordings: number;
}

export function useUsage() {
  const { token } = useAuth();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [uploadsResponse, recordingsResponse] = await Promise.all([
        apiRequest('/usage/remaining-uploads', { token }),
        apiRequest('/usage/remaining-recordings', { token })
      ]);

      setUsageData({
        remaining_uploads: uploadsResponse.remaining_uploads,
        remaining_recordings: recordingsResponse.remaining_recordings
      });
    } catch (err) {
      console.error('Error fetching usage data:', err);
      setError('Failed to load usage data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [token]);

  return {
    usageData,
    isLoading,
    error,
    refetch: fetchUsage
  };
} 