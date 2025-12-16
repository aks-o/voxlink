import React from 'react';
interface AnalyticsContextType {
    track: (event: string, properties?: Record<string, any>) => void;
    identify: (userId: string, traits?: Record<string, any>) => void;
    page: (name: string, properties?: Record<string, any>) => void;
}
export declare const useAnalytics: () => AnalyticsContextType;
interface AnalyticsProviderProps {
    children: React.ReactNode;
}
export declare const AnalyticsProvider: React.FC<AnalyticsProviderProps>;
declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        clarity: (...args: any[]) => void;
    }
}
export {};
