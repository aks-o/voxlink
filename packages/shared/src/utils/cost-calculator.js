"use strict";
/**
 * Cost calculation utilities for VoxLink
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.COUNTRY_RATES = exports.DEFAULT_RATES = void 0;
exports.calculateUsageCost = calculateUsageCost;
exports.calculateMonthlyProjection = calculateMonthlyProjection;
exports.formatCost = formatCost;
exports.calculateSavings = calculateSavings;
exports.getCostOptimizationRecommendations = getCostOptimizationRecommendations;
// Default rate card (US rates)
exports.DEFAULT_RATES = {
    inboundCall: 1, // $0.01 per minute
    outboundCall: 2, // $0.02 per minute
    smsReceived: 0, // Free
    smsSent: 1, // $0.01 per message
    voicemailReceived: 0, // Free
    callForwarded: 1, // $0.01 per minute
};
// Sample international rates
exports.COUNTRY_RATES = {
    'US': exports.DEFAULT_RATES,
    'CA': exports.DEFAULT_RATES,
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
function calculateUsageCost(eventType, duration = 0, countryCode = 'US') {
    const rates = exports.COUNTRY_RATES[countryCode] || exports.DEFAULT_RATES;
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
function calculateMonthlyProjection(dailyUsage, countryCode = 'US') {
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
function formatCost(cents, currency = 'USD') {
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
function calculateSavings(monthlyVoxLinkCost, traditionalSystemCost) {
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
function getCostOptimizationRecommendations(monthlyUsage, monthlyBudget) {
    const recommendations = [];
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
