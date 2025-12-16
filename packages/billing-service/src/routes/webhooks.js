"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhooksRouter = void 0;
const express_1 = require("express");
const stripe_1 = __importDefault(require("stripe"));
const database_service_1 = require("../services/database.service");
const payment_service_1 = require("../services/payment.service");
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
exports.webhooksRouter = (0, express_1.Router)();
const stripe = new stripe_1.default(config_1.config.stripe.secretKey, {
    apiVersion: '2023-10-16',
});
const prisma = database_service_1.DatabaseService.getClient();
const paymentService = new payment_service_1.PaymentService(prisma);
// Stripe webhook endpoint
exports.webhooksRouter.post('/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    if (!sig) {
        logger_1.logger.warn('Missing Stripe signature header');
        return res.status(400).send('Missing signature header');
    }
    let event;
    try {
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(req.body, sig, config_1.config.stripe.webhookSecret);
    }
    catch (error) {
        logger_1.logger.error('Webhook signature verification failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    try {
        // Handle the event
        await paymentService.handleWebhook(event);
        logger_1.logger.info('Webhook processed successfully', {
            eventType: event.type,
            eventId: event.id,
        });
        res.json({ received: true });
    }
    catch (error) {
        logger_1.logger.error('Failed to process webhook', {
            error: error instanceof Error ? error.message : 'Unknown error',
            eventType: event.type,
            eventId: event.id,
        });
        res.status(500).json({
            error: 'Failed to process webhook',
            eventId: event.id,
        });
    }
});
