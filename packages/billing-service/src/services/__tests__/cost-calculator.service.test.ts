import { CostCalculatorService } from '../cost-calculator.service';
import { config } from '../../config/config';

describe('CostCalculatorService', () => {
  let service: CostCalculatorService;

  beforeEach(() => {
    service = new CostCalculatorService();
  });

  describe('calculateUsageCost', () => {
    it('should calculate inbound call cost correctly', () => {
      const result = service.calculateUsageCost({
        eventType: 'INBOUND_CALL',
        duration: 150, // 2.5 minutes
      });

      expect(result).toEqual({
        unitCost: config.pricing.inboundCallPerMinute,
        totalCost: config.pricing.inboundCallPerMinute * 3, // Rounded up to 3 minutes
        quantity: 3,
        description: 'Inbound call (3 min)',
      });
    });

    it('should calculate outbound call cost correctly', () => {
      const result = service.calculateUsageCost({
        eventType: 'OUTBOUND_CALL',
        duration: 90, // 1.5 minutes
      });

      expect(result).toEqual({
        unitCost: config.pricing.outboundCallPerMinute,
        totalCost: config.pricing.outboundCallPerMinute * 2, // Rounded up to 2 minutes
        quantity: 2,
        description: 'Outbound call (2 min)',
      });
    });

    it('should calculate SMS received cost correctly', () => {
      const result = service.calculateUsageCost({
        eventType: 'SMS_RECEIVED',
        quantity: 5,
      });

      expect(result).toEqual({
        unitCost: config.pricing.smsInbound,
        totalCost: config.pricing.smsInbound * 5,
        quantity: 5,
        description: 'SMS received',
      });
    });

    it('should calculate SMS sent cost correctly', () => {
      const result = service.calculateUsageCost({
        eventType: 'SMS_SENT',
        quantity: 3,
      });

      expect(result).toEqual({
        unitCost: config.pricing.smsOutbound,
        totalCost: config.pricing.smsOutbound * 3,
        quantity: 3,
        description: 'SMS sent',
      });
    });

    it('should calculate voicemail cost correctly', () => {
      const result = service.calculateUsageCost({
        eventType: 'VOICEMAIL_RECEIVED',
        quantity: 2,
      });

      expect(result).toEqual({
        unitCost: config.pricing.voicemailPerMessage,
        totalCost: config.pricing.voicemailPerMessage * 2,
        quantity: 2,
        description: 'Voicemail received',
      });
    });

    it('should calculate call forwarding cost correctly', () => {
      const result = service.calculateUsageCost({
        eventType: 'CALL_FORWARDED',
        duration: 120, // 2 minutes exactly
      });

      expect(result).toEqual({
        unitCost: config.pricing.callForwardingPerMinute,
        totalCost: config.pricing.callForwardingPerMinute * 2,
        quantity: 2,
        description: 'Call forwarded (2 min)',
      });
    });

    it('should calculate monthly subscription cost correctly', () => {
      const result = service.calculateUsageCost({
        eventType: 'MONTHLY_SUBSCRIPTION',
      });

      expect(result).toEqual({
        unitCost: config.pricing.monthlyBase,
        totalCost: config.pricing.monthlyBase,
        quantity: 1,
        description: 'Monthly subscription',
      });
    });

    it('should calculate setup fee correctly', () => {
      const result = service.calculateUsageCost({
        eventType: 'SETUP_FEE',
      });

      expect(result).toEqual({
        unitCost: config.pricing.setupFee,
        totalCost: config.pricing.setupFee,
        quantity: 1,
        description: 'Setup fee',
      });
    });

    it('should throw error for unknown event type', () => {
      expect(() => {
        service.calculateUsageCost({
          eventType: 'UNKNOWN_EVENT' as any,
        });
      }).toThrow('Unknown usage event type: UNKNOWN_EVENT');
    });

    it('should round up call duration to nearest minute', () => {
      const result = service.calculateUsageCost({
        eventType: 'INBOUND_CALL',
        duration: 61, // 1 minute and 1 second
      });

      expect(result.quantity).toBe(2); // Should round up to 2 minutes
    });

    it('should handle zero duration calls', () => {
      const result = service.calculateUsageCost({
        eventType: 'INBOUND_CALL',
        duration: 0,
      });

      expect(result.quantity).toBe(0);
      expect(result.totalCost).toBe(0);
    });
  });

  describe('calculateTax', () => {
    it('should calculate tax correctly', () => {
      const subtotal = 1000; // $10.00
      const tax = service.calculateTax(subtotal);
      const expectedTax = Math.round(subtotal * config.billing.taxRate);

      expect(tax).toBe(expectedTax);
    });

    it('should handle zero subtotal', () => {
      const tax = service.calculateTax(0);
      expect(tax).toBe(0);
    });
  });

  describe('calculateTotal', () => {
    it('should calculate total with tax correctly', () => {
      const subtotal = 1000; // $10.00
      const total = service.calculateTotal(subtotal);
      const expectedTax = Math.round(subtotal * config.billing.taxRate);
      const expectedTotal = subtotal + expectedTax;

      expect(total).toBe(expectedTotal);
    });
  });

  describe('formatAmount', () => {
    it('should format amount in cents to currency string', () => {
      const formatted = service.formatAmount(1250); // $12.50
      expect(formatted).toBe('$12.50');
    });

    it('should handle zero amount', () => {
      const formatted = service.formatAmount(0);
      expect(formatted).toBe('$0.00');
    });

    it('should handle large amounts', () => {
      const formatted = service.formatAmount(123456); // $1,234.56
      expect(formatted).toBe('$1,234.56');
    });
  });

  describe('getPricingInfo', () => {
    it('should return complete pricing information', () => {
      const pricing = service.getPricingInfo();

      expect(pricing).toEqual({
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
      });
    });
  });
});