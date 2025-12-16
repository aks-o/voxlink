import { UsageRecord, UsageEventType, Prisma } from '@prisma/client';
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

export class UsageRecordRepository extends BaseRepository {
  async create(data: CreateUsageRecordData): Promise<UsageRecord> {
    return this.executeWithErrorHandling(async () => {
      return await this.db.usageRecord.create({
        data: {
          ...data,
          timestamp: new Date(),
          metadata: data.metadata || {},
        },
      });
    }, 'create usage record');
  }

  async findById(id: string): Promise<UsageRecord | null> {
    return this.executeWithErrorHandling(async () => {
      return await this.db.usageRecord.findUnique({
        where: { id },
      });
    }, 'find usage record by id');
  }

  async findByNumberId(
    numberId: string,
    limit = 50,
    offset = 0,
    filters?: Partial<UsageFilters>
  ): Promise<UsageRecord[]> {
    return this.executeWithErrorHandling(async () => {
      const where: Prisma.UsageRecordWhereInput = {
        numberId,
      };

      if (filters?.eventType) {
        where.eventType = filters.eventType;
      }

      if (filters?.startDate || filters?.endDate) {
        where.timestamp = {};
        if (filters.startDate) {
          where.timestamp.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.timestamp.lte = filters.endDate;
        }
      }

      if (filters?.fromNumber) {
        where.fromNumber = filters.fromNumber;
      }

      if (filters?.toNumber) {
        where.toNumber = filters.toNumber;
      }

      return await this.db.usageRecord.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      });
    }, 'find usage records by number id');
  }

  async getUsageStatistics(
    numberId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<UsageStatistics> {
    return this.executeWithErrorHandling(async () => {
      const where: Prisma.UsageRecordWhereInput = {
        numberId,
      };

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) {
          where.timestamp.gte = startDate;
        }
        if (endDate) {
          where.timestamp.lte = endDate;
        }
      }

      // Get aggregated statistics
      const stats = await this.db.usageRecord.groupBy({
        by: ['eventType'],
        where,
        _count: {
          id: true,
        },
        _sum: {
          duration: true,
          cost: true,
        },
      });

      // Get hourly distribution for peak usage
      const hourlyStats = await this.db.usageRecord.groupBy({
        by: ['eventType'],
        where,
        _count: {
          id: true,
        },
      });

      // Calculate statistics
      let totalCalls = 0;
      let totalSms = 0;
      let totalDuration = 0;
      let totalCost = 0;
      let inboundCalls = 0;
      let outboundCalls = 0;
      let smsReceived = 0;
      let smsSent = 0;
      let voicemailsReceived = 0;
      let callsForwarded = 0;

      const costBreakdown = {
        calls: 0,
        sms: 0,
        voicemail: 0,
        forwarding: 0,
      };

      stats.forEach((stat) => {
        const count = stat._count.id;
        const duration = stat._sum.duration || 0;
        const cost = stat._sum.cost || 0;

        totalCost += cost;
        totalDuration += duration;

        switch (stat.eventType) {
          case 'inbound_call':
            inboundCalls += count;
            totalCalls += count;
            costBreakdown.calls += cost;
            break;
          case 'outbound_call':
            outboundCalls += count;
            totalCalls += count;
            costBreakdown.calls += cost;
            break;
          case 'sms_received':
            smsReceived += count;
            totalSms += count;
            costBreakdown.sms += cost;
            break;
          case 'sms_sent':
            smsSent += count;
            totalSms += count;
            costBreakdown.sms += cost;
            break;
          case 'voicemail_received':
            voicemailsReceived += count;
            costBreakdown.voicemail += cost;
            break;
          case 'call_forwarded':
            callsForwarded += count;
            costBreakdown.forwarding += cost;
            break;
        }
      });

      const averageCallDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

      // For now, set peak usage hour to 0 - would need more complex query for actual implementation
      const peakUsageHour = 0;

      return {
        totalCalls,
        totalSms,
        totalDuration,
        totalCost,
        inboundCalls,
        outboundCalls,
        smsReceived,
        smsSent,
        voicemailsReceived,
        callsForwarded,
        averageCallDuration,
        peakUsageHour,
        costBreakdown,
      };
    }, 'get usage statistics');
  }

  async getUsageByDateRange(
    numberId: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ date: string; count: number; cost: number; duration: number }>> {
    return this.executeWithErrorHandling(async () => {
      // This would require raw SQL for proper date grouping
      // For now, return a simplified version
      const records = await this.db.usageRecord.findMany({
        where: {
          numberId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { timestamp: 'asc' },
      });

      // Group by date (simplified - would use SQL DATE_TRUNC in production)
      const grouped = new Map<string, { count: number; cost: number; duration: number }>();

      records.forEach((record) => {
        const dateKey = record.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
        const existing = grouped.get(dateKey) || { count: 0, cost: 0, duration: 0 };
        
        existing.count += 1;
        existing.cost += record.cost;
        existing.duration += record.duration || 0;
        
        grouped.set(dateKey, existing);
      });

      return Array.from(grouped.entries()).map(([date, stats]) => ({
        date,
        ...stats,
      }));
    }, 'get usage by date range');
  }

  async countByNumberId(numberId: string, filters?: Partial<UsageFilters>): Promise<number> {
    return this.executeWithErrorHandling(async () => {
      const where: Prisma.UsageRecordWhereInput = {
        numberId,
      };

      if (filters?.eventType) {
        where.eventType = filters.eventType;
      }

      if (filters?.startDate || filters?.endDate) {
        where.timestamp = {};
        if (filters.startDate) {
          where.timestamp.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.timestamp.lte = filters.endDate;
        }
      }

      return await this.db.usageRecord.count({ where });
    }, 'count usage records by number id');
  }

  async deleteByNumberId(numberId: string): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      await this.db.usageRecord.deleteMany({
        where: { numberId },
      });
    }, 'delete usage records by number id');
  }

  async getRecentActivity(
    numberId: string,
    limit = 10
  ): Promise<UsageRecord[]> {
    return this.executeWithErrorHandling(async () => {
      return await this.db.usageRecord.findMany({
        where: { numberId },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
    }, 'get recent activity');
  }
}
