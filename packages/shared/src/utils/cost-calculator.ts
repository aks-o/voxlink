/**
 * Cost calculation utilities for VoxLink
 */

import { UsageEventType } from '../types/usage-record';

export interface RateCard {
  inboundCall: number; // per minute in cents
  outboundCall: number; // per minute in cents
  smsReceived: number; // per message in cents
  smsSent: number; // per message in cents
  voicemailReceived: number; // per message in cents
  callForwarded: number; // per minute in cents
}

export interface CountryRates {
  [countryCode: string]: RateCard;
}

// Default rate card (US rates)
export const DEFAULT_RATES: RateCard = {
  inboundCall: 1, // $0.01 per minute
  outboundCall: 2, // $0.02 per minute
  smsReceived: 0, // Free
  smsSent: 1, // $0.01 per message
  voicemailReceived: 0, // Free
  callForwarded: 1, // $0.01 per minute
};

// Sample international rates
export const COUNTRY_RATES: CountryRates = {
  'US': DEFAULT_RATES,
  'CA': DEFAULT_RATES,
  'GB': {
    inboundCall: 2,
    outboundCall: 3,
    smsReceived: 0,
    smsSent: 2,
    voicemailReceived: 0,
    callForwarded: 2,
  },
  'AU': {
    inboundCall: 3,
    outboundCall: 4,
    smsReceived: 0,
    smsSent: 3,
    voicemailReceived: 0,
    callForwarded: 3,
  },
};

/**
 * Calculate cost for a usage event
 */
export function calculateUsageCost(
  eventType: UsageEventType,
  duration: number = 0,
  countryCode: string = 'US'
): number {
  const rates = COUNTRY_RATES[countryCode] || DEFAULT_RATES;
  
  switch (eventType) {
    case 'inbound_call':
      return Math.ceil(duration / 60) * rates.inboundCall;
    
    case 'outbound_call':
      return Math.ceil(duration / 60) * rates.outboundCall;
    
    case 'sms_received':
      return rates.smsReceived;
    
    case 'sms_sent':
      return rates.smsSent;
    
    case 'voicemail_received':
      return rates.voicemailReceived;
    
    case 'call_forwarded':
      return Math.ceil(duration / 60) * rates.callForwarded;
    
    default:
      return 0;
  }
}

/**
 * Calculate monthly cost projection based on usage patterns
 */
export function calculateMonthlyProjection(
  dailyUsage: { eventType: UsageEventType; duration?: number; count: number }[],
  countryCode: string = 'US'
): number {
  const dailyCost = dailyUsage.reduce((total, usage) => {
    const unitCost = calculateUsageCost(usage.eventType, usage.duration || 0, countryCode);
    return total + (unitCost * usage.count);
  }, 0);
  
  // Project for 30 days
  return dailyCost * 30;
}

/**
 * Format cost in cents to currency string
 */
export function formatCost(cents: number, currency: string = 'USD'): string {
  const amount = cents / 100;
  
  switch (currency) {
    case 'USD':
      return `$${amount.toFixed(2)}`;
    case 'GBP':
      return `£${amount.toFixed(2)}`;
    case 'EUR':
      return `€${amount.toFixed(2)}`;
    case 'AUD':
      return `A$${amount.toFixed(2)}`;
    default:
      return `${amount.toFixed(2)} ${currency}`;
  }
}

/**
 * Calculate cost savings compared to traditional phone systems
 */
export function calculateSavings(
  monthlyVoxLinkCost: number,
  traditionalSystemCost: number
): {
  monthlySavings: number;
  annualSavings: number;
  savingsPercentage: number;
} {
  const monthlySavings = traditionalSystemCost - monthlyVoxLinkCost;
  const annualSavings = monthlySavings * 12;
  const savingsPercentage = traditionalSystemCost > 0 
    ? (monthlySavings / traditionalSystemCost) * 100 
    : 0;
  
  return {
    monthlySavings,
    annualSavings,
    savingsPercentage,
  };
}

/**
 * Get cost optimization recommendations
 */
export function getCostOptimizationRecommendations(
  monthlyUsage: { eventType: UsageEventType; duration?: number; count: number; cost: number }[],
  monthlyBudget?: number
): string[] {
  const recommendations: string[] = [];
  const totalCost = monthlyUsage.reduce((sum, usage) => sum + usage.cost, 0);
  
  // Check if over budget
  if (monthlyBudget && totalCost > monthlyBudget) {
    recommendations.push(`You're ${formatCost(totalCost - monthlyBudget)} over your monthly budget.`);
  }
  
  // Analyze usage patterns
  const outboundCalls = monthlyUsage.find(u => u.eventType === 'outbound_call');
  if (outboundCalls && outboundCalls.cost > totalCost * 0.5) {
    recommendations.push('Consider using VoIP calling to reduce outbound call costs.');
  }
  
  const smsSent = monthlyUsage.find(u => u.eventType === 'sms_sent');
  if (smsSent && smsSent.count > 1000) {
    recommendations.push('High SMS usage detected. Consider bulk SMS packages for better rates.');
  }
  
  const callForwarding = monthlyUsage.find(u => u.eventType === 'call_forwarded');
  if (callForwarding && callForwarding.cost > totalCost * 0.3) {
    recommendations.push('Review call forwarding rules to minimize unnecessary forwards.');
  }
  
  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push('Your usage patterns look optimized. Great job managing costs!');
  }
  
  return recommendations;
}