import { RegionalPricingService } from '../regional-pricing.service';
import { PrismaClient } from '@prisma/client';
import { Region } from '@voxlink/shared';

// Mock PrismaClient
const mockPrisma = {
  $queryRaw: jest.fn(),
} as unknown as PrismaClient;

describe('RegionalPricingService', () => {
  let service: RegionalPricingService;

  beforeEach(() => {
    service = new RegionalPricingService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('getRegionalPricing', () => {
    it('should return India pricing configuration', async () => {
      const mockPricingData = [{
        region: 'IN',
        currency: 'INR',
        pricing_config: {
          setupFee: 0,
          monthlyBase: 19900,
          inboundCallPerMinute: 50,
          outboundCallPerMinute: 75,
          smsInbound: 10,
          smsOutbound: 25,
          voicemailPerMessage: 500,
          callForwardingPerMinute: 25
        },
        tax_config: {
          rate: 0.18,
          type: 'GST',
          cgst: 0.09,
          sgst: 0.09,
          igst: 0.18
        },
        effective_from: new Date('2024-01-01'),
        effective_until: null
      }];

      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockPricingData);

      const result = await service.getRegionalPricing('IN');

      expect(result).toEqual({
        region: 'IN',
        currency: 'INR',
        pricing: mockPricingData[0].pricing_config,
        taxes: mockPricingData[0].tax_config,
        effectiveFrom: mockPricingData[0].effective_from,
        effectiveUntil: null,
      });
    });

    it('should return null for unsupported region', async () => {
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      const result = await service.getRegionalPricing('XX' as Region);

      expect(result).toBeNull();
    });
  });

  describe('calculateRegionalCost', () => {
    beforeEach(() => {
      // Mock pricing data for India
      const mockPricingData = [{
        region: 'IN',
        currency: 'INR',
        pricing_config: {
          setupFee: 0,
          monthlyBase: 19900,
          inboundCallPerMinute: 50,
          outboundCallPerMinute: 75,
          smsInbound: 10,
          smsOutbound: 25,
          voicemailPerMessage: 500,
          callForwardingPerMinute: 25
        },
        tax_config: {
          rate: 0.18,
          type: 'GST'
        },
        effective_from: new Date('2024-01-01'),
        effective_until: null
      }];

      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockPricingData);
    });

    it('should calculate outbound call cost for India', async () => {
      const result = await service.calculateRegionalCost({
        eventType: 'OUTBOUND_CALL',
        duration: 120, // 2 minutes
        region: 'IN',
      });

      expect(result).toEqual({
        unitCost: 75, // ₹0.75 in paise
        totalCost: 150, // 2 minutes * ₹0.75
        quantity: 2,
        description: 'Outbound call (2 min)',
        currency: 'INR',
        region: 'IN',
      });
    });

    it('should calculate SMS cost for India', async () => {
      const result = await service.calculateRegionalCost({
        eventType: 'SMS_SENT',
        quantity: 5,
        region: 'IN',
      });

      expect(result).toEqual({
        unitCost: 25, // ₹0.25 in paise
        totalCost: 125, // 5 SMS * ₹0.25
        quantity: 5,
        description: 'SMS sent',
        currency: 'INR',
        region: 'IN',
      });
    });

    it('should calculate monthly subscription for India', async () => {
      const result = await service.calculateRegionalCost({
        eventType: 'MONTHLY_SUBSCRIPTION',
        quantity: 1,
        region: 'IN',
      });

      expect(result).toEqual({
        unitCost: 19900, // ₹199 in paise
        totalCost: 19900,
        quantity: 1,
        description: 'Monthly subscription',
        currency: 'INR',
        region: 'IN',
      });
    });
  });

  describe('formatRegionalAmount', () => {
    it('should format INR amounts correctly', () => {
      // Mock cached pricing for India
      service['pricingCache'].set('pricing_IN', {
        region: 'IN',
        currency: 'INR',
        pricing: {} as any,
        taxes: {} as any,
        effectiveFrom: new Date(),
      });

      const formatted = service.formatRegionalAmount(19900, 'IN');
      expect(formatted).toMatch(/₹199/); // Should format as rupees
    });

    it('should format USD amounts correctly', () => {
      // Mock cached pricing for US
      service['pricingCache'].set('pricing_US', {
        region: 'US',
        currency: 'USD',
        pricing: {} as any,
        taxes: {} as any,
        effectiveFrom: new Date(),
      });

      const formatted = service.formatRegionalAmount(1000, 'US');
      expect(formatted).toMatch(/\$10/); // Should format as dollars
    });
  });

  describe('getPricingTiers', () => {
    it('should return India pricing tiers', () => {
      const tiers = service.getPricingTiers('IN');

      expect(tiers).toHaveProperty('STARTER');
      expect(tiers).toHaveProperty('BUSINESS');
      expect(tiers).toHaveProperty('ENTERPRISE');

      expect(tiers.STARTER.currency).toBe('INR');
      expect(tiers.STARTER.monthlyBase).toBe(19900); // ₹199 in paise
    });

    it('should return US pricing tiers for other regions', () => {
      const tiers = service.getPricingTiers('US');

      expect(tiers).toHaveProperty('STANDARD');
      expect(tiers.STANDARD.currency).toBe('USD');
      expect(tiers.STANDARD.monthlyBase).toBe(1000); // $10 in cents
    });
  });
});