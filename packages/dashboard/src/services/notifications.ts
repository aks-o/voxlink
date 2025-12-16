// Enhanced Push Notification Service for VoxLink PWA
// Handles real-time alerts, call notifications, and message notifications

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

interface VoxLinkNotificationData {
  type: 'call' | 'message' | 'alert' | 'system';
  id: string;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
  metadata?: Record<string, any>;
}

class NotificationService {
  private static instance: NotificationService;
  private subscription: PushSubscription | null = null;
  private isSupported: boolean = false;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.checkSupport();
    this.initializePermission();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private checkSupport(): void {
    this.isSupported = 'Notification' in window && 
                      'serviceWorker' in navigator && 
                      'PushManager' in window;
  }

  private async initializePermission(): Promise<void> {
    if (this.isSupported) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      console.warn('Notification permission previously denied');
      return false;
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(): Promise<boolean> {
    try {
      if (!this.isSupported) {
        return false;
      }

      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        this.subscription = existingSubscription;
        return true;
      }

      // Create new subscription
      this.subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          // VAPID public key - replace with your actual key
          'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9f8HnKJuOmLWjMpS_7VnYkYdYWjAlBEhxARBytaFhQx-QVBdZWps'
        )
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);
      
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(): Promise<boolean> {
    try {
      if (!this.subscription) {
        return true;
      }

      const success = await this.subscription.unsubscribe();
      if (success) {
        // Notify server about unsubscription
        await this.removeSubscriptionFromServer(this.subscription);
        this.subscription = null;
      }
      
      return success;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  /**
   * Show local notification
   */
  async showNotification(config: NotificationConfig): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.warn('Cannot show notification: permission denied');
      return;
    }

    const defaultConfig: Partial<NotificationConfig> = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      silent: false
    };

    const finalConfig = { ...defaultConfig, ...config };

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(finalConfig.title, {
          body: finalConfig.body,
          icon: finalConfig.icon,
          badge: finalConfig.badge,
          image: finalConfig.image,
          tag: finalConfig.tag,
          data: finalConfig.data,
          actions: finalConfig.actions,
          requireInteraction: finalConfig.requireInteraction,
          silent: finalConfig.silent,
          vibrate: finalConfig.vibrate
        });
      } else {
        // Fallback to regular notification
        new Notification(finalConfig.title, {
          body: finalConfig.body,
          icon: finalConfig.icon,
          tag: finalConfig.tag,
          data: finalConfig.data,
          requireInteraction: finalConfig.requireInteraction,
          silent: finalConfig.silent
        });
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  /**
   * Show call notification
   */
  async showCallNotification(
    callerName: string, 
    callerNumber: string, 
    callId: string
  ): Promise<void> {
    await this.showNotification({
      title: 'Incoming Call',
      body: `${callerName || 'Unknown'} (${callerNumber})`,
      tag: `call-${callId}`,
      requireInteraction: true,
      vibrate: [300, 100, 300, 100, 300],
      actions: [
        {
          action: 'answer',
          title: 'Answer',
          icon: '/icons/answer-call.png'
        },
        {
          action: 'decline',
          title: 'Decline',
          icon: '/icons/decline-call.png'
        }
      ],
      data: {
        type: 'call',
        id: callId,
        timestamp: Date.now(),
        priority: 'high',
        actionUrl: `/calls/${callId}`,
        metadata: {
          callerName,
          callerNumber
        }
      } as VoxLinkNotificationData
    });
  }

  /**
   * Show message notification
   */
  async showMessageNotification(
    senderName: string, 
    messagePreview: string, 
    conversationId: string
  ): Promise<void> {
    await this.showNotification({
      title: `New message from ${senderName}`,
      body: messagePreview,
      tag: `message-${conversationId}`,
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'reply',
          title: 'Reply',
          icon: '/icons/reply-message.png'
        },
        {
          action: 'view',
          title: 'View',
          icon: '/icons/view-message.png'
        }
      ],
      data: {
        type: 'message',
        id: conversationId,
        timestamp: Date.now(),
        priority: 'medium',
        actionUrl: `/inbox/sms-chats?conversation=${conversationId}`,
        metadata: {
          senderName,
          messagePreview
        }
      } as VoxLinkNotificationData
    });
  }

  /**
   * Show system alert notification
   */
  async showSystemAlert(
    title: string, 
    message: string, 
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<void> {
    await this.showNotification({
      title,
      body: message,
      tag: `alert-${Date.now()}`,
      requireInteraction: priority === 'high',
      vibrate: priority === 'high' ? [300, 100, 300] : [200, 100, 200],
      data: {
        type: 'alert',
        id: `alert-${Date.now()}`,
        timestamp: Date.now(),
        priority,
        metadata: {
          title,
          message
        }
      } as VoxLinkNotificationData
    });
  }

  /**
   * Show performance alert
   */
  async showPerformanceAlert(metric: string, value: string, threshold: string): Promise<void> {
    await this.showNotification({
      title: 'Performance Alert',
      body: `${metric}: ${value} (threshold: ${threshold})`,
      tag: `performance-${metric}`,
      requireInteraction: true,
      actions: [
        {
          action: 'view-analytics',
          title: 'View Analytics',
          icon: '/icons/analytics.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/dismiss.png'
        }
      ],
      data: {
        type: 'alert',
        id: `performance-${metric}-${Date.now()}`,
        timestamp: Date.now(),
        priority: 'high',
        actionUrl: '/analytics',
        metadata: {
          metric,
          value,
          threshold
        }
      } as VoxLinkNotificationData
    });
  }

  /**
   * Clear notifications by tag
   */
  async clearNotifications(tag?: string): Promise<void> {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const notifications = await registration.getNotifications(tag ? { tag } : undefined);
        
        notifications.forEach(notification => {
          notification.close();
        });
      }
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }

  /**
   * Get current subscription status
   */
  getSubscriptionStatus(): {
    isSupported: boolean;
    hasPermission: boolean;
    isSubscribed: boolean;
    subscription: PushSubscription | null;
  } {
    return {
      isSupported: this.isSupported,
      hasPermission: this.permission === 'granted',
      isSubscribed: this.subscription !== null,
      subscription: this.subscription
    };
  }

  /**
   * Test notification functionality
   */
  async testNotification(): Promise<void> {
    await this.showNotification({
      title: 'VoxLink Test Notification',
      body: 'Notifications are working correctly!',
      tag: 'test-notification',
      vibrate: [200, 100, 200],
      data: {
        type: 'system',
        id: 'test',
        timestamp: Date.now(),
        priority: 'low'
      } as VoxLinkNotificationData
    });
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
      const response = await fetch('/api/v1/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
      throw error;
    }
  }

  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/v1/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
export default notificationService;