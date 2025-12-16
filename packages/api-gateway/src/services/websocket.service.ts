import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../utils/logger';
import { RedisService } from './redis.service';

const redisService = new RedisService();

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
  private io: SocketIOServer | null = null;
  private connectedClients: Map<string, any> = new Map();
  private callMonitoringSubscriptions: Map<string, Set<string>> = new Map();
  private agentSubscriptions: Map<string, Set<string>> = new Map();
  private metricsSubscribers: Set<string> = new Set();
  private notificationSubscribers: Map<string, Set<string>> = new Map();

  public initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    this.startMetricsInterval();
    logger.info('WebSocket service initialized');
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);
      this.connectedClients.set(socket.id, {
        id: socket.id,
        connectedAt: new Date(),
        lastActivity: new Date()
      });

      // Handle ping/pong for latency measurement
      socket.on('ping', (timestamp: number) => {
        socket.emit('pong', timestamp);
      });

      // Call monitoring events
      socket.on('call:join_monitoring', (data: { callId: string }) => {
        this.addCallMonitoringSubscription(socket.id, data.callId);
        logger.info(`Client ${socket.id} joined monitoring for call ${data.callId}`);
      });

      socket.on('call:leave_monitoring', (data: { callId: string }) => {
        this.removeCallMonitoringSubscription(socket.id, data.callId);
        logger.info(`Client ${socket.id} left monitoring for call ${data.callId}`);
      });

      socket.on('call:whisper', (data: { callId: string; agentId: string; message: string }) => {
        // In a real implementation, this would send the whisper to the agent
        logger.info(`Whisper to agent ${data.agentId} on call ${data.callId}: ${data.message}`);
        // Emit to other supervisors monitoring this call
        this.emitToCallMonitors(data.callId, 'call:whisper_sent', {
          callId: data.callId,
          agentId: data.agentId,
          message: data.message,
          supervisorId: socket.id,
          timestamp: new Date()
        });
      });

      socket.on('call:barge_in', (data: { callId: string; supervisorId: string }) => {
        // In a real implementation, this would add the supervisor to the call
        logger.info(`Supervisor ${data.supervisorId} barged into call ${data.callId}`);
        this.emitToCallMonitors(data.callId, 'call:barge_in_started', {
          callId: data.callId,
          supervisorId: data.supervisorId,
          timestamp: new Date()
        });
      });

      // Agent status events
      socket.on('agent:update_status', (data: { agentId: string; status: string }) => {
        const statusEvent: AgentStatusEvent = {
          type: data.status as any,
          agentId: data.agentId,
          timestamp: new Date()
        };
        this.broadcastAgentStatus(statusEvent);
        logger.info(`Agent ${data.agentId} status updated to ${data.status}`);
      });

      socket.on('agent:subscribe_updates', (data: { agentIds: string[] }) => {
        data.agentIds.forEach(agentId => {
          this.addAgentSubscription(socket.id, agentId);
        });
        logger.info(`Client ${socket.id} subscribed to agent updates for ${data.agentIds.length} agents`);
      });

      socket.on('agent:unsubscribe_updates', (data: { agentIds: string[] }) => {
        data.agentIds.forEach(agentId => {
          this.removeAgentSubscription(socket.id, agentId);
        });
        logger.info(`Client ${socket.id} unsubscribed from agent updates`);
      });

      // Metrics subscription
      socket.on('metrics:subscribe_live', () => {
        this.metricsSubscribers.add(socket.id);
        logger.info(`Client ${socket.id} subscribed to live metrics`);
      });

      socket.on('metrics:unsubscribe_live', () => {
        this.metricsSubscribers.delete(socket.id);
        logger.info(`Client ${socket.id} unsubscribed from live metrics`);
      });

      // Notification subscription
      socket.on('notifications:subscribe', (data: { types: string[] }) => {
        data.types.forEach(type => {
          if (!this.notificationSubscribers.has(type)) {
            this.notificationSubscribers.set(type, new Set());
          }
          this.notificationSubscribers.get(type)!.add(socket.id);
        });
        logger.info(`Client ${socket.id} subscribed to notifications: ${data.types.join(', ')}`);
      });

      socket.on('notifications:unsubscribe', (data: { types: string[] }) => {
        data.types.forEach(type => {
          const subscribers = this.notificationSubscribers.get(type);
          if (subscribers) {
            subscribers.delete(socket.id);
          }
        });
        logger.info(`Client ${socket.id} unsubscribed from notifications`);
      });

      socket.on('notifications:mark_read', (data: { notificationId: string }) => {
        // In a real implementation, this would mark the notification as read in the database
        logger.info(`Notification ${data.notificationId} marked as read by ${socket.id}`);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
        this.cleanupClientSubscriptions(socket.id);
        this.connectedClients.delete(socket.id);
      });

      // Update last activity on any event
      socket.onAny(() => {
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.lastActivity = new Date();
        }
      });
    });
  }

  private addCallMonitoringSubscription(clientId: string, callId: string): void {
    if (!this.callMonitoringSubscriptions.has(callId)) {
      this.callMonitoringSubscriptions.set(callId, new Set());
    }
    this.callMonitoringSubscriptions.get(callId)!.add(clientId);
  }

  private removeCallMonitoringSubscription(clientId: string, callId: string): void {
    const subscribers = this.callMonitoringSubscriptions.get(callId);
    if (subscribers) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.callMonitoringSubscriptions.delete(callId);
      }
    }
  }

  private addAgentSubscription(clientId: string, agentId: string): void {
    if (!this.agentSubscriptions.has(agentId)) {
      this.agentSubscriptions.set(agentId, new Set());
    }
    this.agentSubscriptions.get(agentId)!.add(clientId);
  }

  private removeAgentSubscription(clientId: string, agentId: string): void {
    const subscribers = this.agentSubscriptions.get(agentId);
    if (subscribers) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.agentSubscriptions.delete(agentId);
      }
    }
  }

  private cleanupClientSubscriptions(clientId: string): void {
    // Remove from call monitoring subscriptions
    this.callMonitoringSubscriptions.forEach((subscribers, callId) => {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.callMonitoringSubscriptions.delete(callId);
      }
    });

    // Remove from agent subscriptions
    this.agentSubscriptions.forEach((subscribers, agentId) => {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.agentSubscriptions.delete(agentId);
      }
    });

    // Remove from metrics subscribers
    this.metricsSubscribers.delete(clientId);

    // Remove from notification subscribers
    this.notificationSubscribers.forEach((subscribers) => {
      subscribers.delete(clientId);
    });
  }

  private emitToCallMonitors(callId: string, event: string, data: any): void {
    const subscribers = this.callMonitoringSubscriptions.get(callId);
    if (subscribers && this.io) {
      subscribers.forEach(clientId => {
        this.io!.to(clientId).emit(event, data);
      });
    }
  }

  private startMetricsInterval(): void {
    // Send live metrics every 5 seconds
    setInterval(() => {
      if (this.metricsSubscribers.size > 0) {
        const metrics = this.generateMockMetrics();
        this.metricsSubscribers.forEach(clientId => {
          if (this.io) {
            this.io.to(clientId).emit('metrics:live_update', metrics);
          }
        });
      }
    }, 5000);

    // Send random system notifications
    setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance every 30 seconds
        this.sendRandomNotification();
      }
    }, 30000);

    // Send random call events
    setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance every 10 seconds
        this.sendRandomCallEvent();
      }
    }, 10000);
  }

  private generateMockMetrics(): LiveCallMetrics {
    return {
      activeCalls: Math.floor(Math.random() * 20) + 5,
      queuedCalls: Math.floor(Math.random() * 10),
      availableAgents: Math.floor(Math.random() * 15) + 5,
      busyAgents: Math.floor(Math.random() * 10) + 2,
      averageWaitTime: Math.floor(Math.random() * 120) + 30,
      averageCallDuration: Math.floor(Math.random() * 300) + 120,
      callsPerMinute: Math.floor(Math.random() * 10) + 2,
      abandonRate: Math.random() * 0.1,
      timestamp: new Date()
    };
  }

  private sendRandomNotification(): void {
    const notifications = [
      {
        type: 'alert' as const,
        severity: 'medium' as const,
        message: 'High call volume detected in the last 5 minutes'
      },
      {
        type: 'maintenance' as const,
        severity: 'low' as const,
        message: 'Scheduled maintenance window starting in 2 hours'
      },
      {
        type: 'update' as const,
        severity: 'low' as const,
        message: 'New feature: Enhanced call analytics now available'
      }
    ];

    const notification = notifications[Math.floor(Math.random() * notifications.length)];
    const systemNotification: SystemNotification = {
      ...notification,
      timestamp: new Date()
    };

    this.broadcastNotification(systemNotification);
  }

  private sendRandomCallEvent(): void {
    const events = ['incoming', 'answered', 'ended', 'transferred'] as const;
    const event = events[Math.floor(Math.random() * events.length)];

    const callEvent: CallEvent = {
      type: event,
      callId: `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId: event === 'answered' ? `agent-${Math.floor(Math.random() * 10) + 1}` : undefined,
      customerId: `customer-${Math.floor(Math.random() * 1000) + 1}`,
      timestamp: new Date(),
      metadata: {
        fromNumber: `+1555${Math.floor(Math.random() * 9000000) + 1000000}`,
        toNumber: `+1555${Math.floor(Math.random() * 9000000) + 1000000}`
      }
    };

    this.broadcastCallEvent(callEvent);
  }

  // Public methods for broadcasting events
  public broadcastCallEvent(event: CallEvent): void {
    if (this.io) {
      this.io.emit(`call:${event.type}`, event);
      logger.info(`Broadcasted call event: ${event.type} for call ${event.callId}`);
    }
  }

  public broadcastAgentStatus(event: AgentStatusEvent): void {
    if (this.io) {
      const subscribers = this.agentSubscriptions.get(event.agentId);
      if (subscribers) {
        subscribers.forEach(clientId => {
          this.io!.to(clientId).emit('agent:status_change', event);
        });
      }
      logger.info(`Broadcasted agent status: ${event.type} for agent ${event.agentId}`);
    }
  }

  public broadcastNotification(notification: SystemNotification): void {
    if (this.io) {
      const subscribers = this.notificationSubscribers.get(notification.type);
      if (subscribers) {
        subscribers.forEach(clientId => {
          this.io!.to(clientId).emit('system:notification', notification);
        });
      }
      logger.info(`Broadcasted notification: ${notification.type} - ${notification.message}`);
    }
  }

  public broadcastPerformanceAlert(alert: PerformanceAlert): void {
    if (this.io) {
      this.io.emit('system:performance_alert', alert);
      logger.info(`Broadcasted performance alert: ${alert.type} for metric ${alert.metric}`);
    }
  }

  public getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  public getSubscriptionStats(): any {
    return {
      connectedClients: this.connectedClients.size,
      callMonitoringSubscriptions: this.callMonitoringSubscriptions.size,
      agentSubscriptions: this.agentSubscriptions.size,
      metricsSubscribers: this.metricsSubscribers.size,
      notificationSubscribers: Array.from(this.notificationSubscribers.entries()).reduce((acc, [type, subscribers]) => {
        acc[type] = subscribers.size;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

export const webSocketService = new WebSocketService();