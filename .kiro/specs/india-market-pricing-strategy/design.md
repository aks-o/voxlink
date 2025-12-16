# Design Document

## Overview

The India Market Pricing Strategy transforms VoxLink from a US-centric pricing model to a globally competitive platform with region-specific pricing tiers. This design implements dynamic pricing based on geographic location, local payment integrations, and partnerships with Indian telecom providers to achieve sustainable unit economics in price-sensitive markets.

## Architecture

### Regional Pricing Engine
```
┌─────────────────────────────────────────────────┐
│                 API Gateway                     │
├─────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │   Region    │  │   Currency  │  │ Payment  │ │
│  │ Detection   │  │ Conversion  │  │ Gateway  │ │
│  └─────────────┘  └─────────────┘  └──────────┘ │
├─────────────────────────────────────────────────┤
│              Pricing Service                    │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │  Regional   │  │   Volume    │  │ Provider │ │
│  │  Pricing    │  │  Discounts  │  │  Rates   │ │
│  └─────────────┘  └─────────────┘  └──────────┘ │
├─────────────────────────────────────────────────┤
│              Billing Service                    │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │    GST      │  │   Invoice   │  │  Local   │ │
│  │ Compliance  │  │ Generation  │  │ Payments │ │
│  └─────────────┘  └─────────────┘  └──────────┘ │
└─────────────────────────────────────────────────┘
```

### Telecom Provider Integration
```
┌─────────────────────────────────────────────────┐
│            Provider Manager                     │
├─────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │   Airtel    │  │     Jio     │  │   BSNL   │ │
│  │  Provider   │  │  Provider   │  │ Provider │ │
│  └─────────────┘  └─────────────┘  └──────────┘ │
├─────────────────────────────────────────────────┤
│              Routing Engine                     │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │ Least Cost  │  │  Quality    │  │ Failover │ │
│  │  Routing    │  │ Monitoring  │  │ Manager  │ │
│  └─────────────┘  └─────────────┘  └──────────┘ │
└─────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Regional Pricing Service

```typescript
interface RegionalPricingConfig {
  region: 'IN' | 'US' | 'EU' | 'GLOBAL';
  currency: 'INR' | 'USD' | 'EUR';
  pricing: {
    setupFee: number;
    monthlyBase: number;
    inboundCallPerMinute: number;
    outboundCallPerMinute: number;
    smsInbound: number;
    smsOutbound: number;
    voicemailPerMessage: number;
  };
  taxes: {
    rate: number;
    type: 'GST' | 'VAT' | 'SALES_TAX';
  };
  discounts: VolumeDiscount[];
}

interface VolumeDiscount {
  minUsage: number;
  maxUsage: number;
  discountPercent: number;
  type: 'MINUTES' | 'SMS' | 'MONTHLY_SPEND';
}
```

### 2. Indian Market Pricing Tiers

```typescript
const INDIA_PRICING_TIERS = {
  STARTER: {
    monthlyBase: 19900, // ₹199 in paise
    setupFee: 0,
    outboundCallPerMinute: 75, // ₹0.75 in paise
    inboundCallPerMinute: 50, // ₹0.50 in paise
    smsOutbound: 25, // ₹0.25 in paise
    smsInbound: 10, // ₹0.10 in paise
    includedMinutes: 100,
    includedSMS: 50
  },
  BUSINESS: {
    monthlyBase: 39900, // ₹399 in paise
    setupFee: 0,
    outboundCallPerMinute: 50, // ₹0.50 in paise
    inboundCallPerMinute: 30, // ₹0.30 in paise
    smsOutbound: 20, // ₹0.20 in paise
    smsInbound: 5, // ₹0.05 in paise
    includedMinutes: 500,
    includedSMS: 200
  },
  ENTERPRISE: {
    monthlyBase: 99900, // ₹999 in paise
    setupFee: 0,
    outboundCallPerMinute: 25, // ₹0.25 in paise
    inboundCallPerMinute: 15, // ₹0.15 in paise
    smsOutbound: 10, // ₹0.10 in paise
    smsInbound: 5, // ₹0.05 in paise
    includedMinutes: 2000,
    includedSMS: 1000
  }
};
```

### 3. Payment Integration Service

```typescript
interface IndianPaymentProvider {
  razorpay: {
    keyId: string;
    keySecret: string;
    webhookSecret: string;
  };
  upi: {
    merchantId: string;
    merchantKey: string;
  };
  netbanking: {
    supportedBanks: string[];
  };
}

