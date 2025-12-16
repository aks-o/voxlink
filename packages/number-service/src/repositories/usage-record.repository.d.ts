import { UsageRecord, UsageEventType } from '@prisma/client';
import { BaseRepository } from './base.repository';
export interface CreateUsageRecordData {
    numberId: string;
    eventType: UsageEventType;
    duration?: number;
    cost: number;
    fromNumber?: string;
    toNumber?: string;
    metadata?: Record<string, any>;
}
export interface UsageStatistics {
    totalCalls: number;
    totalSms: number;
    totalDuration: number;
    totalCost: number;
    inboundCalls: number;
    outboundCalls: number;
    smsReceived: number;
    smsSent: number;
    voicemailsReceived: number;
    callsForwarded: number;
    averageCallDuration: number;
    peakUsageHour: number;
    costBreakdown: {
        calls: number;
        sms: number;
        voicemail: number;
        forwarding: number;
    };
}
export interface UsageFilters {
    numberId?: string;
    eventType?: UsageEventType;
    startDate?: Date;
    endDate?: Date;
    fromNumber?: string;
    toNumber?: string;
}
export declare class UsageRecordRepository extends BaseRepository {
    create(data: CreateUsageRecordData): Promise<UsageRecord>;
    findById(id: string): Promise<UsageRecord | null>;
    findByNumberId(numberId: string, limit?: number, offset?: number, filters?: Partial<UsageFilters>): Promise<UsageRecord[]>;
    getUsageStatistics(numberId: string, startDate?: Date, endDate?: Date): Promise<UsageStatistics>;
    getUsageByDateRange(numberId: string, startDate: Date, endDate: Date, groupBy?: 'day' | 'week' | 'month'): Promise<Array<{
        date: string;
        count: number;
        cost: number;
        duration: number;
    }>>;
    countByNumberId(numberId: string, filters?: Partial<UsageFilters>): Promise<number>;
    deleteByNumberId(numberId: string): Promise<void>;
    getRecentActivity(numberId: string, limit?: number): Promise<UsageRecord[]>;
}
