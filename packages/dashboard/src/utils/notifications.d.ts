import React from 'react';
interface NotificationContextType {
    permission: NotificationPermission;
    requestPermission: () => Promise<NotificationPermission>;
    showNotification: (title: string, options?: NotificationOptions) => void;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    isSupported: boolean;
}
export declare const useNotifications: () => NotificationContextType;
interface NotificationProviderProps {
    children: React.ReactNode;
}
export declare const NotificationProvider: React.FC<NotificationProviderProps>;
export declare const notificationUtils: {
    callReceived: (number: string) => {
        title: string;
        options: {
            body: string;
            tag: string;
            requireInteraction: boolean;
            actions: {
                action: string;
                title: string;
            }[];
        };
    };
    smsReceived: (number: string, message: string) => {
        title: string;
        options: {
            body: string;
            tag: string;
        };
    };
    callMissed: (number: string) => {
        title: string;
        options: {
            body: string;
            tag: string;
        };
    };
    systemAlert: (message: string) => {
        title: string;
        options: {
            body: string;
            tag: string;
        };
    };
};
export {};
