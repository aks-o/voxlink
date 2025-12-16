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
    private socket;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    private isConnected;
    private eventListeners;
    constructor();
    private connect;
    private setupEventHandlers;
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
    private emit;
    send(event: string, data: any): void;
    joinCallMonitoring(callId: string): void;
    leaveCallMonitoring(callId: string): void;
    whisperToAgent(callId: string, agentId: string, message: string): void;
    bargeIntoCall(callId: string, supervisorId: string): void;
    updateAgentStatus(agentId: string, status: 'online' | 'offline' | 'busy' | 'available'): void;
    subscribeToAgentUpdates(agentIds: string[]): void;
    unsubscribeFromAgentUpdates(agentIds: string[]): void;
    subscribeToLiveMetrics(): void;
    unsubscribeFromLiveMetrics(): void;
    subscribeToNotifications(types: string[]): void;
    unsubscribeFromNotifications(types: string[]): void;
    markNotificationAsRead(notificationId: string): void;
    isSocketConnected(): boolean;
    reconnect(): void;
    disconnect(): void;
    ping(): Promise<number>;
}
declare const webSocketService: WebSocketService;
export default webSocketService;
