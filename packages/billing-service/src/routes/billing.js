"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.billingRouter = void 0;
const express_1 = require("express");
const database_service_1 = require("../services/database.service");
const cost_calculator_service_1 = require("../services/cost-calculator.service");
const usage_tracking_service_1 = require("../services/usage-tracking.service");
const invoice_service_1 = require("../services/invoice.service");
const payment_service_1 = require("../services/payment.service");
const pdf_generation_service_1 = require("../services/pdf-generation.service");
const billing_cycle_service_1 = require("../services/billing-cycle.service");
const error_handler_1 = require("../middleware/error-handler");
exports.billingRouter = (0, express_1.Router)();
// Initialize services
const prisma = database_service_1.DatabaseService.getClient();
const costCalculator = new cost_calculator_service_1.CostCalculatorService();
const pdfGenerator = new pdf_generation_service_1.PDFGenerationService(costCalculator);
const usageTracking = new usage_tracking_service_1.UsageTrackingService(prisma, costCalculator);
const invoiceService = new invoice_service_1.InvoiceService(prisma, costCalculator, usageTracking, pdfGenerator);
const paymentService = new payment_service_1.PaymentService(prisma);
const billingCycleService = new billing_cycle_service_1.BillingCycleService(prisma, invoiceService, paymentService);
// Track usage event
exports.billingRouter.post('/usage', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { billingAccountId, numberId, eventType, duration, quantity, fromNumber, toNumber, metadata, timestamp, } = req.body;
    if (!billingAccountId || !numberId || !eventType) {
        throw new error_handler_1.ValidationError('billingAccountId, numberId, and eventType are required');
    }
    const usageEvent = await usageTracking.trackUsage({
        billingAccountId,
        numberId,
        eventType,
        duration,
        quantity,
        fromNumber,
        toNumber,
        metadata,
        timestamp: timestamp ? new Date(timestamp) : undefined,
    });
    res.status(201).json({
        success: true,
        data: usageEvent,
    });
}));
// Get usage statistics
exports.billingRouter.get('/usage/statistics', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { billingAccountId, startDate, endDate, numberId } = req.query;
    if (!billingAccountId || !startDate || !endDate) {
        throw new error_handler_1.ValidationError('billingAccountId, startDate, and endDate are required');
    }
    const statistics = await usageTracking.getUsageStatistics(billingAccountId, new Date(startDate), new Date(endDate), numberId);
    res.json({
        success: true,
        data: statistics,
    });
}));
// Get daily usage aggregation
exports.billingRouter.get('/usage/daily', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { billingAccountId, startDate, endDate } = req.query;
    if (!billingAccountId || !startDate || !endDate) {
        throw new error_handler_1.ValidationError('billingAccountId, startDate, and endDate are required');
    }
    const dailyUsage = await usageTracking.getDailyUsageAggregation(billingAccountId, new Date(startDate), new Date(endDate));
    res.json({
        success: true,
        data: dailyUsage,
    });
}));
// Generate invoice
exports.billingRouter.post('/invoices', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { billingAccountId, periodStart, periodEnd, dueDate } = req.body;
    if (!billingAccountId || !periodStart || !periodEnd) {
        throw new error_handler_1.ValidationError('billingAccountId, periodStart, and periodEnd are required');
    }
    const invoice = await invoiceService.generateInvoice({
        billingAccountId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        dueDate: dueDate ? new Date(dueDate) : undefined,
    });
    res.status(201).json({
        success: true,
        data: invoice,
    });
}));
// Get invoice by ID
exports.billingRouter.get('/invoices/:id', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const invoice = await invoiceService.getInvoice(id);
    if (!invoice) {
        throw new error_handler_1.NotFoundError('Invoice not found');
    }
    res.json({
        success: true,
        data: invoice,
    });
}));
// Get invoices for billing account
exports.billingRouter.get('/accounts/:accountId/invoices', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { accountId } = req.params;
    const { limit = '50', offset = '0' } = req.query;
    const result = await invoiceService.getInvoicesForAccount(accountId, parseInt(limit, 10), parseInt(offset, 10));
    res.json({
        success: true,
        data: result.invoices,
        pagination: {
            total: result.total,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
        },
    });
}));
// Generate invoice PDF
exports.billingRouter.post('/invoices/:id/pdf', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const pdfUrl = await invoiceService.generateInvoicePDF(id);
    res.json({
        success: true,
        data: { pdfUrl },
    });
}));
// Create payment method
exports.billingRouter.post('/payment-methods', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { billingAccountId, stripePaymentMethodId, isDefault } = req.body;
    if (!billingAccountId || !stripePaymentMethodId) {
        throw new error_handler_1.ValidationError('billingAccountId and stripePaymentMethodId are required');
    }
    const paymentMethod = await paymentService.createPaymentMethod({
        billingAccountId,
        stripePaymentMethodId,
        isDefault,
    });
    res.status(201).json({
        success: true,
        data: paymentMethod,
    });
}));
// Get payment methods for billing account
exports.billingRouter.get('/accounts/:accountId/payment-methods', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { accountId } = req.params;
    const paymentMethods = await paymentService.getPaymentMethods(accountId);
    res.json({
        success: true,
        data: paymentMethods,
    });
}));
// Process payment
exports.billingRouter.post('/payments', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { invoiceId, paymentMethodId } = req.body;
    if (!invoiceId) {
        throw new error_handler_1.ValidationError('invoiceId is required');
    }
    const result = await paymentService.processPayment({
        invoiceId,
        paymentMethodId,
    });
    if (result.success) {
        res.json({
            success: true,
            data: result.payment,
        });
    }
    else {
        res.status(400).json({
            success: false,
            error: result.error,
        });
    }
}));
// Delete payment method
exports.billingRouter.delete('/payment-methods/:id', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await paymentService.deletePaymentMethod(id);
    res.json({
        success: true,
        message: 'Payment method deleted successfully',
    });
}));
// Get billing cycles for account
exports.billingRouter.get('/accounts/:accountId/cycles', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { accountId } = req.params;
    const { limit = '50', offset = '0' } = req.query;
    const result = await billingCycleService.getBillingCycles(accountId, parseInt(limit, 10), parseInt(offset, 10));
    res.json({
        success: true,
        data: result.cycles,
        pagination: {
            total: result.total,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
        },
    });
}));
// Get current billing cycle
exports.billingRouter.get('/accounts/:accountId/cycles/current', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { accountId } = req.params;
    const cycle = await billingCycleService.getCurrentBillingCycle(accountId);
    res.json({
        success: true,
        data: cycle,
    });
}));
// Get pricing information
exports.billingRouter.get('/pricing', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const pricing = costCalculator.getPricingInfo();
    res.json({
        success: true,
        data: pricing,
    });
}));
// Calculate cost for usage event (preview)
exports.billingRouter.post('/pricing/calculate', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { eventType, duration, quantity, metadata } = req.body;
    if (!eventType) {
        throw new error_handler_1.ValidationError('eventType is required');
    }
    const cost = costCalculator.calculateUsageCost({
        eventType,
        duration,
        quantity,
        metadata,
    });
    res.json({
        success: true,
        data: cost,
    });
}));
