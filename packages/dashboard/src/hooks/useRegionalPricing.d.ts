export interface PricingTier {
    id: string;
    name: string;
    description: string;
    monthlyPrice: number;
    currency: string;
    popular?: boolean;
    features: string[];
    rates: {
        outboundCallPerMinute: number;
        inboundCallPerMinute: number;
        smsOutbound: number;
        smsInbound: number;
    };
    includedAllowances: {
        minutes: number;
        sms: number;
    };
    setupFee: number;
}
export interface RegionInfo {
    detectedRegion: string;
    detectionMethod: string;
    currency: string;
    locale: string;
    timezone: string;
    supportedFeatures: {
        paymentMethods: string[];
        languages: string[];
        compliance: string[];
        support: string[];
    };
}
export interface CostCalculation {
    eventType: string;
    unitCost: number;
    totalCost: number;
    quantity: number;
    description: string;
    currency: string;
    formattedCost: string;
}
export declare const useRegionalPricing: () => {
    pricingTiers: PricingTier[];
    regionInfo: RegionInfo | null;
    loading: boolean;
    error: string | null;
    isIndiaRegion: boolean;
    calculateCost: (eventType: string, duration?: number, quantity?: number) => Promise<CostCalculation | null>;
    formatCurrency: (amount: number, currency?: string) => string;
    refetch: () => Promise<void>;
};
export default useRegionalPricing;
