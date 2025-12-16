"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INDIAN_GST_CONFIG = exports.INDIAN_VOLUME_DISCOUNTS = exports.INDIAN_PRICING_TIERS = void 0;
// Predefined pricing tiers for Indian market
exports.INDIAN_PRICING_TIERS = {
    STARTER: {
        id: 'indian-starter',
        name: 'STARTER',
        displayName: 'Starter Plan',
        monthlyBase: 19900, // ₹199
        setupFee: 0,
        outboundCallPerMinute: 75, // ₹0.75
        inboundCallPerMinute: 50, // ₹0.50
        smsOutbound: 25, // ₹0.25
        smsInbound: 10, // ₹0.10
        voicemailPerMessage: 200, // ₹2.00
        includedMinutes: 100,
        includedSMS: 50,
        features: [
            'Virtual Phone Number',
            'Call Forwarding',
            'Basic Voicemail',
            'SMS Support',
            'Email Support'
        ],
        isActive: true
    },
    BUSINESS: {
        id: 'indian-business',
        name: 'BUSINESS',
        displayName: 'Business Plan',
        monthlyBase: 39900, // ₹399
        setupFee: 0,
        outboundCallPerMinute: 50, // ₹0.50
        inboundCallPerMinute: 30, // ₹0.30
        smsOutbound: 20, // ₹0.20
        smsInbound: 5, // ₹0.05
        voicemailPerMessage: 150, // ₹1.50
        includedMinutes: 500,
        includedSMS: 200,
        features: [
            'Multiple Virtual Numbers',
            'Advanced Call Routing',
            'Custom Voicemail',
            'SMS & MMS Support',
            'Call Recording',
            'Priority Support',
            'Basic Analytics'
        ],
        isActive: true
    },
    ENTERPRISE: {
        id: 'indian-enterprise',
        name: 'ENTERPRISE',
        displayName: 'Enterprise Plan',
        monthlyBase: 99900, // ₹999
        setupFee: 0,
        outboundCallPerMinute: 25, // ₹0.25
        inboundCallPerMinute: 15, // ₹0.15
        smsOutbound: 10, // ₹0.10
        smsInbound: 5, // ₹0.05
        voicemailPerMessage: 100, // ₹1.00
        includedMinutes: 2000,
        includedSMS: 1000,
        features: [
            'Unlimited Virtual Numbers',
            'AI-Powered Call Routing',
            'Advanced Voicemail & Transcription',
            'Bulk SMS & MMS',
            'Call Recording & Analytics',
            'Dedicated Account Manager',
            'Advanced Analytics & Reporting',
            'API Access',
            'Custom Integrations'
        ],
        isActive: true
    }
};
// Volume discount configurations for Indian market
exports.INDIAN_VOLUME_DISCOUNTS = [
    {
        id: 'minutes-tier-1',
        tierName: 'High Volume Minutes',
        minUsage: 1000,
        maxUsage: 5000,
        discountPercent: 15,
        usageType: 'MINUTES',
        description: '15% discount on calls for 1000-5000 minutes/month'
    },
    {
        id: 'minutes-tier-2',
        tierName: 'Enterprise Minutes',
        minUsage: 5000,
        maxUsage: 10000,
        discountPercent: 25,
        usageType: 'MINUTES',
        description: '25% discount on calls for 5000-10000 minutes/month'
    },
    {
        id: 'minutes-tier-3',
        tierName: 'Bulk Minutes',
        minUsage: 10000,
        discountPercent: 40,
        usageType: 'MINUTES',
        description: '40% discount on calls for 10000+ minutes/month'
    },
    {
        id: 'sms-tier-1',
        tierName: 'High Volume SMS',
        minUsage: 1000,
        maxUsage: 5000,
        discountPercent: 20,
        usageType: 'SMS',
        description: '20% discount on SMS for 1000-5000 messages/month'
    },
    {
        id: 'sms-tier-2',
        tierName: 'Bulk SMS',
        minUsage: 5000,
        discountPercent: 35,
        usageType: 'SMS',
        description: '35% discount on SMS for 5000+ messages/month'
    },
    {
        id: 'spend-tier-1',
        tierName: 'Loyal Customer',
        minUsage: 500000, // ₹5000 in paise
        maxUsage: 1000000, // ₹10000 in paise
        discountPercent: 10,
        usageType: 'MONTHLY_SPEND',
        description: '10% discount for monthly spend ₹5000-₹10000'
    },
    {
        id: 'spend-tier-2',
        tierName: 'Premium Customer',
        minUsage: 1000000, // ₹10000 in paise
        discountPercent: 20,
        usageType: 'MONTHLY_SPEND',
        description: '20% discount for monthly spend ₹10000+'
    }
];
// GST configuration for Indian market
exports.INDIAN_GST_CONFIG = {
    rate: 0.18, // 18% GST
    cgstRate: 0.09, // 9% CGST
    sgstRate: 0.09, // 9% SGST
    igstRate: 0.18, // 18% IGST for interstate
    hsnCode: '9954', // HSN code for telecommunication services
    isInterstate: false // Will be determined based on customer location
};
