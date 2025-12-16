import { useEffect, useState, useCallback, useRef } from 'react';
import webSocketService, { 
  CallEvent, 
  AgentStatusEvent, 
  SystemNotification, 
  PerformanceAlert, 
  LiveCallMetrics 
} from '../services/websocket';

export interface RealtimeState {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastUpdate: Date | null;
  latency: number | null;
}

export interface UseRealtimeOptions {
  autoConnect?: boolean;
  reconnectOnError?: boolean;
  pingInterval?: number;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const {
    autoConnect = true,
    reconnectOnError = true,
    pingInterval = 30000
  } = options;

  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    connectionStatus: 'disconnected',
    lastUpdate: null,
    latency: null
  });

  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateConnectionStatus = useCallback((status: RealtimeState['connectionStatus']) => {
    setState(prev => ({
      ...prev,
      connectionStatus: status,
      isConnected: status === 'connected',
      lastUpdate: new Date()
    }));
  }, []);

  const startPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    pingIntervalRef.current = setInterval(async () => {
      try {
        const latency = await webSocketService.ping();
        setState(prev => ({
          ...prev,
          latency,
          lastUpdate: new Date()
        }));
      } catch (error) {
        console.warn('Ping failed:', error);
        setState(prev => ({
          ...prev,
          latency: null
        }));
      }
    }, pingInterval);
  }, [pingInterval]);

  const stopPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleConnectionEstablished = () => {
      updateConnectionStatus('connected');
      startPingInterval();
    };

    const handleConnectionLost = () => {
      updateConnectionStatus('disconnected');
      stopPingInterval();
      
      if (reconnectOnError) {
        setTimeout(() => {
          webSocketService.reconnect();
        }, 2000);
      }
    };

    const handleConnectionFailed = () => {
      updateConnectionStatus('error');
      stopPingInterval();
    };

    if (autoConnect) {
      updateConnectionStatus('connecting');
    }

    webSocketService.on('connection:established', handleConnectionEstablished);
    webSocketService.on('connection:lost', handleConnectionLost);
    webSocketService.on('connection:failed', handleConnectionFailed);

    return () => {
      webSocketService.off('connection:established', handleConnectionEstablished);
      webSocketService.off('connection:lost', handleConnectionLost);
      webSocketService.off('connection:failed', handleConnectionFailed);
      stopPingInterval();
    };
  }, [autoConnect, reconnectOnError, updateConnectionStatus, startPingInterval, stopPingInterval]);

  const connect = useCallback(() => {
    updateConnectionStatus('connecting');
    webSocketService.reconnect();
  }, [updateConnectionStatus]);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    updateConnectionStatus('disconnected');
    stopPingInterval();
  }, [updateConnectionStatus, stopPingInterval]);

  return {
    ...state,
    connect,
    disconnect,
    webSocketService
  };
}

export function useCallEvents() {
  const [callEvents, setCallEvents] = useState<CallEvent[]>([]);
  const [activeCalls, setActiveCalls] = useState<Map<string, CallEvent>>(new Map());

  useEffect(() => {
    const handleCallEvent = (event: CallEvent) => {
      setCallEvents(prev => [event, ...prev.slice(0, 99)]); // Keep last 100 events
      
      setActiveCalls(prev => {
        const newMap = new Map(prev);
        
        if (event.type === 'incoming' || event.type === 'answered') {
          newMap.set(event.callId, event);
        } else if (event.type === 'ended') {
          newMap.delete(event.callId);
        }
        
        return newMap;
      });
    };

    webSocketService.on('call:incoming', handleCallEvent);
    webSocketService.on('call:answered', handleCallEvent);
    webSocketService.on('call:ended', handleCallEvent);
    webSocketService.on('call:transferred', handleCallEvent);

    return () => {
      webSocketService.off('call:incoming', handleCallEvent);
      webSocketService.off('call:answered', handleCallEvent);
      webSocketService.off('call:ended', handleCallEvent);
      webSocketService.off('call:transferred', handleCallEvent);
    };
  }, []);

  const joinCallMonitoring = useCallback((callId: string) => {
    webSocketService.joinCallMonitoring(callId);
  }, []);

  const leaveCallMonitoring = useCallback((callId: string) => {
    webSocketService.leaveCallMonitoring(callId);
  }, []);

  const whisperToAgent = useCallback((callId: string, agentId: string, message: string) => {
    webSocketService.whisperToAgent(callId, agentId, message);
  }, []);

  const bargeIntoCall = useCallback((callId: string, supervisorId: string) => {
    webSocketService.bargeIntoCall(callId, supervisorId);
  }, []);

  return {
    callEvents,
    activeCalls: Array.from(activeCalls.values()),
    joinCallMonitoring,
    leaveCallMonitoring,
    whisperToAgent,
    bargeIntoCall
  };
}

