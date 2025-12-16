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
    cgst?: number; // For India GST
    sgst?: number; // For India GST
    igst?: number; // For India GST
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

// India-specific pricing tiers
export const INDIA_PRICING_TIERS: Record<string, PricingTier> = {
  STARTER: {
    name: 'Starter',
    region: 'IN',
    currency: 'INR',
    monthlyBase: 19900, // ₹199 in paise
    setupFee: 0,
    rates: {
      outboundCallPerMinute: 75, // ₹0.75 in paise
      inboundCallPerMinute: 50, // ₹0.50 in paise
      smsOutbound: 25, // ₹0.25 in paise
      smsInbound: 10, // ₹0.10 in paise
      voicemailPerMessage: 500, // ₹5.00 in paise
      callForwardingPerMinute: 25, // ₹0.25 in paise
    },
    includedAllowances: {
      minutes: 100,
      sms: 50,
    },
    volumeDiscounts: [],
  },
  BUSINESS: {
    name: 'Business',
    region: 'IN',
    currency: 'INR',
    monthlyBase: 39900, // ₹399 in paise
    setupFee: 0,
    rates: {
      outboundCallPerMinute: 50, // ₹0.50 in paise
      inboundCallPerMinute: 30, // ₹0.30 in paise
      smsOutbound: 20, // ₹0.20 in paise
      smsInbound: 5, // ₹0.05 in paise
      voicemailPerMessage: 300, // ₹3.00 in paise
      callForwardingPerMinute: 15, // ₹0.15 in paise
    },
    includedAllowances: {
      minutes: 500,
      sms: 200,
    },
    volumeDiscounts: [],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    region: 'IN',
    currency: 'INR',
    monthlyBase: 99900, // ₹999 in paise
    setupFee: 0,
    rates: {
      outboundCallPerMinute: 25, // ₹0.25 in paise
      inboundCallPerMinute: 15, // ₹0.15 in paise
      smsOutbound: 10, // ₹0.10 in paise
      smsInbound: 5, // ₹0.05 in paise
      voicemailPerMessage: 200, // ₹2.00 in paise
      callForwardingPerMinute: 10, // ₹0.10 in paise
    },
    includedAllowances: {
      minutes: 2000,
      sms: 1000,
    },
    volumeDiscounts: [],
  },
};

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