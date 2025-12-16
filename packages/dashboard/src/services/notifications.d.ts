interface NotificationConfig {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    image?: string;
    tag?: string;
    data?: any;
    actions?: NotificationAction[];
    requireInteraction?: boolean;
    silent?: boolean;
    vibrate?: number[];
}
declare class NotificationService {
    private static instance;
    private subscription;
    private isSupported;
    private permission;
    private constructor();
    static getInstance(): NotificationService;
    private checkSupport;
    private initializePermission;
    /**
     * Request notification permission from user
     */
    requestPermission(): Promise<boolean>;
    /**
     * Subscribe to push notifications
     */
    subscribeToPush(): Promise<boolean>;
    /**
     * Unsubscribe from push notifications
     */
    unsubscribeFromPush(): Promise<boolean>;
    /**
     * Show local notification
     */
    showNotification(config: NotificationConfig): Promise<void>;
    /**
     * Show call notification
     */
    showCallNotification(callerName: string, callerNumber: string, callId: string): Promise<void>;
    /**
     * Show message notification
     */
    showMessageNotification(senderName: string, messagePreview: string, conversationId: string): Promise<void>;
    /**
     * Show system alert notification
     */
    showSystemAlert(title: string, message: string, priority?: 'high' | 'medium' | 'low'): Promise<void>;
    /**
     * Show performance alert
     */
    showPerformanceAlert(metric: string, value: string, threshold: string): Promise<void>;
    /**
     * Clear notifications by tag
     */
    clearNotifications(tag?: string): Promise<void>;
    /**
     * Get current subscription status
     */
    getSubscriptionStatus(): {
        isSupported: boolean;
        hasPermission: boolean;
        isSubscribed: boolean;
        subscription: PushSubscription | null;
    };
    /**
     * Test notification functionality
     */
    testNotification(): Promise<void>;
    private urlBase64ToUint8Array;
    private sendSubscriptionToServer;
    private removeSubscriptionFromServer;
}
export declare const notificationService: NotificationService;
export default notificationService;
