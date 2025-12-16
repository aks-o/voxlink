import { useState, useEffect } from 'react';
import OfflineService from '@services/offline.service';

interface OfflineServiceStatus {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSync: Date | null;
  lastError?: string;
  dataTypes: {
    callLogs: { lastSync: Date | null; cached: number };
    messages: { lastSync: Date | null; cached: number };
    analytics: { lastSync: Date | null; cached: number };
    config: { lastSync: Date | null; cached: number };
  };
}

export const useOfflineService = () => {
  const [status, setStatus] = useState<OfflineServiceStatus>({
    isOnline: navigator.onLine,
    pendingCount: 0,
    isSyncing: false,
    lastSync: null,
    dataTypes: {
      callLogs: { lastSync: null, cached: 0 },
      messages: { lastSync: null, cached: 0 },
      analytics: { lastSync: null, cached: 0 },
      config: { lastSync: null, cached: 0 }
    }
  });

  const offlineService = OfflineService.getInstance();

  useEffect(() => {
    const updateStatus = () => {
      const queueStatus = offlineService.getQueueStatus();
      const syncStatus = offlineService.getSyncStatus();
      
      setStatus({
        isOnline: queueStatus.isOnline,
        pendingCount: queueStatus.pendingCount,
        isSyncing: queueStatus.isSyncing,
        lastSync: syncStatus.lastSync,
        lastError: syncStatus.lastError,
        dataTypes: syncStatus.dataTypes
      });
    };

    // Initial status
    updateStatus();

    // Listen for sync status updates
    const unsubscribe = offlineService.addStatusListener(updateStatus);

    // Listen for online/offline events
    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for custom sync events
    const handleSyncSuccess = () => updateStatus();
    const handleSyncFailed = () => updateStatus();
    const handleDataUpdate = () => updateStatus();

    window.addEventListener('voxlink-sync-success', handleSyncSuccess);
    window.addEventListener('voxlink-sync-failed', handleSyncFailed);
    window.addEventListener('voxlink-data-update', handleDataUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('voxlink-sync-success', handleSyncSuccess);
      window.removeEventListener('voxlink-sync-failed', handleSyncFailed);
      window.removeEventListener('voxlink-data-update', handleDataUpdate);
      unsubscribe();
    };
  }, [offlineService]);

  const queueRequest = (
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    data?: any,
    maxRetries?: number,
    priority: 'high' | 'medium' | 'low' = 'medium',
    dataType: 'call-logs' | 'messages' | 'analytics' | 'config' | 'other' = 'other'
  ) => {
    return offlineService.queueRequest(method, url, data, maxRetries, priority, dataType);
  };

  const cacheData = (
    key: string, 
    data: any, 
    ttlMinutes?: number,
    priority: 'high' | 'medium' | 'low' = 'medium',
    dataType: 'call-logs' | 'messages' | 'analytics' | 'config' | 'other' = 'other'
  ) => {
    offlineService.cacheData(key, data, ttlMinutes, priority, dataType);
  };

  const getCachedData = (key: string) => {
    return offlineService.getCachedData(key);
  };

  const isCached = (key: string) => {
    return offlineService.isCached(key);
  };

  const clearCache = () => {
    offlineService.clearCache();
  };

  const clearQueue = () => {
    offlineService.clearQueue();
  };

  const canFunctionOffline = () => {
    return offlineService.canFunctionOffline();
  };

  const forceSyncDataType = async (dataType: keyof OfflineServiceStatus['dataTypes']) => {
    return offlineService.forceSyncDataType(dataType);
  };

  const cacheCallLogs = async (callLogs: any[], ttlMinutes?: number) => {
    return offlineService.cacheCallLogs(callLogs, ttlMinutes);
  };

  const cacheMessages = async (messages: any[], ttlMinutes?: number) => {
    return offlineService.cacheMessages(messages, ttlMinutes);
  };

  const getCachedCallLogs = () => {
    return offlineService.getCachedCallLogs();
  };

  const getCachedMessages = () => {
    return offlineService.getCachedMessages();
  };

  const requestNotificationPermission = async () => {
    return offlineService.requestNotificationPermission();
  };

  const subscribeToPushNotifications = async () => {
    return offlineService.subscribeToPushNotifications();
  };

  const showNotification = async (title: string, options?: NotificationOptions) => {
    return offlineService.showNotification(title, options);
  };

  return {
    ...status,
    queueRequest,
    cacheData,
    getCachedData,
    isCached,
    clearCache,
    clearQueue,
    canFunctionOffline,
    forceSyncDataType,
    cacheCallLogs,
    cacheMessages,
    getCachedCallLogs,
    getCachedMessages,
    requestNotificationPermission,
    subscribeToPushNotifications,
    showNotification,
  };
};