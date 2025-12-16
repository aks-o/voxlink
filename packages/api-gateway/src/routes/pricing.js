"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const region_detection_middleware_1 = require("../middleware/region-detection.middleware");
const router = (0, express_1.Router)();
// Apply region detection to all pricing routes
router.use(region_detection_middleware_1.regionDetectionMiddleware);
/**
 * GET /pricing/tiers
 * Get available pricing tiers for the detected region
 */
router.get('/tiers', async (req, res) => {
    try {
        const region = req.region || 'US';
        // Mock pricing tiers (in production, this would come from the regional pricing service)
        const pricingTiers = getPricingTiersForRegion(region);
        res.json({
            region,
            detectedFrom: req.detectedFrom,
            currency: getCurrencyForRegion(region),
            tiers: pricingTiers,
        });
    }
    catch (error) {
        console.error('Error fetching pricing tiers:', error);
        res.status(500).json({ error: 'Failed to fetch pricing tiers' });
    }
});
/**
 * POST /pricing/calculate
 * Calculate cost for a specific usage event
 */
router.post('/calculate', async (req, res) => {
    try {
        const region = req.region || 'US';
        const { eventType, duration, quantity } = req.body;
        if (!eventType) {
            return res.status(400).json({ error: 'eventType is required' });
        }
        // Mock cost calculation (in production, this would use the regional pricing service)
        const costResult = calculateCostForRegion(region, eventType, duration, quantity);
        res.json({
            region,
            detectedFrom: req.detectedFrom,
            calculation: costResult,
        });
    }
    catch (error) {
        console.error('Error calculating cost:', error);
        res.status(500).json({ error: 'Failed to calculate cost' });
    }
});
/**
 * GET /pricing/compare
 * Compare pricing between regions
 */
router.get('/compare', async (req, res) => {
    try {
        const { eventType = 'OUTBOUND_CALL', duration = 60, quantity = 1 } = req.query;
        const regions = ['IN', 'US'];
        const comparison = regions.map(region => {
            const cost = calculateCostForRegion(region, eventType, Number(duration), Number(quantity));
            return {
                region,
                currency: getCurrencyForRegion(region),
                cost,
            };
        });
        res.json({
            eventType,
            duration: Number(duration),
            quantity: Number(quantity),
            comparison,
            detectedRegion: req.region,
        });
    }
    catch (error) {
        console.error('Error comparing pricing:', error);
        res.status(500).json({ error: 'Failed to compare pricing' });
    }
});
/**
 * GET /pricing/region-info
 * Get detailed information about the detected region
 */
