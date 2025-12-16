import { useState, useEffect } from 'react';

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  currency: string;
  popular?: boolean;
  features: string[];
  rates: {
    outboundCallPerMinute: number;
    inboundCallPerMinute: number;
    smsOutbound: number;
    smsInbound: number;
  };
  includedAllowances: {
    minutes: number;
    sms: number;
  };
  setupFee: number;
}

export interface RegionInfo {
  detectedRegion: string;
  detectionMethod: string;
  currency: string;
  locale: string;
  timezone: string;
  supportedFeatures: {
    paymentMethods: string[];
    languages: string[];
    compliance: string[];
    support: string[];
  };
}

export interface CostCalculation {
  eventType: string;
  unitCost: number;
  totalCost: number;
  quantity: number;
  description: string;
  currency: string;
  formattedCost: string;
}

export const useRegionalPricing = () => {
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [regionInfo, setRegionInfo] = useState<RegionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRegionalData();
  }, []);

  const fetchRegionalData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch region info and pricing tiers in parallel
      const [regionResponse, pricingResponse] = await Promise.all([
        fetch('/api/pricing/region-info').catch(() => null),
        fetch('/api/pricing/tiers').catch(() => null)
      ]);

      // Handle region info
      if (regionResponse?.ok) {
        const regionData = await regionResponse.json();
        setRegionInfo(regionData);
      } else {
        // Fallback region detection
        setRegionInfo(detectRegionFallback());
      }

      // Handle pricing tiers
      if (pricingResponse?.ok) {
        const pricingData = await pricingResponse.json();
        setPricingTiers(transformPricingData(pricingData.tiers, pricingData.currency));
      } else {
        // Fallback pricing data
        setPricingTiers(getFallbackPricingTiers());
      }
    } catch (err) {
      console.error('Failed to fetch regional data:', err);
      setError('Failed to load pricing information');
      
      // Set fallback data
      setRegionInfo(detectRegionFallback());
      setPricingTiers(getFallbackPricingTiers());
    } finally {
      setLoading(false);
    }
  };

  const detectRegionFallback = (): RegionInfo => {
    // Simple region detection based on timezone or navigator
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const isIndia = timezone.includes('Asia/Kolkata') || timezone.includes('Asia/Calcutta');
    
    return {
      detectedRegion: isIndia ? 'IN' : 'US',
      detectionMethod: 'browser',
      currency: isIndia ? 'INR' : 'USD',
      locale: isIndia ? 'en-IN' : 'en-US',
      timezone: timezone,
      supportedFeatures: isIndia ? {
        paymentMethods: ['UPI', 'Net Banking', 'Credit Card', 'Razorpay'],
        languages: ['English', 'Hindi'],
        compliance: ['GST', 'Data Localization'],
        support: ['24/7 India Timezone', 'WhatsApp', 'Phone']
      } : {
        paymentMethods: ['Credit Card', 'ACH', 'PayPal'],
        languages: ['English'],
        compliance: ['PCI DSS'],
        support: ['Email', 'Phone']
      }
    };
  };

  const getFallbackPricingTiers = (): PricingTier[] => {
    const region = regionInfo?.detectedRegion || 'IN';
    
    if (region === 'IN') {
      return [
        {
          id: 'starter',
          name: 'Starter',
          description: 'Perfect for small businesses getting started',
          monthlyPrice: 199,
          currency: 'INR',
          setupFee: 0,
          features: [
            '1 Virtual Phone Number',
            '100 minutes included',
            '50 SMS included',
            'Call forwarding',
            'Voicemail',
            'Basic analytics',
            'Email support'
          ],
          rates: {
            outboundCallPerMinute: 0.75,
            inboundCallPerMinute: 0.50,
            smsOutbound: 0.25,
            smsInbound: 0.10
          },
          includedAllowances: {
            minutes: 100,
            sms: 50
          }
        },
        {
          id: 'business',
          name: 'Business',
          description: 'Ideal for growing businesses',
          monthlyPrice: 399,
          currency: 'INR',
          popular: true,
          setupFee: 0,
          features: [
            '3 Virtual Phone Numbers',
            '500 minutes included',
            '200 SMS included',
            'Advanced call routing',
            'IVR system',
            'Call recording',
            'Advanced analytics',
            'Priority support',
            'WhatsApp integration'
          ],
          rates: {
            outboundCallPerMinute: 0.50,
            inboundCallPerMinute: 0.30,
            smsOutbound: 0.20,
            smsInbound: 0.05
          },
          includedAllowances: {
            minutes: 500,
            sms: 200
          }
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          description: 'For large organizations with high volume',
          monthlyPrice: 999,
          currency: 'INR',
          setupFee: 0,
          features: [
            'Unlimited Virtual Numbers',
            '2000 minutes included',
            '1000 SMS included',
            'Custom IVR flows',
            'AI-powered analytics',
            'CRM integrations',
            'Dedicated account manager',
            '24/7 phone support',
            'Custom reporting',
            'API access',
            'White-label options'
          ],
          rates: {
            outboundCallPerMinute: 0.25,
            inboundCallPerMinute: 0.15,
            smsOutbound: 0.10,
            smsInbound: 0.05
          },
          includedAllowances: {
            minutes: 2000,
            sms: 1000
          }
        }
      ];
    } else {
      return [
        {
          id: 'standard',
          name: 'Standard',
          description: 'Professional communication for businesses',
          monthlyPrice: 10,
          currency: 'USD',
          setupFee: 5,
          features: [
            '1 Virtual Phone Number',
            'Pay-per-use pricing',
            'Call forwarding',
            'Voicemail',
            'Basic analytics',
            'Email support'
          ],
          rates: {
            outboundCallPerMinute: 0.03,
            inboundCallPerMinute: 0.02,
            smsOutbound: 0.02,
            smsInbound: 0.01
          },
          includedAllowances: {
            minutes: 0,
            sms: 0
          }
        }
      ];
    }
  };

  const transformPricingData = (tiers: any, currency: string): PricingTier[] => {
    return Object.entries(tiers).map(([key, tier]: [string, any]) => ({
      id: key.toLowerCase(),
      name: tier.name,
      description: getDescriptionForTier(tier.name),
      monthlyPrice: tier.monthlyBase / 100,
      currency,
      setupFee: tier.setupFee / 100,
      popular: key === 'BUSINESS',
      features: getFeaturesForTier(tier.name, currency),
      rates: {
        outboundCallPerMinute: tier.rates.outboundCallPerMinute / 100,
        inboundCallPerMinute: tier.rates.inboundCallPerMinute / 100,
        smsOutbound: tier.rates.smsOutbound / 100,
        smsInbound: tier.rates.smsInbound / 100
      },
      includedAllowances: tier.includedAllowances
    }));
  };

  const getDescriptionForTier = (tierName: string): string => {
    const descriptions = {
      'Starter': 'Perfect for small businesses getting started',
      'Business': 'Ideal for growing businesses',
      'Enterprise': 'For large organizations with high volume',
      'Standard': 'Professional communication for businesses'
    };
    return descriptions[tierName as keyof typeof descriptions] || '';
  };

  const getFeaturesForTier = (tierName: string, currency: string): string[] => {
    const isIndia = currency === 'INR';
    
    const features = {
      'Starter': [
        '1 Virtual Phone Number',
        `${isIndia ? '100' : '0'} minutes included`,
        `${isIndia ? '50' : '0'} SMS included`,
        'Call forwarding',
        'Voicemail',
        'Basic analytics',
        'Email support'
      ],
      'Business': [
        '3 Virtual Phone Numbers',
        '500 minutes included',
        '200 SMS included',
        'Advanced call routing',
        'IVR system',
        'Call recording',
        'Advanced analytics',
        'Priority support',
        ...(isIndia ? ['WhatsApp integration'] : [])
      ],
      'Enterprise': [
        'Unlimited Virtual Numbers',
        '2000 minutes included',
        '1000 SMS included',
        'Custom IVR flows',
        'AI-powered analytics',
        'CRM integrations',
        'Dedicated account manager',
        '24/7 phone support',
        'Custom reporting',
        'API access',
        'White-label options'
      ],
      'Standard': [
        '1 Virtual Phone Number',
        'Pay-per-use pricing',
        'Call forwarding',
        'Voicemail',
        'Basic analytics',
        'Email support'
      ]
    };
    
    return features[tierName as keyof typeof features] || [];
  };

  const calculateCost = async (
    eventType: string,
    duration?: number,
    quantity?: number
  ): Promise<CostCalculation | null> => {
    try {
      const params = new URLSearchParams({
        eventType,
        ...(duration && { duration: duration.toString() }),
        ...(quantity && { quantity: quantity.toString() })
      });

      const response = await fetch(`/api/pricing/calculate?${params}`);
      if (response.ok) {
        const data = await response.json();
        return data.calculation;
      }
    } catch (error) {
      console.error('Failed to calculate cost:', error);
    }
    return null;
  };

  const formatCurrency = (amount: number, currency?: string): string => {
    const curr = currency || regionInfo?.currency || 'USD';
    const locale = curr === 'INR' ? 'en-IN' : 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const isIndiaRegion = regionInfo?.detectedRegion === 'IN';

  return {
    pricingTiers,
    regionInfo,
    loading,
    error,
    isIndiaRegion,
    calculateCost,
    formatCurrency,
    refetch: fetchRegionalData
  };
};

export default useRegionalPricing;