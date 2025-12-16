import React, { useState, useEffect } from 'react';
import { Check, Star, Globe, Phone, MessageSquare, Headphones } from 'lucide-react';

interface PricingTier {
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

interface RegionInfo {
  region: string;
  currency: string;
  detectedFrom: string;
  supportedFeatures: {
    paymentMethods: string[];
    languages: string[];
    compliance: string[];
    support: string[];
  };
}

const PricingPlans: React.FC = () => {
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [regionInfo, setRegionInfo] = useState<RegionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  useEffect(() => {
    fetchPricingData();
    fetchRegionInfo();
  }, []);

  const fetchPricingData = async () => {
    try {
      // In production, this would call the actual API
      // For now, we'll use mock data based on region
      const response = await fetch('/api/pricing/tiers');
      if (response.ok) {
        const data = await response.json();
        setPricingTiers(transformPricingData(data.tiers, data.currency));
      } else {
        // Fallback to mock data
        setMockPricingData();
      }
    } catch (error) {
      console.error('Failed to fetch pricing data:', error);
      setMockPricingData();
    }
  };

  const fetchRegionInfo = async () => {
    try {
      const response = await fetch('/api/pricing/region-info');
      if (response.ok) {
        const data = await response.json();
        setRegionInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch region info:', error);
    } finally {
      setLoading(false);
    }
  };

  const setMockPricingData = () => {
    // Detect region from browser or use India as default for demo
    const isIndianUser = true; // In production, this would come from region detection
    
    if (isIndianUser) {
      setPricingTiers([
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
      ]);
    } else {
      // US pricing
      setPricingTiers([
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
      ]);
    }
  };

  const transformPricingData = (tiers: any, currency: string): PricingTier[] => {
    return Object.entries(tiers).map(([key, tier]: [string, any]) => ({
      id: key.toLowerCase(),
      name: tier.name,
      description: getDescriptionForTier(tier.name),
      monthlyPrice: tier.monthlyBase / 100, // Convert from paise/cents
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

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleSelectPlan = (tierId: string) => {
    setSelectedTier(tierId);
    // In production, this would navigate to checkout or show a modal
    console.log('Selected plan:', tierId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isIndia = regionInfo?.region === 'IN' || pricingTiers[0]?.currency === 'INR';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            {isIndia ? 'India-Friendly Pricing' : 'Simple, Transparent Pricing'}
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            {isIndia 
              ? 'Affordable virtual phone numbers designed for Indian businesses. No setup fees, competitive rates, and local support.'
              : 'Professional virtual phone numbers for your business communication needs.'
            }
          </p>
          
          {regionInfo && (
            <div className="mt-6 inline-flex items-center px-4 py-2 bg-blue-100 rounded-full">
              <Globe className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm text-blue-800">
                Pricing for {regionInfo.region} region • Detected from {regionInfo.detectedFrom}
              </span>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative bg-white rounded-2xl shadow-lg ${
                tier.popular ? 'ring-2 ring-blue-600 scale-105' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="inline-flex items-center px-4 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                    <Star className="h-4 w-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900">{tier.name}</h3>
                <p className="mt-2 text-gray-600">{tier.description}</p>

                <div className="mt-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatCurrency(tier.monthlyPrice, tier.currency)}
                    </span>
                    <span className="ml-2 text-gray-600">/month</span>
                  </div>
                  {tier.setupFee > 0 && (
                    <p className="mt-1 text-sm text-gray-500">
                      + {formatCurrency(tier.setupFee, tier.currency)} setup fee
                    </p>
                  )}
                  {tier.setupFee === 0 && isIndia && (
                    <p className="mt-1 text-sm text-green-600 font-medium">
                      No setup fee!
                    </p>
                  )}
                </div>

                {/* Included Allowances */}
                {(tier.includedAllowances.minutes > 0 || tier.includedAllowances.sms > 0) && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg">
                    <h4 className="text-sm font-medium text-green-800 mb-2">Included:</h4>
                    <div className="space-y-1">
                      {tier.includedAllowances.minutes > 0 && (
                        <div className="flex items-center text-sm text-green-700">
                          <Phone className="h-4 w-4 mr-2" />
                          {tier.includedAllowances.minutes} minutes
                        </div>
                      )}
                      {tier.includedAllowances.sms > 0 && (
                        <div className="flex items-center text-sm text-green-700">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {tier.includedAllowances.sms} SMS
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Usage Rates */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Usage Rates:</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Outbound calls:</span>
                      <span className="font-medium">
                        {formatCurrency(tier.rates.outboundCallPerMinute, tier.currency)}/min
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Inbound calls:</span>
                      <span className="font-medium">
                        {formatCurrency(tier.rates.inboundCallPerMinute, tier.currency)}/min
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>SMS sent:</span>
                      <span className="font-medium">
                        {formatCurrency(tier.rates.smsOutbound, tier.currency)}/SMS
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="mt-8">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Features included:</h4>
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectPlan(tier.id)}
                  className={`mt-8 w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    tier.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {selectedTier === tier.id ? 'Selected' : 'Choose Plan'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* India-specific benefits */}
        {isIndia && (
          <div className="mt-16 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Why VoxLink is Perfect for Indian Businesses
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                    <span className="text-2xl">🇮🇳</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Local Support</h3>
                  <p className="text-sm text-gray-600 mt-1">24/7 support in Hindi & English</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                    <span className="text-2xl">💳</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Easy Payments</h3>
                  <p className="text-sm text-gray-600 mt-1">UPI, Net Banking, Cards accepted</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
                    <span className="text-2xl">📋</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">GST Compliant</h3>
                  <p className="text-sm text-gray-600 mt-1">Proper GST invoicing & compliance</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-4">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Fast Setup</h3>
                  <p className="text-sm text-gray-600 mt-1">Get started in minutes, not days</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {isIndia ? (
              <>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Are there any setup fees?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    No! Unlike many competitors, we don't charge any setup fees for Indian customers.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    What payment methods do you accept?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    We accept UPI, Net Banking, Credit/Debit Cards, and other popular Indian payment methods.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Is GST included in the pricing?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    GST will be added as per Indian tax regulations. We provide proper GST invoices.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Can I get support in Hindi?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Yes! Our support team is available in both Hindi and English during Indian business hours.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    How does billing work?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    You pay a monthly base fee plus usage charges for calls and SMS beyond included allowances.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Can I change plans anytime?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Yes, you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPlans;