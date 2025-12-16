import safeStorage from "@/utils/storage";

import safeStorage from "@/utils/storage";

import safeStorage from "@/utils/storage";

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
    callLogs: { lastSync: Date | null; cached: number };
    messages: { lastSync: Date | null; cached: number };
    analytics: { lastSync: Date | null; cached: number };
    config: { lastSync: Date | null; cached: number };
  };
}

class OfflineService {
  private static instance: OfflineService;
  private cache: Map<string, CachedData> = new Map();
  private offlineQueue: OfflineQueueItem[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    lastSync: null,
    pendingItems: 0,
    syncInProgress: false,
    dataTypes: {
      callLogs: { lastSync: null, cached: 0 },
      messages: { lastSync: null, cached: 0 },
      analytics: { lastSync: null, cached: 0 },
      config: { lastSync: null, cached: 0 }
    }
  };
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  private constructor() {
    this.setupEventListeners();
    this.loadFromStorage();
    this.startPeriodicCleanup();
  }

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncStatus.isOnline = true;
      this.syncStatus.lastError = undefined;
      this.notifyListeners();
      this.syncOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.syncStatus.isOnline = false;
      this.notifyListeners();
    });

    // Sync when page becomes visible (user returns to app)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.syncOfflineQueue();
      }
    });

    // Service worker messages for PWA features
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });
    }
  }

  private handleServiceWorkerMessage(data: any): void {
    switch (data?.type) {
      case 'DATA_UPDATE':
        this.handleDataUpdate(data);
        break;
      case 'SYNC_COMPLETE':
        this.handleSyncComplete(data);
        break;
      case 'CACHE_STATS':
        this.updateCacheStats(data);
        break;
    }
  }

  private handleDataUpdate(data: any): void {
    // Update sync status for specific data types
    if (data.dataType && this.syncStatus.dataTypes[data.dataType as keyof typeof this.syncStatus.dataTypes]) {
      this.syncStatus.dataTypes[data.dataType as keyof typeof this.syncStatus.dataTypes].lastSync = new Date();
    }

    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('voxlink-data-update', {
      detail: data
    }));

    this.notifyListeners();
  }

  private handleSyncComplete(data: any): void {
    if (data.dataType && this.syncStatus.dataTypes[data.dataType as keyof typeof this.syncStatus.dataTypes]) {
      this.syncStatus.dataTypes[data.dataType as keyof typeof this.syncStatus.dataTypes].lastSync = new Date();
    }
    this.notifyListeners();
  }

  private updateCacheStats(data: any): void {
    // Update cached item counts
    Object.keys(this.syncStatus.dataTypes).forEach(key => {
      if (data[key]) {
        (this.syncStatus.dataTypes as any)[key].cached = data[key].count || 0;
      }
    });
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener({ ...this.syncStatus }));
  }

  private loadFromStorage(): void {
    try {
      // Load cache
      const cachedData = safeStorage.getItem('voxlink_offline_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        this.cache = new Map(parsed);
      }

      // Load offline queue
      const queueData = safeStorage.getItem('voxlink_offline_queue');
      if (queueData) {
        this.offlineQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Failed to load offline data from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      // Save cache
      safeStorage.setItem('voxlink_offline_cache', JSON.stringify(Array.from(this.cache.entries())));
      
      // Save offline queue
      localStorage.setItem('voxlink_offline_queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline data to storage:', error);
    }
  }

  private startPeriodicCleanup(): void {
    // Clean up expired cache entries every 5 minutes
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 5 * 60 * 1000);
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expiresAt < now) {
        this.cache.delete(key);
      }
    }
    this.saveToStorage();
  }

  /**
   * Cache data for offline access with priority and type
   */
  cacheData(
    key: string, 
    data: any, 
    ttlMinutes: number = 60,
    priority: 'high' | 'medium' | 'low' = 'medium',
    dataType: CachedData['dataType'] = 'other'
  ): void {
    const now = Date.now();
    const cachedData: CachedData = {
      data,
      timestamp: now,
      expiresAt: now + (ttlMinutes * 60 * 1000),
      priority,
      dataType
    };

    this.cache.set(key, cachedData);
    this.updateDataTypeStats(dataType);
    this.saveToStorage();
  }

  private updateDataTypeStats(dataType: CachedData['dataType']): void {
    const count = Array.from(this.cache.values()).filter(item => item.dataType === dataType).length;
    
    switch (dataType) {
      case 'call-logs':
        this.syncStatus.dataTypes.callLogs.cached = count;
        break;
      case 'messages':
        this.syncStatus.dataTypes.messages.cached = count;
        break;
      case 'analytics':
        this.syncStatus.dataTypes.analytics.cached = count;
        break;
      case 'config':
        this.syncStatus.dataTypes.config.cached = count;
        break;
    }
    
    this.notifyListeners();
  }

  /**
   * Get cached data
   */
  getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    if (cached.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }

    return cached.data;
  }

  /**
   * Check if data is cached and valid
   */
  isCached(key: string): boolean {
    return this.getCachedData(key) !== null;
  }

  /**
   * Add request to offline queue with priority and type
   */
  queueRequest(
    method: OfflineQueueItem['method'],
    url: string,
    data?: any,
    maxRetries: number = 3,
    priority: 'high' | 'medium' | 'low' = 'medium',
    dataType: OfflineQueueItem['dataType'] = 'other'
  ): string {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const queueItem: OfflineQueueItem = {
      id,
      method,
      url,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries,
      priority,
      dataType
    };

    this.offlineQueue.push(queueItem);
    this.syncStatus.pendingItems = this.offlineQueue.length;
    this.saveToStorage();
    this.notifyListeners();

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncOfflineQueue();
    }

    return id;
  }

  /**
   * Sync offline queue when back online with priority handling
   */
  private async syncOfflineQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.offlineQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    this.syncStatus.syncInProgress = true;
    this.notifyListeners();

    try {
      // Sort by priority: high -> medium -> low
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const sortedItems = [...this.offlineQueue].sort((a, b) => 
        priorityOrder[b.priority] - priorityOrder[a.priority]
      );
      
      for (const item of sortedItems) {
        try {
          await this.executeQueuedRequest(item);
          
          // Remove successful item from queue
          this.offlineQueue = this.offlineQueue.filter(q => q.id !== item.id);
          
          // Notify about successful sync
          window.dispatchEvent(new CustomEvent('voxlink-sync-success', {
            detail: { item, type: 'queue-item' }
          }));
          
        } catch (error) {
          console.error('Failed to sync queued request:', error);
          
          // Increment retry count
          const queueItem = this.offlineQueue.find(q => q.id === item.id);
          if (queueItem) {
            queueItem.retryCount++;
            
            // Remove if max retries exceeded
            if (queueItem.retryCount >= queueItem.maxRetries) {
              this.offlineQueue = this.offlineQueue.filter(q => q.id !== item.id);
              console.warn('Max retries exceeded for queued request:', item);
              
              // Notify about failed sync
              window.dispatchEvent(new CustomEvent('voxlink-sync-failed', {
                detail: { item, error: error instanceof Error ? error.message : 'Unknown error' }
              }));
            }
          }
        }
      }

      this.syncStatus.pendingItems = this.offlineQueue.length;
      this.syncStatus.lastSync = new Date();
      this.syncStatus.lastError = undefined;
      this.saveToStorage();
      
    } catch (error) {
      console.error('Sync queue failed:', error);
      this.syncStatus.lastError = error instanceof Error ? error.message : 'Unknown sync error';
    } finally {
      this.syncInProgress = false;
      this.syncStatus.syncInProgress = false;
      this.notifyListeners();
    }
  }

  private async executeQueuedRequest(item: OfflineQueueItem): Promise<any> {
    const options: RequestInit = {
      method: item.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (item.data && item.method !== 'GET') {
      options.body = JSON.stringify(item.data);
    }

    const response = await fetch(item.url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get offline queue status
   */
  getQueueStatus(): {
    pendingCount: number;
    isSyncing: boolean;
    isOnline: boolean;
  } {
    return {
      pendingCount: this.offlineQueue.length,
      isSyncing: this.syncInProgress,
      isOnline: this.isOnline,
    };
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
    this.saveToStorage();
  }

  /**
   * Clear offline queue
   */
  clearQueue(): void {
    this.offlineQueue = [];
    this.saveToStorage();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalItems: number;
    totalSize: number;
    oldestItem: number | null;
    newestItem: number | null;
  } {
    let totalSize = 0;
    let oldestItem: number | null = null;
    let newestItem: number | null = null;

    for (const [key, value] of this.cache.entries()) {
      totalSize += JSON.stringify(value).length;
      
      if (oldestItem === null || value.timestamp < oldestItem) {
        oldestItem = value.timestamp;
      }
      
      if (newestItem === null || value.timestamp > newestItem) {
        newestItem = value.timestamp;
      }
    }

    return {
      totalItems: this.cache.size,
      totalSize,
      oldestItem,
      newestItem,
    };
  }

  /**
   * Preload critical data for offline access
   */
  async preloadCriticalData(): Promise<void> {
    try {
      // Preload user's numbers
      const numbersResponse = await fetch('/api/v1/numbers/my-numbers');
      if (numbersResponse.ok) {
        const numbersData = await numbersResponse.json();
        this.cacheData('user_numbers', numbersData, 30); // Cache for 30 minutes
      }

      // Preload user profile
      const profileResponse = await fetch('/api/v1/auth/profile');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        this.cacheData('user_profile', profileData, 60); // Cache for 1 hour
      }

      // Preload recent activity
      const activityResponse = await fetch('/api/v1/analytics/recent-activity');
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        this.cacheData('recent_activity', activityData, 15); // Cache for 15 minutes
      }

    } catch (error) {
      console.error('Failed to preload critical data:', error);
    }
  }

  /**
   * Check if app can function offline
   */
  canFunctionOffline(): boolean {
    const criticalData = [
      'user_numbers',
      'user_profile',
    ];

    return criticalData.every(key => this.isCached(key));
  }

  /**
   * Get sync status for PWA features
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Add status listener for PWA updates
   */
  addStatusListener(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Force sync for specific data type
   */
  async forceSyncDataType(dataType: keyof SyncStatus['dataTypes']): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    try {
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(`${dataType}-sync`);
      }
    } catch (error) {
      console.error(`Failed to force sync ${dataType}:`, error);
      throw error;
    }
  }

  /**
   * Cache call logs for offline access
   */
  async cacheCallLogs(callLogs: any[], ttlMinutes: number = 120): Promise<void> {
    callLogs.forEach((log, index) => {
      this.cacheData(`call_log_${log.id || index}`, log, ttlMinutes, 'high', 'call-logs');
    });
    
    // Cache the full list
    this.cacheData('call_logs_list', callLogs, ttlMinutes, 'high', 'call-logs');
  }

  /**
   * Cache messages for offline access
   */
  async cacheMessages(messages: any[], ttlMinutes: number = 60): Promise<void> {
    messages.forEach((message, index) => {
      this.cacheData(`message_${message.id || index}`, message, ttlMinutes, 'high', 'messages');
    });
    
    // Cache the full list
    this.cacheData('messages_list', messages, ttlMinutes, 'high', 'messages');
  }

  /**
   * Get cached call logs
   */
  getCachedCallLogs(): any[] {
    return this.getCachedData('call_logs_list') || [];
  }

  /**
   * Get cached messages
   */
  getCachedMessages(): any[] {
    return this.getCachedData('messages_list') || [];
  }

  /**
   * Request push notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications not supported');
        return null;
      }

      const hasPermission = await this.requestNotificationPermission();
      if (!hasPermission) {
        console.warn('Notification permission denied');
        return null;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          // Replace with your VAPID public key
          'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9f8HnKJuOmLWjMpS_7VnYkYdYWjAlBEhxARBytaFhQx-QVBdZWps'
        )
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/v1/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  /**
   * Show local notification
   */
  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    const hasPermission = await this.requestNotificationPermission();
    if (!hasPermission) {
      return;
    }

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options
      });
    } else {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        ...options
      });
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.listeners.clear();
  }
}

export default OfflineService;