"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INDIA_PRICING_TIERS = void 0;
// India-specific pricing tiers
exports.INDIA_PRICING_TIERS = {
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
