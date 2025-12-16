"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageRecordRepository = void 0;
const base_repository_1 = require("./base.repository");
class UsageRecordRepository extends base_repository_1.BaseRepository {
    async create(data) {
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
    async findById(id) {
        return this.executeWithErrorHandling(async () => {
            return await this.db.usageRecord.findUnique({
                where: { id },
            });
        }, 'find usage record by id');
    }
    async findByNumberId(numberId, limit = 50, offset = 0, filters) {
        return this.executeWithErrorHandling(async () => {
            const where = {
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
    async getUsageStatistics(numberId, startDate, endDate) {
        return this.executeWithErrorHandling(async () => {
            const where = {
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
                    case 'INBOUND_CALL':
                        inboundCalls += count;
                        totalCalls += count;
                        costBreakdown.calls += cost;
                        break;
                    case 'OUTBOUND_CALL':
                        outboundCalls += count;
                        totalCalls += count;
                        costBreakdown.calls += cost;
                        break;
                    case 'SMS_RECEIVED':
                        smsReceived += count;
                        totalSms += count;
                        costBreakdown.sms += cost;
                        break;
                    case 'SMS_SENT':
                        smsSent += count;
                        totalSms += count;
                        costBreakdown.sms += cost;
                        break;
                    case 'VOICEMAIL_RECEIVED':
                        voicemailsReceived += count;
                        costBreakdown.voicemail += cost;
                        break;
                    case 'CALL_FORWARDED':
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
    async getUsageByDateRange(numberId, startDate, endDate, groupBy = 'day') {
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
            const grouped = new Map();
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
    async countByNumberId(numberId, filters) {
        return this.executeWithErrorHandling(async () => {
            const where = {
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
    async deleteByNumberId(numberId) {
        return this.executeWithErrorHandling(async () => {
            await this.db.usageRecord.deleteMany({
                where: { numberId },
            });
        }, 'delete usage records by number id');
    }
    async getRecentActivity(numberId, limit = 10) {
        return this.executeWithErrorHandling(async () => {
            return await this.db.usageRecord.findMany({
                where: { numberId },
                orderBy: { timestamp: 'desc' },
                take: limit,
            });
        }, 'get recent activity');
    }
}
exports.UsageRecordRepository = UsageRecordRepository;
