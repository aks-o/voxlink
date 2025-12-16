import { config } from '../config/config';
import { UsageEventType } from '@prisma/client';
import { RegionalPricingService } from './regional-pricing.service';
import { PrismaClient } from '@prisma/client';
import {
  Region,
  CostCalculationInput as RegionalCostInput,
  CostCalculationResult as RegionalCostResult
} from '@voxlink/shared';

export interface CostCalculationInput {
  eventType: UsageEventType;
  duration?: number; // in seconds
  quantity?: number;
  region?: Region;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface CostCalculationResult {
  unitCost: number; // in cents/paise
  totalCost: number; // in cents/paise
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

export class CostCalculatorService {
  private regionalPricingService?: RegionalPricingService;

  constructor(prisma?: PrismaClient) {
    if (prisma) {
      this.regionalPricingService = new RegionalPricingService(prisma);
    }
  }

  /**
   * Calculate cost for a usage event with regional pricing support
   */
  async calculateUsageCost(input: CostCalculationInput): Promise<CostCalculationResult> {
    // If region is specified and regional pricing service is available, use regional pricing
    if (input.region && this.regionalPricingService) {
      try {
        const regionalInput: RegionalCostInput = {
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
      } catch (error) {
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
  private calculateDefaultUsageCost(input: CostCalculationInput): CostCalculationResult {
    const { eventType, duration = 0, quantity = 1, metadata = {} } = input;

    switch (eventType) {
      case 'INBOUND_CALL':
        return this.calculateCallCost(duration, config.pricing.inboundCallPerMinute, 'Inbound call', 'USD', 'US');

      case 'OUTBOUND_CALL':
        return this.calculateCallCost(duration, config.pricing.outboundCallPerMinute, 'Outbound call', 'USD', 'US');

      case 'SMS_RECEIVED':
        return {
          unitCost: config.pricing.smsInbound,
          totalCost: config.pricing.smsInbound * quantity,
          quantity,
          description: 'SMS received',
          currency: 'USD',
          region: 'US' as Region,
        };

      case 'SMS_SENT':
        return {
          unitCost: config.pricing.smsOutbound,
          totalCost: config.pricing.smsOutbound * quantity,
          quantity,
          description: 'SMS sent',
          currency: 'USD',
          region: 'US' as Region,
        };

      case 'VOICEMAIL_RECEIVED':
        return {
          unitCost: config.pricing.voicemailPerMessage,
          totalCost: config.pricing.voicemailPerMessage * quantity,
          quantity,
          description: 'Voicemail received',
          currency: 'USD',
          region: 'US' as Region,
        };

      case 'CALL_FORWARDED':
        return this.calculateCallCost(duration, config.pricing.callForwardingPerMinute, 'Call forwarded', 'USD', 'US');

      case 'MONTHLY_SUBSCRIPTION':
        return {
          unitCost: config.pricing.monthlyBase,
          totalCost: config.pricing.monthlyBase * quantity,
          quantity,
          description: 'Monthly subscription',
          currency: 'USD',
          region: 'US' as Region,
        };

      case 'SETUP_FEE':
        return {
          unitCost: config.pricing.setupFee,
          totalCost: config.pricing.setupFee * quantity,
          quantity,
          description: 'Setup fee',
          currency: 'USD',
          region: 'US' as Region,
        };

      default:
        throw new Error(`Unknown usage event type: ${eventType}`);
    }
  }

  /**
   * Calculate cost for call-based events (charged per minute)
   */
  private calculateCallCost(
    durationSeconds: number,
    ratePerMinute: number,
    description: string,
    currency: string = 'USD',
    region: Region = 'US'
  ): CostCalculationResult {
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
  async calculateMonthlySubscription(numberId: string): Promise<CostCalculationResult> {
    return await this.calculateUsageCost({
      eventType: 'MONTHLY_SUBSCRIPTION',
      quantity: 1,
    });
  }

  /**
   * Calculate setup fee for a new number
   */
  async calculateSetupFee(numberId: string): Promise<CostCalculationResult> {
    return await this.calculateUsageCost({
      eventType: 'SETUP_FEE',
      quantity: 1,
    });
  }

  /**
   * Calculate tax amount based on subtotal
   */
  calculateTax(subtotal: number): number {
    return Math.round(subtotal * config.billing.taxRate);
  }

  /**
   * Calculate total with tax
   */
  calculateTotal(subtotal: number): number {
    const tax = this.calculateTax(subtotal);
    return subtotal + tax;
  }

  /**
   * Get pricing information for display
   */
  getPricingInfo() {
    return {
      setupFee: config.pricing.setupFee,
      monthlyBase: config.pricing.monthlyBase,
      inboundCallPerMinute: config.pricing.inboundCallPerMinute,
      outboundCallPerMinute: config.pricing.outboundCallPerMinute,
      smsInbound: config.pricing.smsInbound,
      smsOutbound: config.pricing.smsOutbound,
      voicemailPerMessage: config.pricing.voicemailPerMessage,
      callForwardingPerMinute: config.pricing.callForwardingPerMinute,
      taxRate: config.billing.taxRate,
      currency: config.billing.defaultCurrency,
    };
  }

  /**
   * Format amount in cents to currency string
   */
  formatAmount(amountInCents: number, currency = config.billing.defaultCurrency): string {
    const amount = amountInCents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }
}
