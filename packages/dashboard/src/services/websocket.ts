import { io, Socket } from 'socket.io-client';

export interface CallEvent {
  type: 'incoming' | 'answered' | 'ended' | 'transferred';
  callId: string;
  agentId?: string;
  customerId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AgentStatusEvent {
  type: 'online' | 'offline' | 'busy' | 'available';
  agentId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SystemNotification {
  type: 'alert' | 'maintenance' | 'update';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PerformanceAlert {
  type: 'threshold_breach' | 'system_overload' | 'service_degradation';
  metric: string;
  currentValue: number;
  threshold: number;
  timestamp: Date;
  affectedServices: string[];
}

export interface LiveCallMetrics {
  activeCalls: number;
  queuedCalls: number;
  availableAgents: number;
  busyAgents: number;
  averageWaitTime: number;
  averageCallDuration: number;
  callsPerMinute: number;
  abandonRate: number;
  timestamp: Date;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor() {
    this.connect();
  }

  private connect(): void {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
    
    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection:established', { timestamp: new Date() });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('connection:lost', { reason, timestamp: new Date() });
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emit('connection:failed', { error, attempts: this.reconnectAttempts });
      }
    });

    // Call events
    this.socket.on('call:incoming', (data: CallEvent) => {
      this.emit('call:incoming', data);
    });

    this.socket.on('call:answered', (data: CallEvent) => {
      this.emit('call:answered', data);
    });

    this.socket.on('call:ended', (data: CallEvent) => {
      this.emit('call:ended', data);
    });

    this.socket.on('call:transferred', (data: CallEvent) => {
      this.emit('call:transferred', data);
    });

    // Agent status events
    this.socket.on('agent:status_change', (data: AgentStatusEvent) => {
      this.emit('agent:status_change', data);
    });

    // System notifications
    this.socket.on('system:notification', (data: SystemNotification) => {
      this.emit('system:notification', data);
    });

    this.socket.on('system:performance_alert', (data: PerformanceAlert) => {
      this.emit('system:performance_alert', data);
    });

    // Live metrics updates
    this.socket.on('metrics:live_update', (data: LiveCallMetrics) => {
      this.emit('metrics:live_update', data);
    });

    // Message events
    this.socket.on('message:received', (data: any) => {
      this.emit('message:received', data);
    });

    this.socket.on('message:sent', (data: any) => {
      this.emit('message:sent', data);
    });

    this.socket.on('message:read', (data: any) => {
      this.emit('message:read', data);
    });
  }

  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  public send(event: string, data: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected. Cannot send event:', event);
    }
  }

  // Call monitoring methods
  public joinCallMonitoring(callId: string): void {
    this.send('call:join_monitoring', { callId });
  }

  public leaveCallMonitoring(callId: string): void {
    this.send('call:leave_monitoring', { callId });
  }

  public whisperToAgent(callId: string, agentId: string, message: string): void {
    this.send('call:whisper', { callId, agentId, message });
  }

  public bargeIntoCall(callId: string, supervisorId: string): void {
    this.send('call:barge_in', { callId, supervisorId });
  }

  // Agent status methods
  public updateAgentStatus(agentId: string, status: 'online' | 'offline' | 'busy' | 'available'): void {
    this.send('agent:update_status', { agentId, status });
  }

  public subscribeToAgentUpdates(agentIds: string[]): void {
    this.send('agent:subscribe_updates', { agentIds });
  }

  public unsubscribeFromAgentUpdates(agentIds: string[]): void {
    this.send('agent:unsubscribe_updates', { agentIds });
  }

  // Metrics subscription methods
  public subscribeToLiveMetrics(): void {
    this.send('metrics:subscribe_live');
  }

  public unsubscribeFromLiveMetrics(): void {
    this.send('metrics:unsubscribe_live');
  }

  // Notification methods
  public subscribeToNotifications(types: string[]): void {
    this.send('notifications:subscribe', { types });
  }

  public unsubscribeFromNotifications(types: string[]): void {
    this.send('notifications:unsubscribe', { types });
  }

  public markNotificationAsRead(notificationId: string): void {
    this.send('notifications:mark_read', { notificationId });
  }

  // Connection management
  public isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  public reconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.connect();
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Health check
  public ping(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const startTime = Date.now();
      
      this.socket.emit('ping', startTime);
      
      const timeout = setTimeout(() => {
        reject(new Error('Ping timeout'));
      }, 5000);

      this.socket.once('pong', (timestamp: number) => {
        clearTimeout(timeout);
        const latency = Date.now() - timestamp;
        resolve(latency);
      });
    });
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;