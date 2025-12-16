import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useResponsive, useOffline } from '../../hooks/useResponsive';
import { useOffline as useOfflineHook } from '../../hooks/useOffline';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNavigation from '../Mobile/MobileNavigation';
import OfflineService from '../../services/offline.service';
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface ResponsiveLayoutProps {
  children?: React.ReactNode;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  
  const { isMobile, isTablet, isDesktop, isTouchDevice } = useResponsive();
  const { isOnline, isOffline, wasOffline } = useOfflineHook();
  
  const offlineService = OfflineService.getInstance();

  useEffect(() => {
    // Preload critical data when app loads
    if (isOnline) {
      setIsPreloading(true);
      offlineService.preloadCriticalData().finally(() => {
        setIsPreloading(false);
      });
    }
  }, [isOnline]);

  useEffect(() => {
    // Show offline notice when going offline
    if (isOffline) {
      setShowOfflineNotice(true);
    }
    
    // Hide notice after coming back online
    if (isOnline && wasOffline) {
      const timer = setTimeout(() => {
        setShowOfflineNotice(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, isOffline, wasOffline]);

  useEffect(() => {
    // Close mobile sidebar when switching to desktop
    if (isDesktop && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [isDesktop, sidebarOpen]);

  const handleRetryConnection = async () => {
    setIsPreloading(true);
    try {
      await offlineService.preloadCriticalData();
    } finally {
      setIsPreloading(false);
    }
  };

  const queueStatus = offlineService.getQueueStatus();
  const canFunctionOffline = offlineService.canFunctionOffline();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Offline Notice */}
      {(showOfflineNotice || (isOffline && !canFunctionOffline)) && (
        <div className={`
          fixed top-0 left-0 right-0 z-50 p-4 text-center transition-all duration-300
          ${isOffline 
            ? 'bg-red-500 text-white' 
            : 'bg-green-500 text-white'
          }
        `}>
          <div className="flex items-center justify-center space-x-2">
            {isOffline ? (
              <>
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {canFunctionOffline 
                    ? 'You\'re offline. Some features may be limited.' 
                    : 'You\'re offline. Please check your connection.'
                  }
                </span>
                {!canFunctionOffline && (
                  <button
                    onClick={handleRetryConnection}
                    disabled={isPreloading}
                    className="ml-2 px-2 py-1 bg-white bg-opacity-20 rounded text-xs hover:bg-opacity-30 transition-colors"
                  >
                    {isPreloading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                  </button>
                )}
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">Back online!</span>
                {queueStatus.pendingCount > 0 && (
                  <span className="text-xs opacity-90">
                    Syncing {queueStatus.pendingCount} pending changes...
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className={`flex-1 flex ${showOfflineNotice || (isOffline && !canFunctionOffline) ? 'pt-16' : ''}`}>
        {/* Desktop Sidebar */}
        {isDesktop && (
          <div className="w-64 flex-shrink-0">
            <Sidebar isOpen={true} onClose={() => {}} />
          </div>
        )}

        {/* Mobile Navigation */}
        {isMobile && (
          <MobileNavigation 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <Header 
            onMenuClick={() => setSidebarOpen(true)}
            isMobile={isMobile}
            isTablet={isTablet}
            isTouchDevice={isTouchDevice}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            <div className={`
              mx-auto px-4 py-6
              ${isMobile ? 'max-w-full' : isTablet ? 'max-w-4xl' : 'max-w-7xl'}
              ${isMobile ? 'px-4' : 'px-6 lg:px-8'}
            `}>
              {children || <Outlet />}
            </div>
          </main>

          {/* Mobile Bottom Navigation (if needed) */}
          {isMobile && (
            <div className="border-t border-gray-200 bg-white">
              <div className="flex items-center justify-around py-2">
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  {isOnline ? (
                    <>
                      <Wifi className="w-3 h-3" />
                      <span>Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3" />
                      <span>Offline</span>
                    </>
                  )}
                </div>
                
                {queueStatus.pendingCount > 0 && (
                  <div className="flex items-center space-x-1 text-xs text-orange-600">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>{queueStatus.pendingCount} pending</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Touch Feedback Overlay */}
      {isTouchDevice && (
        <style jsx>{`
          .touch-manipulation {
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }
          
          .active\\:scale-95:active {
            transform: scale(0.95);
          }
          
          .active\\:bg-blue-800:active {
            background-color: #1e40af;
          }
        `}</style>
      )}
    </div>
  );
};

export default ResponsiveLayout;