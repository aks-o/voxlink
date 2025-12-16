"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageTrackingService = void 0;
const logger_1 = require("../utils/logger");
class UsageTrackingService {
    constructor(prisma, costCalculator) {
        this.prisma = prisma;
        this.costCalculator = costCalculator;
    }
    /**
     * Track a usage event
     */
    async trackUsage(input) {
        const { billingAccountId, numberId, eventType, duration = 0, quantity = 1, fromNumber, toNumber, metadata = {}, timestamp = new Date(), } = input;
        try {
            // Calculate cost for this usage event
            const costResult = this.costCalculator.calculateUsageCost({
                eventType,
                duration,
                quantity,
                metadata,
            });
            // Create usage event record
            const usageEvent = await this.prisma.usageEvent.create({
                data: {
                    billingAccountId,
                    numberId,
                    eventType,
                    duration,
                    quantity: costResult.quantity,
                    unitCost: costResult.unitCost,
                    totalCost: costResult.totalCost,
                    fromNumber,
                    toNumber,
                    timestamp,
                    metadata,
                },
            });
            logger_1.logger.info('Usage event tracked', {
                usageEventId: usageEvent.id,
                billingAccountId,
                numberId,
                eventType,
                cost: costResult.totalCost,
            });
            return usageEvent;
        }
        catch (error) {
            logger_1.logger.error('Failed to track usage event', {
                error: error instanceof Error ? error.message : 'Unknown error',
                billingAccountId,
                numberId,
                eventType,
            });
            throw error;
        }
    }
    /**
     * Get usage statistics for a billing account
     */
    async getUsageStatistics(billingAccountId, startDate, endDate, numberId) {
        const whereClause = {
            billingAccountId,
            timestamp: {
                gte: startDate,
                lte: endDate,
            },
        };
        if (numberId) {
            whereClause.numberId = numberId;
        }
        const events = await this.prisma.usageEvent.findMany({
            where: whereClause,
            orderBy: { timestamp: 'desc' },
        });
        const statistics = {
            totalEvents: events.length,
            totalCost: 0,
            eventBreakdown: {},
            period: { start: startDate, end: endDate },
        };
        // Calculate statistics
        events.forEach((event) => {
            statistics.totalCost += event.totalCost;
            if (!statistics.eventBreakdown[event.eventType]) {
                statistics.eventBreakdown[event.eventType] = {
                    count: 0,
                    cost: 0,
                    duration: 0,
                };
            }
            const breakdown = statistics.eventBreakdown[event.eventType];
            breakdown.count += 1;
            breakdown.cost += event.totalCost;
            if (event.duration) {
                breakdown.duration = (breakdown.duration || 0) + event.duration;
            }
        });
        return statistics;
    }
    /**
     * Get uninvoiced usage events for a billing account
     */
    async getUninvoicedUsage(billingAccountId, startDate, endDate) {
        return this.prisma.usageEvent.findMany({
            where: {
                billingAccountId,
                isInvoiced: false,
                timestamp: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { timestamp: 'asc' },
        });
    }
    /**
     * Mark usage events as invoiced
     */
    async markAsInvoiced(usageEventIds, invoiceItemId) {
        await this.prisma.usageEvent.updateMany({
            where: {
                id: { in: usageEventIds },
            },
            data: {
                isInvoiced: true,
                invoiceItemId,
            },
        });
        logger_1.logger.info('Usage events marked as invoiced', {
            count: usageEventIds.length,
            invoiceItemId,
        });
    }
    /**
     * Get usage events by number
     */
    async getUsageByNumber(numberId, startDate, endDate, limit = 100, offset = 0) {
        const [events, total] = await Promise.all([
            this.prisma.usageEvent.findMany({
                where: {
                    numberId,
                    timestamp: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                orderBy: { timestamp: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.usageEvent.count({
                where: {
                    numberId,
                    timestamp: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            }),
        ]);
        return { events, total };
    }
    /**
     * Get daily usage aggregation
     */
    async getDailyUsageAggregation(billingAccountId, startDate, endDate) {
        // This would be more efficient with raw SQL, but using Prisma for consistency
        const events = await this.prisma.usageEvent.findMany({
            where: {
                billingAccountId,
                timestamp: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                timestamp: true,
                totalCost: true,
            },
        });
        // Group by date
        const dailyAggregation = new Map();
        events.forEach((event) => {
            const dateKey = event.timestamp.toISOString().split('T')[0];
            const existing = dailyAggregation.get(dateKey) || { totalCost: 0, eventCount: 0 };
            existing.totalCost += event.totalCost;
            existing.eventCount += 1;
            dailyAggregation.set(dateKey, existing);
        });
        return Array.from(dailyAggregation.entries()).map(([date, stats]) => ({
            date,
            ...stats,
        })).sort((a, b) => a.date.localeCompare(b.date));
    }
    /**
     * Track monthly subscription for a number
     */
    async trackMonthlySubscription(billingAccountId, numberId) {
        return this.trackUsage({
            billingAccountId,
            numberId,
            eventType: 'MONTHLY_SUBSCRIPTION',
            quantity: 1,
            metadata: { type: 'monthly_subscription' },
        });
    }
    /**
     * Track setup fee for a new number
     */
    async trackSetupFee(billingAccountId, numberId) {
        return this.trackUsage({
            billingAccountId,
            numberId,
            eventType: 'SETUP_FEE',
            quantity: 1,
            metadata: { type: 'setup_fee' },
        });
    }
}
exports.UsageTrackingService = UsageTrackingService;
