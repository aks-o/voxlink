import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Phone, 
  MapPin, 
  DollarSign, 
  Clock, 
  CreditCard,
  Check,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Shield,
  Zap,
  Star,
  Wifi,
  Globe
} from 'lucide-react';
import { numbersApi } from '@services/api';
import { NumberProvider, NumberPurchaseRequest } from '@shared/types/did-management';
import toast from 'react-hot-toast';

interface NumberDetails {
  phoneNumber: string;
  countryCode: string;
  areaCode: string;
  city: string;
  region: string;
  monthlyRate: number;
  setupFee: number;
  features: string[];
  availability: 'available' | 'reserved' | 'unavailable';
  reservedUntil?: string;
  providers: NumberProvider[];
  selectedProvider?: string;
}

const NumberPurchase: React.FC = () => {
  const { phoneNumber } = useParams<{ phoneNumber: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [billingInfo, setBillingInfo] = useState({
    companyName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const decodedPhoneNumber = phoneNumber ? decodeURIComponent(phoneNumber) : '';

  // Fetch number details
  const { data: numberDetails, isLoading, error } = useQuery({
    queryKey: ['number-details', decodedPhoneNumber],
    queryFn: () => numbersApi.getNumberDetails(decodedPhoneNumber),
    enabled: !!decodedPhoneNumber,
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (purchaseData: any) => {
      // This would call the actual purchase API
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, orderId: 'ORD-' + Date.now() });
        }, 2000);
      });
    },
    onSuccess: () => {
      toast.success('Number purchased successfully!');
      navigate('/numbers');
    },
    onError: () => {
      toast.error('Failed to purchase number');
    },
  });

  // Mock data for development with multiple providers
  const number: NumberDetails = numberDetails?.data || {
    phoneNumber: decodedPhoneNumber,
    countryCode: 'US',
    areaCode: decodedPhoneNumber.substring(2, 5),
    city: 'San Francisco',
    region: 'CA',
    monthlyRate: 1000,
    setupFee: 500,
    features: ['VOICE', 'SMS'],
    availability: 'reserved',
    providers: [
      {
        id: 'twilio',
        name: 'twilio',
        displayName: 'Twilio',
        supportedCountries: ['US', 'CA', 'UK'],
        features: ['VOICE', 'SMS', 'MMS', 'CALL_RECORDING'],
        pricing: {
          setupFee: 100,
          monthlyRate: 1000,
          perMinuteRate: 1,
        },
        apiEndpoint: 'https://api.twilio.com',
        status: 'active',
      },
      {
        id: 'bandwidth',
        name: 'bandwidth',
        displayName: 'Bandwidth',
        supportedCountries: ['US', 'CA'],
        features: ['VOICE', 'SMS', 'MMS', 'INTERNATIONAL'],
        pricing: {
          setupFee: 0,
          monthlyRate: 800,
          perMinuteRate: 0.5,
        },
        apiEndpoint: 'https://api.bandwidth.com',
        status: 'active',
      },
      {
        id: 'vonage',
        name: 'vonage',
        displayName: 'Vonage',
        supportedCountries: ['US', 'CA', 'UK', 'AU'],
        features: ['VOICE', 'SMS', 'VIDEO', 'ANALYTICS'],
        pricing: {
          setupFee: 200,
          monthlyRate: 1200,
          perMinuteRate: 0.8,
        },
        apiEndpoint: 'https://api.vonage.com',
        status: 'active',
      },
    ],
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const calculateTotal = () => {
    if (selectedProviderData) {
      return selectedProviderData.pricing.monthlyRate + selectedProviderData.pricing.setupFee;
    }
    return number.monthlyRate + number.setupFee;
  };

  const getCurrentPricing = () => {
    if (selectedProviderData) {
      return {
        monthlyRate: selectedProviderData.pricing.monthlyRate,
        setupFee: selectedProviderData.pricing.setupFee,
      };
    }
    return {
      monthlyRate: number.monthlyRate,
      setupFee: number.setupFee,
    };
  };

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'twilio':
        return <Zap className="w-5 h-5" />;
      case 'bandwidth':
        return <Wifi className="w-5 h-5" />;
      case 'vonage':
        return <Globe className="w-5 h-5" />;
      default:
        return <Phone className="w-5 h-5" />;
    }
  };

  const selectedProviderData = number.providers?.find(p => p.id === selectedProvider);

  const handlePurchase = () => {
    if (currentStep === 1 && !selectedProvider) {
      toast.error('Please select a provider');
      return;
    }
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      const purchaseRequest: NumberPurchaseRequest = {
        phoneNumber: number.phoneNumber,
        providerId: selectedProvider,
        countryCode: number.countryCode,
        areaCode: number.areaCode,
        features: number.features,
        billingInfo,
        paymentMethod: {
          type: paymentMethod as any,
          details: {},
        },
      };
      purchaseMutation.mutate(purchaseRequest);
    }
  };

  const steps = [
    { id: 1, title: 'Select Provider', description: 'Choose your provider' },
    { id: 2, title: 'Review Number', description: 'Confirm your selection' },
    { id: 3, title: 'Billing Info', description: 'Enter billing details' },
    { id: 4, title: 'Payment', description: 'Complete purchase' },
  ];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-medium text-charcoal mb-2">Number Not Available</h3>
            <p className="text-slate mb-4">
              This number is no longer available for purchase.
            </p>
            <button onClick={() => navigate('/numbers')} className="btn-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Numbers
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/numbers')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Purchase Number</h1>
          <p className="text-slate">Complete your number purchase</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="card">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= step.id 
                  ? 'bg-voxlink-blue text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > step.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-charcoal">{step.title}</div>
                <div className="text-xs text-slate">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  currentStep > step.id ? 'bg-voxlink-blue' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Select Provider */}
          {currentStep === 1 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-charcoal mb-4">Choose Your Provider</h2>
              
              <div className="space-y-4">
                {number.providers?.map((provider) => (
                  <div
                    key={provider.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedProvider === provider.id
                        ? 'border-voxlink-blue bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedProvider(provider.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          selectedProvider === provider.id ? 'bg-voxlink-blue text-white' : 'bg-gray-100'
                        }`}>
                          {getProviderIcon(provider.id)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-charcoal">{provider.displayName}</h3>
                          <div className="flex items-center space-x-4 text-sm text-slate mt-1">
                            <span>Setup: {formatPrice(provider.pricing.setupFee)}</span>
                            <span>Monthly: {formatPrice(provider.pricing.monthlyRate)}</span>
                            <span>Per minute: {formatPrice(provider.pricing.perMinuteRate)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {provider.pricing.setupFee === 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            No Setup Fee
                          </span>
                        )}
                        {provider.pricing.monthlyRate < 1000 && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            Best Value
                          </span>
                        )}
                        <input
                          type="radio"
                          name="provider"
                          checked={selectedProvider === provider.id}
                          onChange={() => setSelectedProvider(provider.id)}
                          className="ml-2"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-2">
                      {provider.features.map((feature) => (
                        <span
                          key={feature}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Review Number */}
          {currentStep === 2 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-charcoal mb-4">Review Selected Number</h2>
              
              <div className="border rounded-lg p-4 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-xl font-bold text-charcoal">
                      {number.phoneNumber}
                    </div>
                    <div className="flex items-center text-slate mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      {number.city}, {number.region}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate">Area Code</div>
                    <div className="text-lg font-semibold text-charcoal">
                      {number.areaCode}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {number.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {number.reservedUntil && (
                  <div className="flex items-center text-amber-600 bg-amber-50 p-3 rounded-lg">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      Reserved until {new Date(number.reservedUntil).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Billing Info */}
          {currentStep === 3 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-charcoal mb-4">Billing Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={billingInfo.companyName}
                    onChange={(e) => setBillingInfo(prev => ({ ...prev, companyName: e.target.value }))}
                    className="input"
                    placeholder="Your Company Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={billingInfo.email}
                    onChange={(e) => setBillingInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="input"
                    placeholder="billing@company.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={billingInfo.address}
                    onChange={(e) => setBillingInfo(prev => ({ ...prev, address: e.target.value }))}
                    className="input"
                    placeholder="123 Business Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={billingInfo.city}
                    onChange={(e) => setBillingInfo(prev => ({ ...prev, city: e.target.value }))}
                    className="input"
                    placeholder="San Francisco"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={billingInfo.state}
                    onChange={(e) => setBillingInfo(prev => ({ ...prev, state: e.target.value }))}
                    className="input"
                    placeholder="CA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={billingInfo.zipCode}
                    onChange={(e) => setBillingInfo(prev => ({ ...prev, zipCode: e.target.value }))}
                    className="input"
                    placeholder="94105"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {currentStep === 4 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-charcoal mb-4">Payment Method</h2>
              
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="credit_card"
                      checked={paymentMethod === 'credit_card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <CreditCard className="w-5 h-5 mr-2" />
                    <span className="font-medium">Credit Card</span>
                  </label>
                  
                  {paymentMethod === 'credit_card' && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          placeholder="Card Number"
                          className="input"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="input"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="CVC"
                          className="input"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          placeholder="Cardholder Name"
                          className="input"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center text-sm text-slate bg-blue-50 p-3 rounded-lg">
                  <Shield className="w-4 h-4 mr-2 text-blue-600" />
                  <span>Your payment information is encrypted and secure</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-charcoal mb-4">Order Summary</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate">Phone Number:</span>
                <span className="font-medium text-charcoal">{number.phoneNumber}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate">Location:</span>
                <span className="font-medium text-charcoal">{number.city}, {number.region}</span>
              </div>
              
              {selectedProviderData && (
                <div className="flex items-center justify-between">
                  <span className="text-slate">Provider:</span>
                  <div className="flex items-center space-x-2">
                    {getProviderIcon(selectedProviderData.id)}
                    <span className="font-medium text-charcoal">{selectedProviderData.displayName}</span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-slate">Setup Fee:</span>
                <span className="font-medium text-charcoal">{formatPrice(getCurrentPricing().setupFee)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate">Monthly Rate:</span>
                <span className="font-medium text-charcoal">{formatPrice(getCurrentPricing().monthlyRate)}</span>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span className="text-charcoal">Total Today:</span>
                  <span className="text-charcoal">{formatPrice(calculateTotal())}</span>
                </div>
                <div className="text-xs text-slate mt-1">
                  Then {formatPrice(getCurrentPricing().monthlyRate)} monthly
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="w-full btn-secondary"
                >
                  Back
                </button>
              )}
              
              <button
                onClick={handlePurchase}
                disabled={purchaseMutation.isPending || (currentStep === 1 && !selectedProvider)}
                className="w-full btn-primary"
              >
                {purchaseMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : currentStep === 4 ? (
                  <CreditCard className="w-4 h-4 mr-2" />
                ) : null}
                {currentStep === 4 ? 'Complete Purchase' : 'Continue'}
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="card">
            <h3 className="text-lg font-semibold text-charcoal mb-4">Included Features</h3>
            <div className="space-y-2">
              {(selectedProviderData?.features || number.features).map((feature) => (
                <div key={feature} className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  <span className="text-sm text-charcoal">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Support */}
          <div className="card">
            <h3 className="text-lg font-semibold text-charcoal mb-4">Need Help?</h3>
            <p className="text-sm text-slate mb-3">
              Our support team is here to help with your purchase.
            </p>
            <button className="btn-secondary w-full text-sm">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NumberPurchase;