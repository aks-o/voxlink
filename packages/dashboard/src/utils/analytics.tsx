import React, { createContext, useContext, useEffect } from 'react';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
}

interface AnalyticsContextType {
  track: (event: string, properties?: Record<string, any>) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
  page: (name: string, properties?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  useEffect(() => {
    // Initialize analytics services
    initializeAnalytics();
  }, []);

  const initializeAnalytics = () => {
    // Initialize Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_title: 'VoxLink Dashboard',
        page_location: window.location.href,
      });
    }

    // Initialize Microsoft Clarity
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('set', 'VoxLink', 'Dashboard');
    }

    // Initialize custom analytics
    console.log('[Analytics] Initialized VoxLink analytics');
  };

  const track = (event: string, properties: Record<string, any> = {}) => {
    try {
      // Google Analytics 4
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', event, {
          ...properties,
          app_name: 'VoxLink Dashboard',
          timestamp: new Date().toISOString(),
        });
      }

      // Microsoft Clarity
      if (typeof window !== 'undefined' && window.clarity) {
        window.clarity('event', event);
      }

      // Custom analytics endpoint
      sendToAnalytics({
        event,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        },
      });

      console.log('[Analytics] Event tracked:', event, properties);
    } catch (error) {
      console.error('[Analytics] Failed to track event:', error);
    }
  };

  const identify = (userId: string, traits: Record<string, any> = {}) => {
    try {
      // Google Analytics 4
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', 'GA_MEASUREMENT_ID', {
          user_id: userId,
          custom_map: traits,
        });
      }

      // Microsoft Clarity
      if (typeof window !== 'undefined' && window.clarity) {
        window.clarity('identify', userId, traits);
      }

      // Custom analytics
      sendToAnalytics({
        event: 'identify',
        properties: {
          userId,
          traits,
          timestamp: new Date().toISOString(),
        },
      });

      console.log('[Analytics] User identified:', userId, traits);
    } catch (error) {
      console.error('[Analytics] Failed to identify user:', error);
    }
  };

  const page = (name: string, properties: Record<string, any> = {}) => {
    try {
      // Google Analytics 4
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'page_view', {
          page_title: name,
          page_location: window.location.href,
          ...properties,
        });
      }

      // Microsoft Clarity
      if (typeof window !== 'undefined' && window.clarity) {
        window.clarity('set', 'page', name);
      }

      // Custom analytics
      sendToAnalytics({
        event: 'page_view',
        properties: {
          page: name,
          url: window.location.href,
          referrer: document.referrer,
          ...properties,
          timestamp: new Date().toISOString(),
        },
      });

      console.log('[Analytics] Page viewed:', name, properties);
    } catch (error) {
      console.error('[Analytics] Failed to track page view:', error);
    }
  };

  const sendToAnalytics = async (data: AnalyticsEvent) => {
    try {
      // In a real implementation, send to your analytics endpoint
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
      
      // For now, just log to console
      console.log('[Analytics] Data sent:', data);
    } catch (error) {
      console.error('[Analytics] Failed to send data:', error);
    }
  };

  const value: AnalyticsContextType = {
    track,
    identify,
    page,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    clarity: (...args: any[]) => void;
  }
}