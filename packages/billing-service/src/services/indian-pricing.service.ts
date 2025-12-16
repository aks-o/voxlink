import {
  IndianPricingTier,
  IndianVolumeDiscount,
  IndianPricingCalculation,
  IndianUsageMetrics,
  IndianGSTConfig,
  IndianPricingContext,
  INDIAN_PRICING_TIERS,
  INDIAN_VOLUME_DISCOUNTS,
  INDIAN_GST_CONFIG
} from '@voxlink/shared';
import { logger } from '../utils/logger';

export class IndianPricingService {
  private readonly cache = new Map<string, any>();
  private readonly CACHE_TTL = 300000; // 5 minutes

  /**
   * Calculate total cost for Indian user based on usage and tier
   */
  async calculateCost(context: IndianPricingContext): Promise<IndianPricingCalculation> {
    try {
      const { tier, usage, gstConfig } = context;

      // Calculate base monthly cost
      const baseCost = tier.monthlyBase;

      // Calculate usage costs
      const usageCost = this.calculateUsageCost(tier, usage);

      // Apply volume discounts
      const { discountAmount, appliedDiscounts } = this.calculateVolumeDiscounts(usage, usageCost);

      // Calculate GST
      const subtotal = baseCost + usageCost - discountAmount;
      const gstAmount = this.calculateGST(subtotal, gstConfig);

      // Total cost
      const totalCost = subtotal + gstAmount;

      const calculation: IndianPricingCalculation = {
        baseCost,
        usageCost,
        discountAmount,
        gstAmount,
        totalCost,
        breakdown: {
          monthlyBase: baseCost,
          callMinutes: this.calculateCallCost(tier, usage),
          smsCount: this.calculateSMSCost(tier, usage),
          voicemailCount: this.calculateVoicemailCost(tier, usage),
          volumeDiscount: discountAmount,
          gst: gstAmount
        }
      };

      logger.info('Indian pricing calculated', {
        userId: context.userId,
        tier: tier.name,
        totalCost: totalCost / 100, // Convert to rupees for logging
        appliedDiscounts: appliedDiscounts.length
      });

      return calculation;
    } catch (error) {
      logger.error('Error calculating Indian pricing', { error, context });
      throw new Error('Failed to calculate Indian pricing');
    }
  }

  /**
   * Calculate usage-based costs (calls, SMS, voicemail)
   */
  private calculateUsageCost(tier: IndianPricingTier, usage: IndianUsageMetrics): number {
    const callCost = this.calculateCallCost(tier, usage);
    const smsCost = this.calculateSMSCost(tier, usage);
    const voicemailCost = this.calculateVoicemailCost(tier, usage);

    return callCost + smsCost + voicemailCost;
  }

  /**
   * Calculate call costs with included minutes
   */
  private calculateCallCost(tier: IndianPricingTier, usage: IndianUsageMetrics): number {
    const totalMinutes = usage.outboundMinutes + usage.inboundMinutes;
    const billableMinutes = Math.max(0, totalMinutes - tier.includedMinutes);

    // Calculate outbound and inbound separately for accurate pricing
    const outboundBillable = Math.max(0, usage.outboundMinutes - Math.floor(tier.includedMinutes * 0.6));
    const inboundBillable = Math.max(0, usage.inboundMinutes - Math.floor(tier.includedMinutes * 0.4));

    const outboundCost = outboundBillable * tier.outboundCallPerMinute;
    const inboundCost = inboundBillable * tier.inboundCallPerMinute;

    return outboundCost + inboundCost;
  }