interface GSTCompliantInvoice {
  gstin: string;
  placeOfSupply: string;
  taxBreakdown: {
    cgst: number;
    sgst: number;
    igst: number;
  };
  hsnCode: string;
}
```

## Data Models

### Regional Configuration
```sql
CREATE TABLE regional_pricing (
  id UUID PRIMARY KEY,
  region VARCHAR(10) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  pricing_config JSONB NOT NULL,
  tax_config JSONB NOT NULL,
  effective_from TIMESTAMP NOT NULL,
  effective_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE volume_discounts (
  id UUID PRIMARY KEY,
  region VARCHAR(10) NOT NULL,
  tier_name VARCHAR(50) NOT NULL,
  min_usage INTEGER NOT NULL,
  max_usage INTEGER,
  discount_percent DECIMAL(5,2) NOT NULL,
  usage_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Indian Provider Integration
```sql
CREATE TABLE indian_telecom_providers (
  id UUID PRIMARY KEY,
  provider_name VARCHAR(100) NOT NULL,
  api_endpoint VARCHAR(255) NOT NULL,
  api_credentials JSONB NOT NULL,
  rate_card JSONB NOT NULL,
  quality_score DECIMAL(3,2) DEFAULT 0.0,
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE call_routing_rules (
  id UUID PRIMARY KEY,
  region VARCHAR(10) NOT NULL,
  destination_prefix VARCHAR(20) NOT NULL,
  primary_provider_id UUID REFERENCES indian_telecom_providers(id),
  fallback_provider_id UUID REFERENCES indian_telecom_providers(id),
  cost_per_minute INTEGER NOT NULL,
  quality_threshold DECIMAL(3,2) DEFAULT 0.8,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Error Handling

### Currency Conversion Failures
```typescript
class CurrencyConversionError extends Error {
  constructor(fromCurrency: string, toCurrency: string) {
    super(`Failed to convert from ${fromCurrency} to ${toCurrency}`);
    this.name = 'CurrencyConversionError';
  }
}

// Fallback to cached rates if live conversion fails
const convertWithFallback = async (amount: number, from: string, to: string) => {
  try {
    return await liveConversion(amount, from, to);
  } catch (error) {
    logger.warn('Live conversion failed, using cached rates', { error });
    return cachedConversion(amount, from, to);
  }
};
```

### Payment Gateway Failures
```typescript
class PaymentGatewayError extends Error {
  constructor(gateway: string, reason: string) {
    super(`Payment failed via ${gateway}: ${reason}`);
    this.name = 'PaymentGatewayError';
  }
}

// Cascade through payment methods
const processPaymentWithFallback = async (paymentData: PaymentRequest) => {
  const gateways = ['razorpay', 'payu', 'ccavenue'];
  
  for (const gateway of gateways) {
    try {
      return await processPayment(gateway, paymentData);
    } catch (error) {
      logger.warn(`Payment failed via ${gateway}`, { error });
      continue;
    }
  }
  
  throw new PaymentGatewayError('ALL', 'All payment gateways failed');
};
```

### Provider Routing Failures
```typescript
class ProviderRoutingError extends Error {
  constructor(destination: string, providers: string[]) {
    super(`No available providers for ${destination}. Tried: ${providers.join(', ')}`);
    this.name = 'ProviderRoutingError';
  }
}

// Intelligent failover with quality monitoring
const routeCallWithFailover = async (destination: string, callData: CallRequest) => {
  const providers = await getProvidersForDestination(destination);
  
  for (const provider of providers) {
    if (provider.qualityScore < 0.7) continue;
    
    try {
      return await initiateCall(provider, callData);
    } catch (error) {
      await updateProviderQuality(provider.id, -0.1);
      continue;
    }
  }
  
  throw new ProviderRoutingError(destination, providers.map(p => p.name));
};
```

## Testing Strategy

### Unit Tests
- Regional pricing calculation accuracy
- Currency conversion with various exchange rates
- Volume discount application logic
- GST calculation compliance
- Payment gateway integration mocks

### Integration Tests
- End-to-end pricing flow for Indian users
- Payment processing with Razorpay sandbox
- Telecom provider API integration
- Invoice generation with GST compliance
- Multi-currency billing scenarios

### Load Tests
- Concurrent pricing calculations for 10,000+ users
- Payment gateway throughput testing
- Provider failover under high load
- Currency conversion service performance
- Database query optimization for regional data

### Market Validation Tests
- A/B testing different pricing tiers
- Conversion rate optimization for Indian market
- Customer acquisition cost measurement
- Lifetime value tracking by region
- Competitive pricing analysis automation

## Performance Considerations

### Caching Strategy
```typescript
// Cache regional pricing for 1 hour
const REGIONAL_PRICING_CACHE_TTL = 3600;

// Cache currency rates for 15 minutes
const CURRENCY_RATE_CACHE_TTL = 900;

// Cache provider rates for 5 minutes
const PROVIDER_RATE_CACHE_TTL = 300;
```

### Database Optimization
- Index on (region, effective_from) for pricing lookups
- Partition regional_pricing by region for faster queries
- Read replicas for pricing calculations
- Connection pooling for high-frequency rate lookups

### API Rate Limiting
- 1000 requests/minute for pricing calculations
- 100 requests/minute for payment processing
- 500 requests/minute for currency conversion
- Circuit breaker for external provider APIs

## Security Considerations

### Payment Data Protection
- PCI DSS compliance for payment processing
- Encryption of payment credentials at rest
- Secure API key management for Indian gateways
- Audit logging for all payment transactions

### Regional Data Compliance
- GDPR compliance for EU customers
- Data localization for Indian customer data
- Secure cross-border data transfer protocols
- Regular security audits for regional deployments

This design enables VoxLink to compete effectively in the Indian market while maintaining profitability through optimized costs, local partnerships, and region-specific features.