/**
 * Cost calculation utilities for VoxLink
 */
import { UsageEventType } from '../types/usage-record';
export interface RateCard {
    inboundCall: number;
    outboundCall: number;
    smsReceived: number;
    smsSent: number;
    voicemailReceived: number;
    callForwarded: number;
}
export interface CountryRates {
    [countryCode: string]: RateCard;
}
export declare const DEFAULT_RATES: RateCard;
export declare const COUNTRY_RATES: CountryRates;
/**
 * Calculate cost for a usage event
 */
export declare function calculateUsageCost(eventType: UsageEventType, duration?: number, countryCode?: string): number;
/**
 * Calculate monthly cost projection based on usage patterns
 */
export declare function calculateMonthlyProjection(dailyUsage: {
    eventType: UsageEventType;
    duration?: number;
    count: number;
}[], countryCode?: string): number;
/**
 * Format cost in cents to currency string
 */
export declare function formatCost(cents: number, currency?: string): string;
/**
 * Calculate cost savings compared to traditional phone systems
 */
export declare function calculateSavings(monthlyVoxLinkCost: number, traditionalSystemCost: number): {
    monthlySavings: number;
    annualSavings: number;
    savingsPercentage: number;
};
/**
 * Get cost optimization recommendations
 */
export declare function getCostOptimizationRecommendations(monthlyUsage: {
    eventType: UsageEventType;
    duration?: number;
    count: number;
    cost: number;
}[], monthlyBudget?: number): string[];
