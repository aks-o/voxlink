import { IndianPricingTier, IndianVolumeDiscount, IndianPricingCalculation, IndianUsageMetrics, IndianPricingContext } from '../../../shared/src/types/indian-pricing';
export declare class IndianPricingService {
    private readonly cache;
    private readonly CACHE_TTL;
    /**
     * Calculate total cost for Indian user based on usage and tier
     */
    calculateCost(context: IndianPricingContext): Promise<IndianPricingCalculation>;
    /**
     * Calculate usage-based costs (calls, SMS, voicemail)
     */
    private calculateUsageCost;
    /**
     * Calculate call costs with included minutes
     */
    private calculateCallCost;
    /**
     * Calculate SMS costs with included messages
     */
    private calculateSMSCost;
    /**
     * Calculate voicemail costs
     */
    private calculateVoicemailCost;
    /**
     * Calculate volume discounts based on usage
     */
    private calculateVolumeDiscounts;
    /**
     * Find applicable discount for given usage and type
     */
    private findApplicableDiscount;
    /**
     * Calculate call cost for discount calculation (without included minutes)
     */
    private calculateCallCostForDiscount;
    /**
     * Calculate SMS cost for discount calculation (without included SMS)
     */
    private calculateSMSCostForDiscount;
    /**
     * Calculate GST based on Indian tax rules
     */
    private calculateGST;
    /**
     * Get pricing tier by name
     */
    getPricingTier(tierName: string): IndianPricingTier | null;
    /**
     * Get all available pricing tiers
     */
    getAllPricingTiers(): IndianPricingTier[];
    /**
     * Get applicable volume discounts for usage
     */
    getApplicableDiscounts(usage: IndianUsageMetrics): IndianVolumeDiscount[];
    /**
     * Convert paise to rupees for display
     */
    static paiseToRupees(paise: number): number;
    /**
     * Convert rupees to paise for calculations
     */
    static rupeesToPaise(rupees: number): number;
    /**
     * Format amount in Indian currency format
     */
    static formatIndianCurrency(paise: number): string;
    /**
     * Estimate monthly cost for a tier and expected usage
     */
    estimateMonthlyCost(tierName: string, expectedUsage: Partial<IndianUsageMetrics>, userState?: string): Promise<IndianPricingCalculation>;
    /**
     * Determine if transaction is interstate for GST calculation
     */
    private isInterstateTransaction;
}
