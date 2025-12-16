// Mock the logger to avoid dependency issues
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

import { IndianPricingService } from '../indian-pricing.service';
import { 
  IndianPricingContext, 
  IndianUsageMetrics, 
  INDIAN_PRICING_TIERS,
  INDIAN_GST_CONFIG 
} from '../../../../shared/src/types/indian-pricing';

describe('IndianPricingService', () => {
  let service: IndianPricingService;

  beforeEach(() => {
    service = new IndianPricingService();
  });

  describe('calculateCost', () => {
    it('should calculate cost for starter tier with basic usage', async () => {
      const usage: IndianUsageMetrics = {
        outboundMinutes: 50,
        inboundMinutes: 30,
        smsOutbound: 20,
        smsInbound: 10,
        voicemailMessages: 2,
        monthlySpend: 0
      };

      const context: IndianPricingContext = {
        userId: 'test-user',
        tier: INDIAN_PRICING_TIERS.STARTER,
        usage,
        gstConfig: INDIAN_GST_CONFIG,
        appliedDiscounts: [],
        billingPeriod: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        }
      };

      const result = await service.calculateCost(context);

      expect(result.baseCost).toBe(19900); // ₹199
      expect(result.totalCost).toBeGreaterThan(result.baseCost);
      expect(result.gstAmount).toBeGreaterThan(0);
      expect(result.breakdown.monthlyBase).toBe(19900);
    });

    it('should apply volume discounts for high usage', async () => {
      const usage: IndianUsageMetrics = {
        outboundMinutes: 800,
        inboundMinutes: 400,
        smsOutbound: 600,
        smsInbound: 200,
        voicemailMessages: 5,
        monthlySpend: 0
      };

      const context: IndianPricingContext = {
        userId: 'test-user',
        tier: INDIAN_PRICING_TIERS.BUSINESS,
        usage,
        gstConfig: INDIAN_GST_CONFIG,
        appliedDiscounts: [],
        billingPeriod: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        }
      };

      const result = await service.calculateCost(context);

      expect(result.discountAmount).toBeGreaterThan(0);
      expect(result.breakdown.volumeDiscount).toBeGreaterThan(0);
    });

    it('should calculate interstate GST correctly', async () => {
      const usage: IndianUsageMetrics = {
        outboundMinutes: 100,
        inboundMinutes: 50,
        smsOutbound: 50,
        smsInbound: 25,
        voicemailMessages: 1,
        monthlySpend: 0
      };

      const interstateGST = { ...INDIAN_GST_CONFIG, isInterstate: true };
      const context: IndianPricingContext = {
        userId: 'test-user',
        tier: INDIAN_PRICING_TIERS.STARTER,
        usage,
        gstConfig: interstateGST,
        appliedDiscounts: [],
        billingPeriod: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        }
      };

      const result = await service.calculateCost(context);

      // Interstate should use IGST (18%)
      const expectedGST = Math.floor((result.baseCost + result.usageCost - result.discountAmount) * 0.18);
      expect(result.gstAmount).toBe(expectedGST);
    });
  });

  describe('getPricingTier', () => {
    it('should return correct pricing tier', () => {
      const tier = service.getPricingTier('STARTER');
      expect(tier).toBeDefined();
      expect(tier?.name).toBe('STARTER');
      expect(tier?.monthlyBase).toBe(19900);
    });

    it('should return null for invalid tier', () => {
      const tier = service.getPricingTier('INVALID');
      expect(tier).toBeNull();
    });
  });

  describe('getAllPricingTiers', () => {
    it('should return all active pricing tiers', () => {
      const tiers = service.getAllPricingTiers();
      expect(tiers).toHaveLength(3);
      expect(tiers.every(tier => tier.isActive)).toBe(true);
    });
  });

  describe('getApplicableDiscounts', () => {
    it('should return minutes discount for high usage', () => {
      const usage: IndianUsageMetrics = {
        outboundMinutes: 800,
        inboundMinutes: 400,
        smsOutbound: 100,
        smsInbound: 50,
        voicemailMessages: 2,
        monthlySpend: 0
      };

      const discounts = service.getApplicableDiscounts(usage);
      const minutesDiscount = discounts.find(d => d.usageType === 'MINUTES');
      
      expect(minutesDiscount).toBeDefined();
      expect(minutesDiscount?.discountPercent).toBe(15); // First tier discount
    });

    it('should return SMS discount for high SMS usage', () => {
      const usage: IndianUsageMetrics = {
        outboundMinutes: 100,
        inboundMinutes: 50,
        smsOutbound: 800,
        smsInbound: 400,
        voicemailMessages: 1,
        monthlySpend: 0
      };

      const discounts = service.getApplicableDiscounts(usage);
      const smsDiscount = discounts.find(d => d.usageType === 'SMS');
      
      expect(smsDiscount).toBeDefined();
      expect(smsDiscount?.discountPercent).toBe(20); // First tier SMS discount
    });

    it('should return spend-based discount for high monthly spend', () => {
      const usage: IndianUsageMetrics = {
        outboundMinutes: 200,
        inboundMinutes: 100,
        smsOutbound: 100,
        smsInbound: 50,
        voicemailMessages: 2,
        monthlySpend: 600000 // ₹6000 in paise
      };

      const discounts = service.getApplicableDiscounts(usage);
      const spendDiscount = discounts.find(d => d.usageType === 'MONTHLY_SPEND');
      
      expect(spendDiscount).toBeDefined();
      expect(spendDiscount?.discountPercent).toBe(10); // First tier spend discount
    });
  });

  describe('estimateMonthlyCost', () => {
    it('should estimate cost for starter tier', async () => {
      const expectedUsage = {
        outboundMinutes: 150,
        inboundMinutes: 100,
        smsOutbound: 75,
        smsInbound: 25,
        voicemailMessages: 3
      };

      const result = await service.estimateMonthlyCost('STARTER', expectedUsage);

      expect(result.baseCost).toBe(19900); // ₹199
      expect(result.totalCost).toBeGreaterThan(result.baseCost);
      expect(result.gstAmount).toBeGreaterThan(0);
    });

    it('should handle interstate GST in estimation', async () => {
      const expectedUsage = {
        outboundMinutes: 100,
        inboundMinutes: 50,
        smsOutbound: 50,
        smsInbound: 25
      };

      const result = await service.estimateMonthlyCost('BUSINESS', expectedUsage, 'MH'); // Maharashtra

      expect(result.gstAmount).toBeGreaterThan(0);
      // Should use IGST for interstate transaction
    });

    it('should throw error for invalid tier', async () => {
      await expect(
        service.estimateMonthlyCost('INVALID', {})
      ).rejects.toThrow('Invalid pricing tier: INVALID');
    });
  });

  describe('utility methods', () => {
    it('should convert paise to rupees correctly', () => {
      expect(IndianPricingService.paiseToRupees(19900)).toBe(199);
      expect(IndianPricingService.paiseToRupees(12345)).toBe(123.45);
    });

    it('should convert rupees to paise correctly', () => {
      expect(IndianPricingService.rupeesToPaise(199)).toBe(19900);
      expect(IndianPricingService.rupeesToPaise(123.45)).toBe(12345);
    });

    it('should format Indian currency correctly', () => {
      const formatted = IndianPricingService.formatIndianCurrency(19900);
      expect(formatted).toContain('₹');
      expect(formatted).toContain('199');
    });
  });

  describe('edge cases', () => {
    it('should handle zero usage', async () => {
      const usage: IndianUsageMetrics = {
        outboundMinutes: 0,
        inboundMinutes: 0,
        smsOutbound: 0,
        smsInbound: 0,
        voicemailMessages: 0,
        monthlySpend: 0
      };

      const context: IndianPricingContext = {
        userId: 'test-user',
        tier: INDIAN_PRICING_TIERS.STARTER,
        usage,
        gstConfig: INDIAN_GST_CONFIG,
        appliedDiscounts: [],
        billingPeriod: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        }
      };

      const result = await service.calculateCost(context);

      expect(result.baseCost).toBe(19900);
      expect(result.usageCost).toBe(0);
      expect(result.discountAmount).toBe(0);
    });

    it('should handle usage within included limits', async () => {
      const usage: IndianUsageMetrics = {
        outboundMinutes: 60, // Within 100 included minutes
        inboundMinutes: 30,
        smsOutbound: 30, // Within 50 included SMS
        smsInbound: 15,
        voicemailMessages: 1,
        monthlySpend: 0
      };

      const context: IndianPricingContext = {
        userId: 'test-user',
        tier: INDIAN_PRICING_TIERS.STARTER,
        usage,
        gstConfig: INDIAN_GST_CONFIG,
        appliedDiscounts: [],
        billingPeriod: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        }
      };

      const result = await service.calculateCost(context);

      // Should only charge for voicemail since calls and SMS are within limits
      expect(result.usageCost).toBe(200); // 1 voicemail * ₹2.00
    });
  });
});