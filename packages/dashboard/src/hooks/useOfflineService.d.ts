interface OfflineServiceStatus {
    isOnline: boolean;
    pendingCount: number;
    isSyncing: boolean;
    lastSync: Date | null;
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
export declare const useOfflineService: () => {
    queueRequest: (method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH", url: string, data?: any, maxRetries?: number, priority?: "high" | "medium" | "low", dataType?: "call-logs" | "messages" | "analytics" | "config" | "other") => any;
    cacheData: (key: string, data: any, ttlMinutes?: number, priority?: "high" | "medium" | "low", dataType?: "call-logs" | "messages" | "analytics" | "config" | "other") => void;
    getCachedData: (key: string) => any;
    isCached: (key: string) => any;
    clearCache: () => void;
    clearQueue: () => void;
    canFunctionOffline: () => any;
    forceSyncDataType: (dataType: keyof OfflineServiceStatus["dataTypes"]) => Promise<any>;
    cacheCallLogs: (callLogs: any[], ttlMinutes?: number) => Promise<any>;
    cacheMessages: (messages: any[], ttlMinutes?: number) => Promise<any>;
    getCachedCallLogs: () => any;
    getCachedMessages: () => any;
    requestNotificationPermission: () => Promise<any>;
    subscribeToPushNotifications: () => Promise<any>;
    showNotification: (title: string, options?: NotificationOptions) => Promise<any>;
    isOnline: boolean;
    pendingCount: number;
    isSyncing: boolean;
    lastSync: Date | null;
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
};
export {};
