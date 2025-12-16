import { PrismaClient } from '@prisma/client';
import { Region, RegionalPricingConfig, VolumeDiscount, CostCalculationInput, CostCalculationResult } from '@voxlink/shared';
export declare class RegionalPricingService {
    private prisma;
    private pricingCache;
    private cacheExpiry;
    private readonly CACHE_TTL;
    constructor(prisma: PrismaClient);
    /**
     * Get regional pricing configuration for a region
     */
    getRegionalPricing(region: Region): Promise<RegionalPricingConfig | null>;
    /**
     * Get volume discounts for a region and usage type
     */
    getVolumeDiscounts(region: Region, usageType: string): Promise<VolumeDiscount[]>;
    /**
     * Calculate cost with regional pricing
     */
    calculateRegionalCost(input: CostCalculationInput): Promise<CostCalculationResult>;
    /**
     * Calculate cost for call-based events
     */
    private calculateCallCost;
    /**
     * Apply volume discounts based on user's usage
     */
    private applyVolumeDiscounts;
    /**
     * Get user's current month usage for discount calculation
     */
    private getCurrentMonthUsage;
    /**
     * Calculate tax based on regional configuration
     */
    calculateRegionalTax(subtotal: number, region: Region): Promise<{
        tax: number;
        breakdown?: {
            cgst?: number;
            sgst?: number;
            igst?: number;
        };
    }>;
    /**
     * Format amount based on regional currency
     */
    formatRegionalAmount(amountInSmallestUnit: number, region: Region): string;
    /**
     * Get pricing tiers for a region
     */
    getPricingTiers(region: Region): any;
    /**
     * Clear pricing cache (useful for testing or manual refresh)
     */
    clearCache(): void;
}
