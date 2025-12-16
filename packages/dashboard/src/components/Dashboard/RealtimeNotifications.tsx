import React, { useState, useEffect } from 'react';
import { useSystemNotifications } from '../../hooks/useRealtime';

interface NotificationItemProps {
  id: string;
  type: 'alert' | 'maintenance' | 'update';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  id,
  type,
  severity,
  message,
  timestamp,
  onMarkAsRead,
  onDismiss
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'maintenance':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'update':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className={`border rounded-lg p-4 mb-3 ${getSeverityColor(severity)}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getTypeIcon(type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium uppercase tracking-wide">
                {type}
              </span>
              <span className="text-xs font-medium uppercase tracking-wide">
                {severity}
              </span>
            </div>
            <span className="text-xs opacity-75">
              {formatTimestamp(timestamp)}
            </span>
          </div>
          <p className="text-sm font-medium mb-2">{message}</p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onMarkAsRead(id)}
              className="text-xs font-medium hover:underline"
            >
              Mark as Read
            </button>
            <button
              onClick={() => onDismiss(id)}
              className="text-xs font-medium hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PerformanceAlertItemProps {
  type: 'threshold_breach' | 'system_overload' | 'service_degradation';
  metric: string;
  currentValue: number;
  threshold: number;
  timestamp: Date;
  affectedServices: string[];
  onDismiss: (alertId: string) => void;
}

const PerformanceAlertItem: React.FC<PerformanceAlertItemProps> = ({
  type,
  metric,
  currentValue,
  threshold,
  timestamp,
  affectedServices,
  onDismiss
}) => {
  const getAlertColor = (type: string) => {
    switch (type) {
      case 'system_overload': return 'bg-red-50 border-red-200 text-red-800';
      case 'threshold_breach': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'service_degradation': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatValue = (value: number, metric: string) => {
    if (metric.includes('percentage') || metric.includes('rate')) {
      return `${(value * 100).toFixed(1)}%`;
    }
    if (metric.includes('time') || metric.includes('duration')) {
      return `${value.toFixed(2)}s`;
    }
    return value.toString();
  };

  return (
    <div className={`border rounded-lg p-4 mb-3 ${getAlertColor(type)}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
          <span className="text-sm font-medium">Performance Alert</span>
        </div>
        <span className="text-xs opacity-75">
          {new Date(timestamp).toLocaleTimeString()}
        </span>
      </div>
      
      <div className="mb-3">
        <p className="text-sm font-medium mb-1">
          {metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </p>
        <div className="flex items-center space-x-4 text-sm">
          <span>Current: <strong>{formatValue(currentValue, metric)}</strong></span>
          <span>Threshold: <strong>{formatValue(threshold, metric)}</strong></span>
        </div>
      </div>

      {affectedServices.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium mb-1">Affected Services:</p>
          <div className="flex flex-wrap gap-1">
            {affectedServices.map(service => (
              <span key={service} className="px-2 py-1 bg-white bg-opacity-50 rounded text-xs">
                {service}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => onDismiss(`${type}-${metric}-${timestamp.getTime()}`)}
        className="text-xs font-medium hover:underline"
      >
        Dismiss Alert
      </button>
    </div>
  );
};

interface RealtimeNotificationsProps {
  className?: string;
  maxVisible?: number;
}

const RealtimeNotifications: React.FC<RealtimeNotificationsProps> = ({ 
  className = '', 
  maxVisible = 10 
}) => {
  const { notifications, performanceAlerts, unreadCount, markAsRead, clearAll } = useSystemNotifications();
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const handleDismissNotification = (id: string) => {
    setDismissedNotifications(prev => new Set([...prev, id]));
    markAsRead(id);
  };

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const visibleNotifications = notifications
    .filter(notification => !dismissedNotifications.has(notification.message + notification.timestamp))
    .slice(0, maxVisible);

  const visibleAlerts = performanceAlerts
    .filter(alert => !dismissedAlerts.has(`${alert.type}-${alert.metric}-${alert.timestamp.getTime()}`))
    .slice(0, maxVisible);

  const totalVisible = visibleNotifications.length + visibleAlerts.length;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-gray-900">Real-time Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          {totalVisible > 0 && (
            <button
              onClick={clearAll}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {totalVisible === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-6h4v6zM9 3h6l-3-3-3 3zM4 9h6l-3-3-3 3z" />
              </svg>
            </div>
            <p className="text-gray-500">No notifications at this time</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {/* Performance Alerts */}
            {visibleAlerts.map((alert, index) => (
              <PerformanceAlertItem
                key={`${alert.type}-${alert.metric}-${alert.timestamp.getTime()}`}
                type={alert.type}
                metric={alert.metric}
                currentValue={alert.currentValue}
                threshold={alert.threshold}
                timestamp={alert.timestamp}
                affectedServices={alert.affectedServices}
                onDismiss={handleDismissAlert}
              />
            ))}

            {/* System Notifications */}
            {visibleNotifications.map((notification, index) => (
              <NotificationItem
                key={`${notification.message}-${notification.timestamp}`}
                id={`${notification.message}-${notification.timestamp}`}
                type={notification.type}
                severity={notification.severity}
                message={notification.message}
                timestamp={notification.timestamp}
                onMarkAsRead={markAsRead}
                onDismiss={handleDismissNotification}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RealtimeNotifications;