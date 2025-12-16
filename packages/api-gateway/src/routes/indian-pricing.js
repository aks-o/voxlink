"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const indian_pricing_service_1 = require("../../../billing-service/src/services/indian-pricing.service");
const indian_pricing_1 = require("../../../shared/src/types/indian-pricing");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const indianPricingService = new indian_pricing_service_1.IndianPricingService();
/**
 * GET /api/indian-pricing/tiers
 * Get all available Indian pricing tiers
 */
router.get('/tiers', async (req, res) => {
    try {
        const tiers = indianPricingService.getAllPricingTiers();
        res.json({
            success: true,
            data: tiers.map(tier => ({
                ...tier,
                monthlyBaseFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(tier.monthlyBase),
                outboundCallPerMinuteFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(tier.outboundCallPerMinute),
                inboundCallPerMinuteFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(tier.inboundCallPerMinute),
                smsOutboundFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(tier.smsOutbound),
                smsInboundFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(tier.smsInbound)
            }))
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching Indian pricing tiers', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pricing tiers'
        });
    }
});
/**
 * GET /api/indian-pricing/tiers/:tierName
 * Get specific Indian pricing tier
 */
router.get('/tiers/:tierName', async (req, res) => {
    try {
        const { tierName } = req.params;
        const tier = indianPricingService.getPricingTier(tierName.toUpperCase());
        if (!tier) {
            return res.status(404).json({
                success: false,
                error: 'Pricing tier not found'
            });
        }
        res.json({
            success: true,
            data: {
                ...tier,
                monthlyBaseFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(tier.monthlyBase),
                outboundCallPerMinuteFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(tier.outboundCallPerMinute),
                inboundCallPerMinuteFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(tier.inboundCallPerMinute),
                smsOutboundFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(tier.smsOutbound),
                smsInboundFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(tier.smsInbound)
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching Indian pricing tier', { error, tierName: req.params.tierName });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pricing tier'
        });
    }
});
/**
 * POST /api/indian-pricing/estimate
 * Estimate monthly cost for given usage and tier
 */
router.post('/estimate', async (req, res) => {
    try {
        const { tierName, expectedUsage, userState } = req.body;
        if (!tierName) {
            return res.status(400).json({
                success: false,
                error: 'Tier name is required'
            });
        }
        const calculation = await indianPricingService.estimateMonthlyCost(tierName.toUpperCase(), expectedUsage || {}, userState);
        res.json({
            success: true,
            data: {
                ...calculation,
                baseCostFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(calculation.baseCost),
                usageCostFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(calculation.usageCost),
                discountAmountFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(calculation.discountAmount),
                gstAmountFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(calculation.gstAmount),
                totalCostFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(calculation.totalCost),
                breakdown: {
                    ...calculation.breakdown,
                    monthlyBaseFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(calculation.breakdown.monthlyBase),
                    callMinutesFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(calculation.breakdown.callMinutes),
                    smsCountFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(calculation.breakdown.smsCount),
                    voicemailCountFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(calculation.breakdown.voicemailCount),
                    volumeDiscountFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(calculation.breakdown.volumeDiscount),
                    gstFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(calculation.breakdown.gst)
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error estimating Indian pricing', { error, body: req.body });
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to estimate pricing'
        });
    }
});
/**
 * POST /api/indian-pricing/calculate
 * Calculate actual cost for authenticated user
 */
router.post('/calculate', auth_1.auth, async (req, res) => {
    try {
        const { tierName, usage, userState } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
        }
        if (!tierName || !usage) {
            return res.status(400).json({
                success: false,
                error: 'Tier name and usage data are required'
            });
        }
        const tier = indianPricingService.getPricingTier(tierName.toUpperCase());
        if (!tier) {
            return res.status(404).json({
                success: false,
                error: 'Invalid pricing tier'
            });
        }
        const gstConfig = {
            ...indian_pricing_1.INDIAN_GST_CONFIG,
            isInterstate: userState && userState !== 'KA' // Assuming company is in Karnataka
        };
        const context = {
            userId,
            tier,
            usage: usage,
            gstConfig,
            appliedDiscounts: [],
            billingPeriod: {
                startDate: new Date(req.body.billingPeriod?.startDate || Date.now()),
                endDate: new Date(req.body.billingPeriod?.endDate || Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        };
        const calculation = await indianPricingService.calculateCost(context);
        res.json({
            success: true,
            data: {
                ...calculation,
                baseCostFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(calculation.baseCost),
                usageCostFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(calculation.usageCost),
                discountAmountFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(calculation.discountAmount),
                gstAmountFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(calculation.gstAmount),
                totalCostFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(calculation.totalCost),
                breakdown: {
                    ...calculation.breakdown,
                    monthlyBaseFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(calculation.breakdown.monthlyBase),
                    callMinutesFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(calculation.breakdown.callMinutes),
                    smsCountFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(calculation.breakdown.smsCount),
                    voicemailCountFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(calculation.breakdown.voicemailCount),
                    volumeDiscountFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(calculation.breakdown.volumeDiscount),
                    gstFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(calculation.breakdown.gst)
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error calculating Indian pricing', { error, userId: req.user?.id });
        res.status(500).json({
            success: false,
            error: 'Failed to calculate pricing'
        });
    }
});
/**
 * GET /api/indian-pricing/discounts
 * Get available volume discounts
 */
router.get('/discounts', async (req, res) => {
    try {
        const { usage } = req.query;
        if (usage) {
            // Get applicable discounts for specific usage
            const usageMetrics = JSON.parse(usage);
            const discounts = indianPricingService.getApplicableDiscounts(usageMetrics);
            res.json({
                success: true,
                data: discounts
            });
        }
        else {
            // Get all available discounts
            const { INDIAN_VOLUME_DISCOUNTS } = await Promise.resolve().then(() => __importStar(require('../../../shared/src/types/indian-pricing')));
            res.json({
                success: true,
                data: INDIAN_VOLUME_DISCOUNTS
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Error fetching Indian volume discounts', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch volume discounts'
        });
    }
});
/**
 * GET /api/indian-pricing/comparison
 * Compare pricing across different tiers for given usage
 */
router.get('/comparison', async (req, res) => {
    try {
        const { usage, userState } = req.query;
        const expectedUsage = usage ? JSON.parse(usage) : {
            outboundMinutes: 200,
            inboundMinutes: 100,
            smsOutbound: 100,
            smsInbound: 50,
            voicemailMessages: 5
        };
        const tiers = indianPricingService.getAllPricingTiers();
        const comparisons = await Promise.all(tiers.map(async (tier) => {
            const calculation = await indianPricingService.estimateMonthlyCost(tier.name, expectedUsage, userState);
            return {
                tier: {
                    ...tier,
                    monthlyBaseFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(tier.monthlyBase)
                },
                calculation: {
                    ...calculation,
                    totalCostFormatted: indian_pricing_service_1.IndianPricingService.formatIndianCurrency(calculation.totalCost),
                    savingsVsHigherTier: 0 // Will be calculated below
                }
            };
        }));
        // Calculate savings compared to higher tiers
        comparisons.sort((a, b) => a.calculation.totalCost - b.calculation.totalCost);
        for (let i = 0; i < comparisons.length - 1; i++) {
            const current = comparisons[i];
            const next = comparisons[i + 1];
            current.calculation.savingsVsHigherTier = next.calculation.totalCost - current.calculation.totalCost;
        }
        res.json({
            success: true,
            data: {
                usage: expectedUsage,
                comparisons
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error generating Indian pricing comparison', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to generate pricing comparison'
        });
    }
});
exports.default = router;
