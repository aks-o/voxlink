"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostCalculatorService = void 0;
const config_1 = require("../config/config");
const regional_pricing_service_1 = require("./regional-pricing.service");
class CostCalculatorService {
    constructor(prisma) {
        if (prisma) {
            this.regionalPricingService = new regional_pricing_service_1.RegionalPricingService(prisma);
        }
    }
    /**
     * Calculate cost for a usage event with regional pricing support
     */
    async calculateUsageCost(input) {
        // If region is specified and regional pricing service is available, use regional pricing
        if (input.region && this.regionalPricingService) {
            try {
                const regionalInput = {
                    eventType: input.eventType,
                    duration: input.duration,
                    quantity: input.quantity,
                    region: input.region,
                    userId: input.userId,
                    metadata: input.metadata,
                };
                const regionalResult = await this.regionalPricingService.calculateRegionalCost(regionalInput);
                return {
                    unitCost: regionalResult.unitCost,
                    totalCost: regionalResult.totalCost,
                    quantity: regionalResult.quantity,
                    description: regionalResult.description,
                    currency: regionalResult.currency,
                    region: regionalResult.region,
                    appliedDiscounts: regionalResult.appliedDiscounts,
                };
            }
            catch (error) {
                console.warn('Regional pricing failed, falling back to default pricing:', error);
                // Fall back to default pricing
            }
        }
        // Default pricing logic (existing)
        return this.calculateDefaultUsageCost(input);
    }
    /**
     * Calculate cost using default (US) pricing
     */
    calculateDefaultUsageCost(input) {
        const { eventType, duration = 0, quantity = 1, metadata = {} } = input;
        switch (eventType) {
            case 'INBOUND_CALL':
                return this.calculateCallCost(duration, config_1.config.pricing.inboundCallPerMinute, 'Inbound call', 'USD', 'US');
            case 'OUTBOUND_CALL':
                return this.calculateCallCost(duration, config_1.config.pricing.outboundCallPerMinute, 'Outbound call', 'USD', 'US');
            case 'SMS_RECEIVED':
                return {
                    unitCost: config_1.config.pricing.smsInbound,
                    totalCost: config_1.config.pricing.smsInbound * quantity,
                    quantity,
                    description: 'SMS received',
                    currency: 'USD',
                    region: 'US',
                };
            case 'SMS_SENT':
                return {
                    unitCost: config_1.config.pricing.smsOutbound,
                    totalCost: config_1.config.pricing.smsOutbound * quantity,
                    quantity,
                    description: 'SMS sent',
                    currency: 'USD',
                    region: 'US',
                };
            case 'VOICEMAIL_RECEIVED':
                return {
                    unitCost: config_1.config.pricing.voicemailPerMessage,
                    totalCost: config_1.config.pricing.voicemailPerMessage * quantity,
                    quantity,
                    description: 'Voicemail received',
                    currency: 'USD',
                    region: 'US',
                };
            case 'CALL_FORWARDED':
                return this.calculateCallCost(duration, config_1.config.pricing.callForwardingPerMinute, 'Call forwarded', 'USD', 'US');
            case 'MONTHLY_SUBSCRIPTION':
                return {
                    unitCost: config_1.config.pricing.monthlyBase,
                    totalCost: config_1.config.pricing.monthlyBase * quantity,
                    quantity,
                    description: 'Monthly subscription',
                    currency: 'USD',
                    region: 'US',
                };
            case 'SETUP_FEE':
                return {
                    unitCost: config_1.config.pricing.setupFee,
                    totalCost: config_1.config.pricing.setupFee * quantity,
                    quantity,
                    description: 'Setup fee',
                    currency: 'USD',
                    region: 'US',
                };
            default:
                throw new Error(`Unknown usage event type: ${eventType}`);
        }
    }
    /**
     * Calculate cost for call-based events (charged per minute)
     */
    calculateCallCost(durationSeconds, ratePerMinute, description, currency = 'USD', region = 'US') {
        // Round up to the nearest minute for billing
        const minutes = Math.ceil(durationSeconds / 60);
        return {
            unitCost: ratePerMinute,
            totalCost: ratePerMinute * minutes,
            quantity: minutes,
            description: `${description} (${minutes} min)`,
            currency,
            region,
        };
    }
    /**
     * Calculate monthly subscription cost for a number
     */
    calculateMonthlySubscription(numberId) {
        return this.calculateUsageCost({
            eventType: 'MONTHLY_SUBSCRIPTION',
            quantity: 1,
        });
    }
    /**
     * Calculate setup fee for a new number
     */
    calculateSetupFee(numberId) {
        return this.calculateUsageCost({
            eventType: 'SETUP_FEE',
            quantity: 1,
        });
    }
    /**
     * Calculate tax amount based on subtotal
     */
    calculateTax(subtotal) {
        return Math.round(subtotal * config_1.config.billing.taxRate);
    }
    /**
     * Calculate total with tax
     */
    calculateTotal(subtotal) {
        const tax = this.calculateTax(subtotal);
        return subtotal + tax;
    }
    /**
     * Get pricing information for display
     */
    getPricingInfo() {
        return {
            setupFee: config_1.config.pricing.setupFee,
            monthlyBase: config_1.config.pricing.monthlyBase,
            inboundCallPerMinute: config_1.config.pricing.inboundCallPerMinute,
            outboundCallPerMinute: config_1.config.pricing.outboundCallPerMinute,
            smsInbound: config_1.config.pricing.smsInbound,
            smsOutbound: config_1.config.pricing.smsOutbound,
            voicemailPerMessage: config_1.config.pricing.voicemailPerMessage,
            callForwardingPerMinute: config_1.config.pricing.callForwardingPerMinute,
            taxRate: config_1.config.billing.taxRate,
            currency: config_1.config.billing.defaultCurrency,
        };
    }
    /**
     * Format amount in cents to currency string
     */
    formatAmount(amountInCents, currency = config_1.config.billing.defaultCurrency) {
        const amount = amountInCents / 100;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    }
}
exports.CostCalculatorService = CostCalculatorService;
