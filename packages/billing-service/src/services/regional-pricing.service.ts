import { PrismaClient } from '@prisma/client';
import {
  Region,
  Currency,
  RegionalPricingConfig,
  VolumeDiscount,
  CostCalculationInput,
  CostCalculationResult,
  INDIA_PRICING_TIERS
} from '@voxlink/shared';
import { logger } from '../utils/logger';

export class RegionalPricingService {
  private prisma: PrismaClient;
  private pricingCache: Map<string, RegionalPricingConfig> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get regional pricing configuration for a region
   */
  async getRegionalPricing(region: Region): Promise<RegionalPricingConfig | null> {
    const cacheKey = `pricing_${region}`;
    const now = Date.now();

    // Check cache first
    if (this.pricingCache.has(cacheKey) && this.cacheExpiry.get(cacheKey)! > now) {
      return this.pricingCache.get(cacheKey)!;
    }

    try {
      const pricing = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM regional_pricing 
        WHERE region = ${region} 
        AND effective_from <= NOW() 
        AND (effective_until IS NULL OR effective_until > NOW())
        ORDER BY effective_from DESC 
        LIMIT 1
      `;

      if (pricing.length === 0) {
        logger.warn(`No pricing configuration found for region: ${region}`);
        return null;
      }

      const config: RegionalPricingConfig = {
        region,
        currency: pricing[0].currency as Currency,
        pricing: pricing[0].pricing_config,
        taxes: pricing[0].tax_config,
        effectiveFrom: pricing[0].effective_from,
        effectiveUntil: pricing[0].effective_until,
      };

      // Cache the result
      this.pricingCache.set(cacheKey, config);
      this.cacheExpiry.set(cacheKey, now + this.CACHE_TTL);

      return config;
    } catch (error) {
      logger.error('Error fetching regional pricing:', error as any);
      throw new Error(`Failed to fetch pricing for region: ${region}`);
    }
  }

  /**
   * Get volume discounts for a region and usage type
   */
  async getVolumeDiscounts(region: Region, usageType: string): Promise<VolumeDiscount[]> {
    try {
      const discounts = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM volume_discounts 
        WHERE region = ${region} 
        AND usage_type = ${usageType}
        ORDER BY min_usage ASC
      `;

      return discounts.map(d => ({
        id: d.id,
        region: d.region as Region,
        tierName: d.tier_name,
        minUsage: d.min_usage,
        maxUsage: d.max_usage,
        discountPercent: parseFloat(d.discount_percent),
        usageType: d.usage_type,
      }));
    } catch (error) {
      logger.error('Error fetching volume discounts:', error as any);
      return [];
    }
  }

  /**
   * Calculate cost with regional pricing
   */
  async calculateRegionalCost(input: CostCalculationInput): Promise<CostCalculationResult> {
    const { eventType, duration = 0, quantity = 1, region, userId, metadata = {} } = input;

    // Get regional pricing
    const pricing = await this.getRegionalPricing(region);
    if (!pricing) {
      throw new Error(`No pricing configuration found for region: ${region}`);
    }

    let result: CostCalculationResult;

    switch (eventType) {
      case 'INBOUND_CALL':
        result = this.calculateCallCost(
          duration,
          pricing.pricing.inboundCallPerMinute,
          'Inbound call',
          pricing.currency,
          region
        );
        break;

      case 'OUTBOUND_CALL':
        result = this.calculateCallCost(
          duration,
          pricing.pricing.outboundCallPerMinute,
          'Outbound call',
          pricing.currency,
          region
        );
        break;

      case 'SMS_RECEIVED':
        result = {
          unitCost: pricing.pricing.smsInbound,
          totalCost: pricing.pricing.smsInbound * quantity,
          quantity,
          description: 'SMS received',
          currency: pricing.currency,
          region,
        };
        break;

      case 'SMS_SENT':
        result = {
          unitCost: pricing.pricing.smsOutbound,
          totalCost: pricing.pricing.smsOutbound * quantity,
          quantity,
          description: 'SMS sent',
          currency: pricing.currency,
          region,
        };
        break;

      case 'VOICEMAIL_RECEIVED':
        result = {
          unitCost: pricing.pricing.voicemailPerMessage,
          totalCost: pricing.pricing.voicemailPerMessage * quantity,
          quantity,
          description: 'Voicemail received',
          currency: pricing.currency,
          region,
        };
        break;

      case 'CALL_FORWARDED':
        result = this.calculateCallCost(
          duration,
          pricing.pricing.callForwardingPerMinute,
          'Call forwarded',
          pricing.currency,
          region
        );
        break;

      case 'MONTHLY_SUBSCRIPTION':
        result = {
          unitCost: pricing.pricing.monthlyBase,
          totalCost: pricing.pricing.monthlyBase * quantity,
          quantity,
          description: 'Monthly subscription',
          currency: pricing.currency,
          region,
        };
        break;

      case 'SETUP_FEE':
        result = {
          unitCost: pricing.pricing.setupFee,
          totalCost: pricing.pricing.setupFee * quantity,
          quantity,
          description: 'Setup fee',
          currency: pricing.currency,
          region,
        };
        break;

      default:
        throw new Error(`Unknown usage event type: ${eventType}`);
    }

    // Apply volume discounts if applicable
    if (userId && (eventType === 'OUTBOUND_CALL' || eventType === 'INBOUND_CALL')) {
      result = await this.applyVolumeDiscounts(result, region, 'MINUTES', userId);
    } else if (userId && (eventType === 'SMS_SENT' || eventType === 'SMS_RECEIVED')) {
      result = await this.applyVolumeDiscounts(result, region, 'SMS', userId);
    }

    return result;
  }

