import { useState, useCallback } from 'react';

interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  lastConnected?: Date;
  connectionQuality?: 'excellent' | 'good' | 'poor';
  responseTime?: number;
  error?: string;
}

interface ConnectionMetrics {
  startTime: number;
  endTime?: number;
  responseTime?: number;
  dataSize?: number;
  retryCount: number;
}

/**
 * Custom hook for connection management
 * Extracted from Step1Configuration for better separation of concerns
 */
export const useConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isConnecting: false,
  });
  
  const [connectionMetrics, setConnectionMetrics] = useState<ConnectionMetrics>({
    startTime: 0,
    retryCount: 0,
  });

  const startConnection = useCallback(() => {
    const startTime = Date.now();
    setConnectionMetrics(prev => ({ 
      ...prev, 
      startTime, 
      retryCount: prev.retryCount + 1 
    }));
    
    setConnectionStatus({ 
      isConnected: false, 
      isConnecting: true,
      responseTime: undefined 
    });
  }, []);

  const completeConnection = useCallback((success: boolean, error?: string) => {
    const endTime = Date.now();
    const responseTime = endTime - connectionMetrics.startTime;
    
    setConnectionMetrics(prev => ({ 
      ...prev, 
      endTime, 
      responseTime 
    }));

    if (success) {
      // Determine connection quality based on response time
      let connectionQuality: 'excellent' | 'good' | 'poor' = 'excellent';
      if (responseTime > 5000) connectionQuality = 'poor';
      else if (responseTime > 2000) connectionQuality = 'good';

      setConnectionStatus({ 
        isConnected: true, 
        isConnecting: false,
        lastConnected: new Date(),
        connectionQuality,
        responseTime
      });
    } else {
      setConnectionStatus({ 
        isConnected: false, 
        isConnecting: false,
        error
      });
    }
  }, [connectionMetrics.startTime]);

  const resetConnection = useCallback(() => {
    setConnectionStatus({
      isConnected: false,
      isConnecting: false,
    });
    setConnectionMetrics({
      startTime: 0,
      retryCount: 0,
    });
  }, []);

  return {
    connectionStatus,
    connectionMetrics,
    startConnection,
    completeConnection,
    resetConnection
  };
};