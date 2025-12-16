import { PrismaClient, UsageEvent, UsageEventType } from '@prisma/client';
import { CostCalculatorService } from './cost-calculator.service';
export interface TrackUsageInput {
    billingAccountId: string;
    numberId: string;
    eventType: UsageEventType;
    duration?: number;
    quantity?: number;
    fromNumber?: string;
    toNumber?: string;
    metadata?: Record<string, any>;
    timestamp?: Date;
}
export interface UsageStatistics {
    totalEvents: number;
    totalCost: number;
    eventBreakdown: {
        [key in UsageEventType]?: {
            count: number;
            cost: number;
            duration?: number;
        };
    };
    period: {
        start: Date;
        end: Date;
    };
}
export declare class UsageTrackingService {
    private prisma;
    private costCalculator;
    constructor(prisma: PrismaClient, costCalculator: CostCalculatorService);
    /**
     * Track a usage event
     */
    trackUsage(input: TrackUsageInput): Promise<UsageEvent>;
    /**
     * Get usage statistics for a billing account
     */
    getUsageStatistics(billingAccountId: string, startDate: Date, endDate: Date, numberId?: string): Promise<UsageStatistics>;
    /**
     * Get uninvoiced usage events for a billing account
     */
    getUninvoicedUsage(billingAccountId: string, startDate: Date, endDate: Date): Promise<UsageEvent[]>;
    /**
     * Mark usage events as invoiced
     */
    markAsInvoiced(usageEventIds: string[], invoiceItemId: string): Promise<void>;
    /**
     * Get usage events by number
     */
    getUsageByNumber(numberId: string, startDate: Date, endDate: Date, limit?: number, offset?: number): Promise<{
        events: UsageEvent[];
        total: number;
    }>;
    /**
     * Get daily usage aggregation
     */
    getDailyUsageAggregation(billingAccountId: string, startDate: Date, endDate: Date): Promise<Array<{
        date: string;
        totalCost: number;
        eventCount: number;
    }>>;
    /**
     * Track monthly subscription for a number
     */
    trackMonthlySubscription(billingAccountId: string, numberId: string): Promise<UsageEvent>;
    /**
     * Track setup fee for a new number
     */
    trackSetupFee(billingAccountId: string, numberId: string): Promise<UsageEvent>;
}
