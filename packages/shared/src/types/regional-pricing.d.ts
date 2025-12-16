export type Region = 'IN' | 'US' | 'EU' | 'GLOBAL';
export type Currency = 'INR' | 'USD' | 'EUR';
export type TaxType = 'GST' | 'VAT' | 'SALES_TAX';
export type UsageType = 'MINUTES' | 'SMS' | 'MONTHLY_SPEND';
export interface RegionalPricingConfig {
    region: Region;
    currency: Currency;
    pricing: {
        setupFee: number;
        monthlyBase: number;
        inboundCallPerMinute: number;
        outboundCallPerMinute: number;
        smsInbound: number;
        smsOutbound: number;
        voicemailPerMessage: number;
        callForwardingPerMinute: number;
    };
    taxes: {
        rate: number;
        type: TaxType;
        cgst?: number;
        sgst?: number;
        igst?: number;
    };
    effectiveFrom: Date;
    effectiveUntil?: Date;
}
export interface VolumeDiscount {
    id: string;
    region: Region;
    tierName: string;
    minUsage: number;
    maxUsage?: number;
    discountPercent: number;
    usageType: UsageType;
}
export interface PricingTier {
    name: string;
    region: Region;
    currency: Currency;
    monthlyBase: number;
    setupFee: number;
    rates: {
        outboundCallPerMinute: number;
        inboundCallPerMinute: number;
        smsOutbound: number;
        smsInbound: number;
        voicemailPerMessage: number;
        callForwardingPerMinute: number;
    };
    includedAllowances: {
        minutes: number;
        sms: number;
    };
    volumeDiscounts: VolumeDiscount[];
}
export interface RegionalPricing {
    id: string;
    region: Region;
    currency: Currency;
    pricingConfig: RegionalPricingConfig['pricing'];
    taxConfig: RegionalPricingConfig['taxes'];
    effectiveFrom: Date;
    effectiveUntil?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const INDIA_PRICING_TIERS: Record<string, PricingTier>;
export interface CostCalculationInput {
    eventType: string;
    duration?: number;
    quantity?: number;
    region: Region;
    userId?: string;
    metadata?: Record<string, any>;
}
export interface CostCalculationResult {
    unitCost: number;
    totalCost: number;
    quantity: number;
    description: string;
    currency: Currency;
    region: Region;
    appliedDiscounts?: {
        type: string;
        amount: number;
        percentage: number;
    }[];
}
