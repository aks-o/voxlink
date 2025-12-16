export interface IndianPricingTier {
    id: string;
    name: 'STARTER' | 'BUSINESS' | 'ENTERPRISE';
    displayName: string;
    monthlyBase: number;
    setupFee: number;
    outboundCallPerMinute: number;
    inboundCallPerMinute: number;
    smsOutbound: number;
    smsInbound: number;
    voicemailPerMessage: number;
    includedMinutes: number;
    includedSMS: number;
    features: string[];
    isActive: boolean;
}
export interface IndianVolumeDiscount {
    id: string;
    tierName: string;
    minUsage: number;
    maxUsage?: number;
    discountPercent: number;
    usageType: 'MINUTES' | 'SMS' | 'MONTHLY_SPEND';
    description: string;
}
export interface IndianPricingCalculation {
    baseCost: number;
    usageCost: number;
    discountAmount: number;
    gstAmount: number;
    totalCost: number;
    breakdown: {
        monthlyBase: number;
        callMinutes: number;
        smsCount: number;
        voicemailCount: number;
        volumeDiscount: number;
        gst: number;
    };
}
export interface IndianUsageMetrics {
    outboundMinutes: number;
    inboundMinutes: number;
    smsOutbound: number;
    smsInbound: number;
    voicemailMessages: number;
    monthlySpend: number;
}
export interface IndianGSTConfig {
    rate: number;
    cgstRate: number;
    sgstRate: number;
    igstRate: number;
    hsnCode: string;
    isInterstate: boolean;
}
export interface IndianPricingContext {
    userId: string;
    tier: IndianPricingTier;
    usage: IndianUsageMetrics;
    gstConfig: IndianGSTConfig;
    appliedDiscounts: IndianVolumeDiscount[];
    billingPeriod: {
        startDate: Date;
        endDate: Date;
    };
}
export declare const INDIAN_PRICING_TIERS: Record<string, IndianPricingTier>;
export declare const INDIAN_VOLUME_DISCOUNTS: IndianVolumeDiscount[];
export declare const INDIAN_GST_CONFIG: IndianGSTConfig;
