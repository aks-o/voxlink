import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface NotificationContextType {
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
  showNotification: (title: string, options?: NotificationOptions) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  isSupported: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported('Notification' in window);
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    const { type, data } = event.data;
    
    switch (type) {
      case 'NOTIFICATION_RECEIVED':
        showToast(data.message, 'info');
        break;
      case 'CALL_INCOMING':
        showNotification('Incoming Call', {
          body: `Call from ${data.number}`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: 'incoming-call',
          requireInteraction: true,
          actions: [
            { action: 'answer', title: 'Answer' },
            { action: 'decline', title: 'Decline' },
          ],
        });
        break;
      case 'SMS_RECEIVED':
        showNotification('New Message', {
          body: data.message,
          icon: '/icons/icon-192x192.png',
          tag: 'sms-received',
        });
        break;
      default:
        break;
    }
  };

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      console.warn('[Notifications] Not supported in this browser');
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        console.log('[Notifications] Permission granted');
        showToast('Notifications enabled for VoxLink', 'success');
      } else {
        console.log('[Notifications] Permission denied');
        showToast('Notifications disabled. You can enable them in browser settings.', 'info');
      }
      
      return result;
    } catch (error) {
      console.error('[Notifications] Failed to request permission:', error);
      return 'denied';
    }
  };

  const showNotification = (title: string, options: NotificationOptions = {}) => {
    if (!isSupported || permission !== 'granted') {
      // Fallback to toast notification
      showToast(title, 'info');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options,
      });

      // Auto-close after 5 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      // Handle notification clicks
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        // Navigate to relevant page based on notification tag
        switch (options.tag) {
          case 'incoming-call':
            window.location.href = '/call-logs';
            break;
          case 'sms-received':
            window.location.href = '/inbox';
            break;
          default:
            window.location.href = '/dashboard';
            break;
        }
        
        notification.close();
      };

      console.log('[Notifications] Notification shown:', title);
    } catch (error) {
      console.error('[Notifications] Failed to show notification:', error);
      showToast(title, 'info');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'info':
      default:
        toast(message);
        break;
    }
  };

  const value: NotificationContextType = {
    permission,
    requestPermission,
    showNotification,
    showToast,
    isSupported,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Utility functions for common notifications
export const notificationUtils = {
  callReceived: (number: string) => ({
    title: 'Incoming Call',
    options: {
      body: `Call from ${number}`,
      tag: 'incoming-call',
      requireInteraction: true,
      actions: [
        { action: 'answer', title: 'Answer' },
        { action: 'decline', title: 'Decline' },
      ],
    },
  }),

  smsReceived: (number: string, message: string) => ({
    title: 'New Message',
    options: {
      body: `${number}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
      tag: 'sms-received',
    },
  }),

  callMissed: (number: string) => ({
    title: 'Missed Call',
    options: {
      body: `Missed call from ${number}`,
      tag: 'missed-call',
    },
  }),

  systemAlert: (message: string) => ({
    title: 'VoxLink Alert',
    options: {
      body: message,
      tag: 'system-alert',
    },
  }),
};