  /**
   * Calculate cost for call-based events
   */
  private calculateCallCost(
    durationSeconds: number,
    ratePerMinute: number,
    description: string,
    currency: Currency,
    region: Region
  ): CostCalculationResult {
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
   * Apply volume discounts based on user's usage
   */
  private async applyVolumeDiscounts(
    result: CostCalculationResult,
    region: Region,
    usageType: string,
    userId: string
  ): Promise<CostCalculationResult> {
    try {
      // Get user's current month usage
      const currentUsage = await this.getCurrentMonthUsage(userId, usageType);

      // Get applicable volume discounts
      const discounts = await this.getVolumeDiscounts(region, usageType);

      // Find the applicable discount tier
      const applicableDiscount = discounts.find(d =>
        currentUsage >= d.minUsage &&
        (!d.maxUsage || currentUsage <= d.maxUsage)
      );

      if (applicableDiscount && applicableDiscount.discountPercent > 0) {
        const discountAmount = Math.round(result.totalCost * (applicableDiscount.discountPercent / 100));

        return {
          ...result,
          totalCost: result.totalCost - discountAmount,
          appliedDiscounts: [{
            type: `Volume Discount - ${applicableDiscount.tierName}`,
            amount: discountAmount,
            percentage: applicableDiscount.discountPercent,
          }],
        };
      }

      return result;
    } catch (error) {
      logger.error('Error applying volume discounts:', error as any);
      return result; // Return original result if discount calculation fails
    }
  }

  /**
   * Get user's current month usage for discount calculation
   */
  private async getCurrentMonthUsage(userId: string, usageType: string): Promise<number> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);

      let eventTypes: string[] = [];
      if (usageType === 'MINUTES') {
        eventTypes = ['INBOUND_CALL', 'OUTBOUND_CALL'];
      } else if (usageType === 'SMS') {
        eventTypes = ['SMS_SENT', 'SMS_RECEIVED'];
      }

      const usage = await this.prisma.$queryRaw<any[]>`
        SELECT COALESCE(SUM(quantity), 0) as total_usage
        FROM usage_records 
        WHERE user_id = ${userId}
        AND event_type = ANY(${eventTypes})
        AND created_at >= ${startOfMonth}
        AND created_at < ${endOfMonth}
      `;

      return parseInt(usage[0]?.total_usage || '0');
    } catch (error) {
      logger.error('Error fetching current month usage:', error as any);
      return 0;
    }
  }

  /**
   * Calculate tax based on regional configuration
   */
  async calculateRegionalTax(subtotal: number, region: Region): Promise<{
    tax: number;
    breakdown?: { cgst?: number; sgst?: number; igst?: number };
  }> {
    const pricing = await this.getRegionalPricing(region);
    if (!pricing) {
      throw new Error(`No pricing configuration found for region: ${region}`);
    }

    const tax = Math.round(subtotal * pricing.taxes.rate);

    // For India, provide GST breakdown
    if (region === 'IN' && pricing.taxes.type === 'GST') {
      return {
        tax,
        breakdown: {
          cgst: pricing.taxes.cgst ? Math.round(subtotal * pricing.taxes.cgst) : undefined,
          sgst: pricing.taxes.sgst ? Math.round(subtotal * pricing.taxes.sgst) : undefined,
          igst: pricing.taxes.igst ? Math.round(subtotal * pricing.taxes.igst) : undefined,
        },
      };
    }

    return { tax };
  }

  /**
   * Format amount based on regional currency
   */
  formatRegionalAmount(amountInSmallestUnit: number, region: Region): string {
    const pricing = this.pricingCache.get(`pricing_${region}`);
    const currency = pricing?.currency || 'USD';

    let amount: number;
    let locale: string;

    switch (currency) {
      case 'INR':
        amount = amountInSmallestUnit / 100; // Convert paise to rupees
        locale = 'en-IN';
        break;
      case 'USD':
        amount = amountInSmallestUnit / 100; // Convert cents to dollars
        locale = 'en-US';
        break;
      case 'EUR':
        amount = amountInSmallestUnit / 100; // Convert cents to euros
        locale = 'en-EU';
        break;
      default:
        amount = amountInSmallestUnit / 100;
        locale = 'en-US';
    }

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  }

  /**
   * Get pricing tiers for a region
   */
  getPricingTiers(region: Region) {
    if (region === 'IN') {
      return INDIA_PRICING_TIERS;
    }

    // Return default US pricing for other regions
    return {
      STANDARD: {
        name: 'Standard',
        region: 'US' as Region,
        currency: 'USD' as Currency,
        monthlyBase: 1000,
        setupFee: 500,
        rates: {
          outboundCallPerMinute: 3,
          inboundCallPerMinute: 2,
          smsOutbound: 2,
          smsInbound: 1,
          voicemailPerMessage: 5,
          callForwardingPerMinute: 1,
        },
        includedAllowances: {
          minutes: 0,
          sms: 0,
        },
        volumeDiscounts: [],
      },
    };
  }

  /**
   * Clear pricing cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.pricingCache.clear();
    this.cacheExpiry.clear();
  }
}
