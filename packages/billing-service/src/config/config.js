"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    env: process.env.NODE_ENV || 'development',
    server: {
        port: parseInt(process.env.PORT || '3002', 10),
        host: process.env.HOST || 'localhost',
    },
    database: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/voxlink_billing',
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    cors: {
        allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    },
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    },
    billing: {
        defaultCurrency: 'USD',
        taxRate: parseFloat(process.env.TAX_RATE || '0.08'), // 8% default tax rate
        gracePeriodDays: parseInt(process.env.GRACE_PERIOD_DAYS || '7', 10),
        invoiceDueDays: parseInt(process.env.INVOICE_DUE_DAYS || '30', 10),
    },
    pdf: {
        storageUrl: process.env.PDF_STORAGE_URL || 'http://localhost:3002/invoices',
        storagePath: process.env.PDF_STORAGE_PATH || './storage/invoices',
    },
    pricing: {
        // Pricing in cents
        setupFee: parseInt(process.env.SETUP_FEE || '500', 10), // $5.00
        monthlyBase: parseInt(process.env.MONTHLY_BASE || '1000', 10), // $10.00
        inboundCallPerMinute: parseInt(process.env.INBOUND_CALL_PER_MINUTE || '2', 10), // $0.02
        outboundCallPerMinute: parseInt(process.env.OUTBOUND_CALL_PER_MINUTE || '3', 10), // $0.03
        smsInbound: parseInt(process.env.SMS_INBOUND || '1', 10), // $0.01
        smsOutbound: parseInt(process.env.SMS_OUTBOUND || '2', 10), // $0.02
        voicemailPerMessage: parseInt(process.env.VOICEMAIL_PER_MESSAGE || '5', 10), // $0.05
        callForwardingPerMinute: parseInt(process.env.CALL_FORWARDING_PER_MINUTE || '1', 10), // $0.01
    },
};
