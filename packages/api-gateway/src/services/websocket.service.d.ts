import { Server as HTTPServer } from 'http';
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
declare class WebSocketService {
    private io;
    private connectedClients;
    private callMonitoringSubscriptions;
    private agentSubscriptions;
    private metricsSubscribers;
    private notificationSubscribers;
    initialize(server: HTTPServer): void;
    private setupEventHandlers;
    private addCallMonitoringSubscription;
    private removeCallMonitoringSubscription;
    private addAgentSubscription;
    private removeAgentSubscription;
    private cleanupClientSubscriptions;
    private emitToCallMonitors;
    private startMetricsInterval;
    private generateMockMetrics;
    private sendRandomNotification;
    private sendRandomCallEvent;
    broadcastCallEvent(event: CallEvent): void;
    broadcastAgentStatus(event: AgentStatusEvent): void;
    broadcastNotification(notification: SystemNotification): void;
    broadcastPerformanceAlert(alert: PerformanceAlert): void;
    getConnectedClientsCount(): number;
    getSubscriptionStats(): any;
}
export declare const webSocketService: WebSocketService;
export {};
