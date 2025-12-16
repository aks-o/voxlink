import { UsageEventType } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { Region } from '@voxlink/shared';
export interface CostCalculationInput {
    eventType: UsageEventType;
    duration?: number;
    quantity?: number;
    region?: Region;
    userId?: string;
    metadata?: Record<string, any>;
}
export interface CostCalculationResult {
    unitCost: number;
    totalCost: number;
    quantity: number;
    description: string;
    currency?: string;
    region?: Region;
    appliedDiscounts?: {
        type: string;
        amount: number;
        percentage: number;
    }[];
}
export declare class CostCalculatorService {
    private regionalPricingService;
    constructor(prisma?: PrismaClient);
    /**
     * Calculate cost for a usage event with regional pricing support
     */
    calculateUsageCost(input: CostCalculationInput): Promise<CostCalculationResult>;
    /**
     * Calculate cost using default (US) pricing
     */
    private calculateDefaultUsageCost;
    /**
     * Calculate cost for call-based events (charged per minute)
     */
    private calculateCallCost;
    /**
     * Calculate monthly subscription cost for a number
     */
    calculateMonthlySubscription(numberId: string): CostCalculationResult;
    /**
     * Calculate setup fee for a new number
     */
    calculateSetupFee(numberId: string): CostCalculationResult;
    /**
     * Calculate tax amount based on subtotal
     */
    calculateTax(subtotal: number): number;
    /**
     * Calculate total with tax
     */
    calculateTotal(subtotal: number): number;
    /**
     * Get pricing information for display
     */
    getPricingInfo(): {
        setupFee: number;
        monthlyBase: number;
        inboundCallPerMinute: number;
        outboundCallPerMinute: number;
        smsInbound: number;
        smsOutbound: number;
        voicemailPerMessage: number;
        callForwardingPerMinute: number;
        taxRate: number;
        currency: string;
    };
    /**
     * Format amount in cents to currency string
     */
    formatAmount(amountInCents: number, currency?: string): string;
}