  /**
   * Calculate SMS costs with included messages
   */
  private calculateSMSCost(tier: IndianPricingTier, usage: IndianUsageMetrics): number {
    const totalSMS = usage.smsOutbound + usage.smsInbound;
    const billableSMS = Math.max(0, totalSMS - tier.includedSMS);

    // Calculate outbound and inbound separately
    const outboundBillable = Math.max(0, usage.smsOutbound - Math.floor(tier.includedSMS * 0.8));
    const inboundBillable = Math.max(0, usage.smsInbound - Math.floor(tier.includedSMS * 0.2));

    const outboundCost = outboundBillable * tier.smsOutbound;
    const inboundCost = inboundBillable * tier.smsInbound;

    return outboundCost + inboundCost;
  }

  /**
   * Calculate voicemail costs
   */
  private calculateVoicemailCost(tier: IndianPricingTier, usage: IndianUsageMetrics): number {
    return usage.voicemailMessages * tier.voicemailPerMessage;
  }

  /**
   * Calculate volume discounts based on usage
   */
  private calculateVolumeDiscounts(
    usage: IndianUsageMetrics,
    usageCost: number
  ): { discountAmount: number; appliedDiscounts: IndianVolumeDiscount[] } {
    const appliedDiscounts: IndianVolumeDiscount[] = [];
    let totalDiscountAmount = 0;

    // Check minutes-based discounts
    const totalMinutes = usage.outboundMinutes + usage.inboundMinutes;
    const minutesDiscount = this.findApplicableDiscount(totalMinutes, 'MINUTES');
    if (minutesDiscount) {
      const callCost = this.calculateCallCostForDiscount(usage);
      const discountAmount = Math.floor(callCost * (minutesDiscount.discountPercent / 100));
      totalDiscountAmount += discountAmount;
      appliedDiscounts.push(minutesDiscount);
    }

    // Check SMS-based discounts
    const totalSMS = usage.smsOutbound + usage.smsInbound;
    const smsDiscount = this.findApplicableDiscount(totalSMS, 'SMS');
    if (smsDiscount) {
      const smsCost = this.calculateSMSCostForDiscount(usage);
      const discountAmount = Math.floor(smsCost * (smsDiscount.discountPercent / 100));
      totalDiscountAmount += discountAmount;
      appliedDiscounts.push(smsDiscount);
    }

    // Check spend-based discounts
    const spendDiscount = this.findApplicableDiscount(usage.monthlySpend, 'MONTHLY_SPEND');
    if (spendDiscount) {
      const discountAmount = Math.floor(usageCost * (spendDiscount.discountPercent / 100));
      totalDiscountAmount += discountAmount;
      appliedDiscounts.push(spendDiscount);
    }

    return { discountAmount: totalDiscountAmount, appliedDiscounts };
  }

  /**
   * Find applicable discount for given usage and type
   */
  private findApplicableDiscount(usage: number, type: 'MINUTES' | 'SMS' | 'MONTHLY_SPEND'): IndianVolumeDiscount | null {
    const applicableDiscounts = INDIAN_VOLUME_DISCOUNTS
      .filter(discount => discount.usageType === type)
      .filter(discount => {
        if (discount.maxUsage) {
          return usage >= discount.minUsage && usage <= discount.maxUsage;
        }
        return usage >= discount.minUsage;
      })
      .sort((a, b) => b.discountPercent - a.discountPercent); // Highest discount first

    return applicableDiscounts[0] || null;
  }

  /**
   * Calculate call cost for discount calculation (without included minutes)
   */
  private calculateCallCostForDiscount(usage: IndianUsageMetrics): number {
    // Use average rates for discount calculation
    const avgOutboundRate = 50; // ₹0.50 in paise
    const avgInboundRate = 30; // ₹0.30 in paise

    return (usage.outboundMinutes * avgOutboundRate) + (usage.inboundMinutes * avgInboundRate);
  }

  /**
   * Calculate SMS cost for discount calculation (without included SMS)
   */
  private calculateSMSCostForDiscount(usage: IndianUsageMetrics): number {
    // Use average rates for discount calculation
    const avgOutboundRate = 20; // ₹0.20 in paise
    const avgInboundRate = 5; // ₹0.05 in paise

    return (usage.smsOutbound * avgOutboundRate) + (usage.smsInbound * avgInboundRate);
  }