router.get('/region-info', (req, res) => {
    const region = req.region || 'US';
    res.json({
        detectedRegion: region,
        detectionMethod: req.detectedFrom,
        currency: getCurrencyForRegion(region),
        locale: getLocaleForRegion(region),
        timezone: getTimezoneForRegion(region),
        supportedFeatures: getSupportedFeaturesForRegion(region),
    });
});
// Helper functions (mock implementations)
function getPricingTiersForRegion(region) {
    if (region === 'IN') {
        return {
            STARTER: {
                name: 'Starter',
                monthlyBase: 199, // ₹199
                setupFee: 0,
                rates: {
                    outboundCallPerMinute: 0.75, // ₹0.75
                    inboundCallPerMinute: 0.50, // ₹0.50
                    smsOutbound: 0.25, // ₹0.25
                    smsInbound: 0.10, // ₹0.10
                },
                includedAllowances: {
                    minutes: 100,
                    sms: 50,
                },
            },
            BUSINESS: {
                name: 'Business',
                monthlyBase: 399, // ₹399
                setupFee: 0,
                rates: {
                    outboundCallPerMinute: 0.50, // ₹0.50
                    inboundCallPerMinute: 0.30, // ₹0.30
                    smsOutbound: 0.20, // ₹0.20
                    smsInbound: 0.05, // ₹0.05
                },
                includedAllowances: {
                    minutes: 500,
                    sms: 200,
                },
            },
            ENTERPRISE: {
                name: 'Enterprise',
                monthlyBase: 999, // ₹999
                setupFee: 0,
                rates: {
                    outboundCallPerMinute: 0.25, // ₹0.25
                    inboundCallPerMinute: 0.15, // ₹0.15
                    smsOutbound: 0.10, // ₹0.10
                    smsInbound: 0.05, // ₹0.05
                },
                includedAllowances: {
                    minutes: 2000,
                    sms: 1000,
                },
            },
        };
    }
    // US pricing
    return {
        STANDARD: {
            name: 'Standard',
            monthlyBase: 10, // $10
            setupFee: 5, // $5
            rates: {
                outboundCallPerMinute: 0.03, // $0.03
                inboundCallPerMinute: 0.02, // $0.02
                smsOutbound: 0.02, // $0.02
                smsInbound: 0.01, // $0.01
            },
            includedAllowances: {
                minutes: 0,
                sms: 0,
            },
        },
    };
}
function calculateCostForRegion(region, eventType, duration, quantity) {
    const pricing = getPricingTiersForRegion(region);
    const tier = Object.values(pricing)[0]; // Use first tier for calculation
    let unitCost = 0;
    let totalCost = 0;
    let calculatedQuantity = quantity || 1;
    let description = '';
    switch (eventType) {
        case 'OUTBOUND_CALL':
            const minutes = Math.ceil((duration || 60) / 60);
            unitCost = tier.rates.outboundCallPerMinute;
            totalCost = unitCost * minutes;
            calculatedQuantity = minutes;
            description = `Outbound call (${minutes} min)`;
            break;
        case 'INBOUND_CALL':
            const inboundMinutes = Math.ceil((duration || 60) / 60);
            unitCost = tier.rates.inboundCallPerMinute;
            totalCost = unitCost * inboundMinutes;
            calculatedQuantity = inboundMinutes;
            description = `Inbound call (${inboundMinutes} min)`;
            break;
        case 'SMS_SENT':
            unitCost = tier.rates.smsOutbound;
            totalCost = unitCost * calculatedQuantity;
            description = 'SMS sent';
            break;
        case 'SMS_RECEIVED':
            unitCost = tier.rates.smsInbound;
            totalCost = unitCost * calculatedQuantity;
            description = 'SMS received';
            break;
        case 'MONTHLY_SUBSCRIPTION':
            unitCost = tier.monthlyBase;
            totalCost = unitCost * calculatedQuantity;
            description = 'Monthly subscription';
            break;
        default:
            throw new Error(`Unknown event type: ${eventType}`);
    }
    return {
        eventType,
        unitCost,
        totalCost,
        quantity: calculatedQuantity,
        description,
        currency: getCurrencyForRegion(region),
        formattedCost: formatCurrency(totalCost, region),
    };
}
function getCurrencyForRegion(region) {
    const currencies = {
        IN: 'INR',
        US: 'USD',
        EU: 'EUR',
        GLOBAL: 'USD',
    };
    return currencies[region] || 'USD';
}
function getLocaleForRegion(region) {
    const locales = {
        IN: 'en-IN',
        US: 'en-US',
        EU: 'en-GB',
        GLOBAL: 'en-US',
    };
    return locales[region] || 'en-US';
}
function getTimezoneForRegion(region) {
    const timezones = {
        IN: 'Asia/Kolkata',
        US: 'America/New_York',
        EU: 'Europe/London',
        GLOBAL: 'UTC',
    };
    return timezones[region] || 'UTC';
}
function getSupportedFeaturesForRegion(region) {
    const features = {
        IN: {
            paymentMethods: ['UPI', 'Net Banking', 'Credit Card', 'Razorpay'],
            languages: ['English', 'Hindi'],
            compliance: ['GST', 'Data Localization'],
            support: ['24/7 India Timezone', 'WhatsApp', 'Phone'],
        },
        US: {
            paymentMethods: ['Credit Card', 'ACH', 'PayPal', 'Stripe'],
            languages: ['English'],
            compliance: ['PCI DSS', 'GDPR'],
            support: ['24/7 US Timezone', 'Email', 'Phone'],
        },
        EU: {
            paymentMethods: ['Credit Card', 'SEPA', 'PayPal'],
            languages: ['English', 'German', 'French'],
            compliance: ['GDPR', 'PCI DSS'],
            support: ['Business Hours EU', 'Email', 'Phone'],
        },
        GLOBAL: {
            paymentMethods: ['Credit Card', 'PayPal'],
            languages: ['English'],
            compliance: ['PCI DSS'],
            support: ['Email'],
        },
    };
    return features[region] || features.GLOBAL;
}
function formatCurrency(amount, region) {
    const currency = getCurrencyForRegion(region);
    const locale = getLocaleForRegion(region);
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
    }).format(amount);
}
exports.default = router;