export function useAgentStatus(agentIds?: string[]) {
  const [agentStatuses, setAgentStatuses] = useState<Map<string, AgentStatusEvent>>(new Map());

  useEffect(() => {
    const handleAgentStatusChange = (event: AgentStatusEvent) => {
      setAgentStatuses(prev => {
        const newMap = new Map(prev);
        newMap.set(event.agentId, event);
        return newMap;
      });
    };

    webSocketService.on('agent:status_change', handleAgentStatusChange);

    if (agentIds && agentIds.length > 0) {
      webSocketService.subscribeToAgentUpdates(agentIds);
    }

    return () => {
      webSocketService.off('agent:status_change', handleAgentStatusChange);
      
      if (agentIds && agentIds.length > 0) {
        webSocketService.unsubscribeFromAgentUpdates(agentIds);
      }
    };
  }, [agentIds]);

  const updateAgentStatus = useCallback((agentId: string, status: 'online' | 'offline' | 'busy' | 'available') => {
    webSocketService.updateAgentStatus(agentId, status);
  }, []);

  return {
    agentStatuses: Array.from(agentStatuses.values()),
    getAgentStatus: (agentId: string) => agentStatuses.get(agentId),
    updateAgentStatus
  };
}

export function useSystemNotifications() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [performanceAlerts, setPerformanceAlerts] = useState<PerformanceAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleSystemNotification = (notification: SystemNotification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50 notifications
      setUnreadCount(prev => prev + 1);
    };

    const handlePerformanceAlert = (alert: PerformanceAlert) => {
      setPerformanceAlerts(prev => [alert, ...prev.slice(0, 19)]); // Keep last 20 alerts
      setUnreadCount(prev => prev + 1);
    };

    webSocketService.on('system:notification', handleSystemNotification);
    webSocketService.on('system:performance_alert', handlePerformanceAlert);

    // Subscribe to all notification types by default
    webSocketService.subscribeToNotifications(['alert', 'maintenance', 'update']);

    return () => {
      webSocketService.off('system:notification', handleSystemNotification);
      webSocketService.off('system:performance_alert', handlePerformanceAlert);
      webSocketService.unsubscribeFromNotifications(['alert', 'maintenance', 'update']);
    };
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    webSocketService.markNotificationAsRead(notificationId);
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setPerformanceAlerts([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    performanceAlerts,
    unreadCount,
    markAsRead,
    clearAll
  };
}

export function useLiveMetrics() {
  const [metrics, setMetrics] = useState<LiveCallMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<LiveCallMetrics[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const handleMetricsUpdate = (newMetrics: LiveCallMetrics) => {
      setMetrics(newMetrics);
      setMetricsHistory(prev => [newMetrics, ...prev.slice(0, 99)]); // Keep last 100 data points
    };

    webSocketService.on('metrics:live_update', handleMetricsUpdate);

    return () => {
      webSocketService.off('metrics:live_update', handleMetricsUpdate);
    };
  }, []);

  const subscribe = useCallback(() => {
    webSocketService.subscribeToLiveMetrics();
    setIsSubscribed(true);
  }, []);

  const unsubscribe = useCallback(() => {
    webSocketService.unsubscribeFromLiveMetrics();
    setIsSubscribed(false);
  }, []);

  return {
    metrics,
    metricsHistory,
    isSubscribed,
    subscribe,
    unsubscribe
  };
}

export function useMessageEvents() {
  const [messageEvents, setMessageEvents] = useState<any[]>([]);

  useEffect(() => {
    const handleMessageReceived = (data: any) => {
      setMessageEvents(prev => [{ type: 'received', ...data }, ...prev.slice(0, 99)]);
    };

    const handleMessageSent = (data: any) => {
      setMessageEvents(prev => [{ type: 'sent', ...data }, ...prev.slice(0, 99)]);
    };

    const handleMessageRead = (data: any) => {
      setMessageEvents(prev => [{ type: 'read', ...data }, ...prev.slice(0, 99)]);
    };

    webSocketService.on('message:received', handleMessageReceived);
    webSocketService.on('message:sent', handleMessageSent);
    webSocketService.on('message:read', handleMessageRead);

    return () => {
      webSocketService.off('message:received', handleMessageReceived);
      webSocketService.off('message:sent', handleMessageSent);
      webSocketService.off('message:read', handleMessageRead);
    };
  }, []);

  return {
    messageEvents
  };
}