  /**
   * Calculate GST based on Indian tax rules
   */
  private calculateGST(amount: number, gstConfig: IndianGSTConfig): number {
    if (gstConfig.isInterstate) {
      // Interstate: IGST only
      return Math.floor(amount * gstConfig.igstRate);
    } else {
      // Intrastate: CGST + SGST
      const cgst = Math.floor(amount * gstConfig.cgstRate);
      const sgst = Math.floor(amount * gstConfig.sgstRate);
      return cgst + sgst;
    }
  }

  /**
   * Get pricing tier by name
   */
  getPricingTier(tierName: string): IndianPricingTier | null {
    return INDIAN_PRICING_TIERS[tierName] || null;
  }

  /**
   * Get all available pricing tiers
   */
  getAllPricingTiers(): IndianPricingTier[] {
    return Object.values(INDIAN_PRICING_TIERS).filter(tier => tier.isActive);
  }

  /**
   * Get applicable volume discounts for usage
   */
  getApplicableDiscounts(usage: IndianUsageMetrics): IndianVolumeDiscount[] {
    const discounts: IndianVolumeDiscount[] = [];

    const totalMinutes = usage.outboundMinutes + usage.inboundMinutes;
    const minutesDiscount = this.findApplicableDiscount(totalMinutes, 'MINUTES');
    if (minutesDiscount) discounts.push(minutesDiscount);

    const totalSMS = usage.smsOutbound + usage.smsInbound;
    const smsDiscount = this.findApplicableDiscount(totalSMS, 'SMS');
    if (smsDiscount) discounts.push(smsDiscount);

    const spendDiscount = this.findApplicableDiscount(usage.monthlySpend, 'MONTHLY_SPEND');
    if (spendDiscount) discounts.push(spendDiscount);

    return discounts;
  }

  /**
   * Convert paise to rupees for display
   */
  static paiseToRupees(paise: number): number {
    return Math.round(paise) / 100;
  }

  /**
   * Convert rupees to paise for calculations
   */
  static rupeesToPaise(rupees: number): number {
    return Math.round(rupees * 100);
  }

  /**
   * Format amount in Indian currency format
   */
  static formatIndianCurrency(paise: number): string {
    const rupees = this.paiseToRupees(paise);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(rupees);
  }

  /**
   * Estimate monthly cost for a tier and expected usage
   */
  async estimateMonthlyCost(
    tierName: string,
    expectedUsage: Partial<IndianUsageMetrics>,
    userState?: string
  ): Promise<IndianPricingCalculation> {
    const tier = this.getPricingTier(tierName);
    if (!tier) {
      throw new Error(`Invalid pricing tier: ${tierName}`);
    }

    const usage: IndianUsageMetrics = {
      outboundMinutes: expectedUsage.outboundMinutes || 0,
      inboundMinutes: expectedUsage.inboundMinutes || 0,
      smsOutbound: expectedUsage.smsOutbound || 0,
      smsInbound: expectedUsage.smsInbound || 0,
      voicemailMessages: expectedUsage.voicemailMessages || 0,
      monthlySpend: expectedUsage.monthlySpend || 0
    };

    const gstConfig: IndianGSTConfig = {
      ...INDIAN_GST_CONFIG,
      isInterstate: this.isInterstateTransaction(userState)
    };

    const context: IndianPricingContext = {
      userId: 'estimate',
      tier,
      usage,
      gstConfig,
      appliedDiscounts: [],
      billingPeriod: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    };

    return this.calculateCost(context);
  }

  /**
   * Determine if transaction is interstate for GST calculation
   */
  private isInterstateTransaction(userState?: string): boolean {
    // Assuming VoxLink is registered in Karnataka
    const companyState = 'KA';
    return userState !== undefined && userState !== companyState;
  }
}
