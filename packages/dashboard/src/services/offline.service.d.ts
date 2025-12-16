interface CachedData {
    data: any;
    timestamp: number;
    expiresAt: number;
    priority: 'high' | 'medium' | 'low';
    dataType: 'call-logs' | 'messages' | 'analytics' | 'config' | 'other';
}
interface OfflineQueueItem {
    id: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    data?: any;
    timestamp: number;
    retryCount: number;
    maxRetries: number;
    priority: 'high' | 'medium' | 'low';
    dataType: 'call-logs' | 'messages' | 'analytics' | 'config' | 'other';
}
interface SyncStatus {
    isOnline: boolean;
    lastSync: Date | null;
    pendingItems: number;
    syncInProgress: boolean;
    lastError?: string;
    dataTypes: {
        callLogs: {
            lastSync: Date | null;
            cached: number;
        };
        messages: {
            lastSync: Date | null;
            cached: number;
        };
        analytics: {
            lastSync: Date | null;
            cached: number;
        };
        config: {
            lastSync: Date | null;
            cached: number;
        };
    };
}
declare class OfflineService {
    private static instance;
    private cache;
    private offlineQueue;
    private isOnline;
    private syncInProgress;
    private syncStatus;
    private listeners;
    private constructor();
    static getInstance(): OfflineService;
    private setupEventListeners;
    private handleServiceWorkerMessage;
    private handleDataUpdate;
    private handleSyncComplete;
    private updateCacheStats;
    private notifyListeners;
    private loadFromStorage;
    private saveToStorage;
    private startPeriodicCleanup;
    private cleanupExpiredCache;
    /**
     * Cache data for offline access with priority and type
     */
    cacheData(key: string, data: any, ttlMinutes?: number, priority?: 'high' | 'medium' | 'low', dataType?: CachedData['dataType']): void;
    private updateDataTypeStats;
    /**
     * Get cached data
     */
    getCachedData(key: string): any | null;
    /**
     * Check if data is cached and valid
     */
    isCached(key: string): boolean;
    /**
     * Add request to offline queue with priority and type
     */
    queueRequest(method: OfflineQueueItem['method'], url: string, data?: any, maxRetries?: number, priority?: 'high' | 'medium' | 'low', dataType?: OfflineQueueItem['dataType']): string;
    /**
     * Sync offline queue when back online with priority handling
     */
    private syncOfflineQueue;
    private executeQueuedRequest;
    /**
     * Get offline queue status
     */
    getQueueStatus(): {
        pendingCount: number;
        isSyncing: boolean;
        isOnline: boolean;
    };
    /**
     * Clear all cached data
     */
    clearCache(): void;
    /**
     * Clear offline queue
     */
    clearQueue(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        totalItems: number;
        totalSize: number;
        oldestItem: number | null;
        newestItem: number | null;
    };
    /**
     * Preload critical data for offline access
     */
    preloadCriticalData(): Promise<void>;
    /**
     * Check if app can function offline
     */
    canFunctionOffline(): boolean;
    /**
     * Get sync status for PWA features
     */
    getSyncStatus(): SyncStatus;
    /**
     * Add status listener for PWA updates
     */
    addStatusListener(listener: (status: SyncStatus) => void): () => void;
    /**
     * Force sync for specific data type
     */
    forceSyncDataType(dataType: keyof SyncStatus['dataTypes']): Promise<void>;
    /**
     * Cache call logs for offline access
     */
    cacheCallLogs(callLogs: any[], ttlMinutes?: number): Promise<void>;
    /**
     * Cache messages for offline access
     */
    cacheMessages(messages: any[], ttlMinutes?: number): Promise<void>;
    /**
     * Get cached call logs
     */
    getCachedCallLogs(): any[];
    /**
     * Get cached messages
     */
    getCachedMessages(): any[];
    /**
     * Request push notification permission
     */
    requestNotificationPermission(): Promise<boolean>;
    /**
     * Subscribe to push notifications
     */
    subscribeToPushNotifications(): Promise<PushSubscription | null>;
    private urlBase64ToUint8Array;
    private sendSubscriptionToServer;
    /**
     * Show local notification
     */
    showNotification(title: string, options?: NotificationOptions): Promise<void>;
    /**
     * Clean up resources
     */
    destroy(): void;
}
export default OfflineService;
