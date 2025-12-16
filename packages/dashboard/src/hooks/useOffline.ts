import { useState, useEffect } from 'react';

export interface OfflineState {
  isOnline: boolean;
  isOffline: boolean;
  wasOffline: boolean;
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
  saveData?: boolean;
}

export function useOffline(): OfflineState {
  const [state, setState] = useState<OfflineState>(() => {
    if (typeof window === 'undefined') {
      return {
        isOnline: true,
        isOffline: false,
        wasOffline: false,
      };
    }

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      isOnline: navigator.onLine,
      isOffline: !navigator.onLine,
      wasOffline: false,
      downlink: connection?.downlink,
      effectiveType: connection?.effectiveType,
      rtt: connection?.rtt,
      saveData: connection?.saveData,
    };
  });

  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({
        ...prev,
        isOnline: true,
        isOffline: false,
      }));
    };

    const handleOffline = () => {
      setState(prev => ({
        ...prev,
        isOnline: false,
        isOffline: true,
        wasOffline: true,
      }));
    };

    const handleConnectionChange = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      if (connection) {
        setState(prev => ({
          ...prev,
          downlink: connection.downlink,
          effectiveType: connection.effectiveType,
          rtt: connection.rtt,
          saveData: connection.saveData,
        }));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return state;
}

export function useNetworkStatus() {
  const offline = useOffline();
  
  const getConnectionQuality = (): 'poor' | 'good' | 'excellent' | 'unknown' => {
    if (!offline.effectiveType) return 'unknown';
    
    switch (offline.effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'poor';
      case '3g':
        return 'good';
      case '4g':
        return 'excellent';
      default:
        return 'unknown';
    }
  };

  const isSlowConnection = (): boolean => {
    return offline.saveData || offline.effectiveType === 'slow-2g' || offline.effectiveType === '2g';
  };

  return {
    ...offline,
    connectionQuality: getConnectionQuality(),
    isSlowConnection: isSlowConnection(),
  };
}