export type UsageEventType = 'inbound_call' | 'outbound_call' | 'sms_received' | 'sms_sent' | 'voicemail_received' | 'call_forwarded';
export interface UsageRecord {
    id: string;
    numberId: string;
    eventType: UsageEventType;
    duration?: number;
    cost: number;
    timestamp: Date;
    fromNumber?: string;
    toNumber?: string;
    metadata: Record<string, any>;
    createdAt: Date;
}
export interface UsageMetrics {
    totalCalls: number;
    totalDuration: number;
    totalCost: number;
    inboundCalls: number;
    outboundCalls: number;
    smsCount: number;
    voicemailCount: number;
    period: {
        start: Date;
        end: Date;
    };
}
export interface CostAnalytics {
    currentPeriod: UsageMetrics;
    previousPeriod: UsageMetrics;
    trend: 'increasing' | 'decreasing' | 'stable';
    projectedMonthlyCost: number;
    recommendations: string[];
}
