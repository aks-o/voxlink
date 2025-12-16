import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/database.service';
import { CostCalculatorService } from '../services/cost-calculator.service';
import { UsageTrackingService } from '../services/usage-tracking.service';
import { InvoiceService } from '../services/invoice.service';
import { PaymentService } from '../services/payment.service';
import { PDFGenerationService } from '../services/pdf-generation.service';
import { BillingCycleService } from '../services/billing-cycle.service';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error-handler';

export const billingRouter = Router();

// Initialize services
const prisma = DatabaseService.getClient();
const costCalculator = new CostCalculatorService();
const pdfGenerator = new PDFGenerationService(costCalculator);
const usageTracking = new UsageTrackingService(prisma, costCalculator);
const invoiceService = new InvoiceService(prisma, costCalculator, usageTracking, pdfGenerator);
const paymentService = new PaymentService(prisma);
const billingCycleService = new BillingCycleService(prisma, invoiceService, paymentService);

// Track usage event
billingRouter.post('/usage', asyncHandler(async (req: Request, res: Response) => {
  const {
    billingAccountId,
    numberId,
    eventType,
    duration,
    quantity,
    fromNumber,
    toNumber,
    metadata,
    timestamp,
  } = req.body;

  if (!billingAccountId || !numberId || !eventType) {
    throw new ValidationError('billingAccountId, numberId, and eventType are required');
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
billingRouter.get('/usage/statistics', asyncHandler(async (req: Request, res: Response) => {
  const { billingAccountId, startDate, endDate, numberId } = req.query;

  if (!billingAccountId || !startDate || !endDate) {
    throw new ValidationError('billingAccountId, startDate, and endDate are required');
  }

  const statistics = await usageTracking.getUsageStatistics(
    billingAccountId as string,
    new Date(startDate as string),
    new Date(endDate as string),
    numberId as string | undefined
  );

  res.json({
    success: true,
    data: statistics,
  });
}));

// Get daily usage aggregation
billingRouter.get('/usage/daily', asyncHandler(async (req: Request, res: Response) => {
  const { billingAccountId, startDate, endDate } = req.query;

  if (!billingAccountId || !startDate || !endDate) {
    throw new ValidationError('billingAccountId, startDate, and endDate are required');
  }

  const dailyUsage = await usageTracking.getDailyUsageAggregation(
    billingAccountId as string,
    new Date(startDate as string),
    new Date(endDate as string)
  );

  res.json({
    success: true,
    data: dailyUsage,
  });
}));

// Generate invoice
billingRouter.post('/invoices', asyncHandler(async (req: Request, res: Response) => {
  const { billingAccountId, periodStart, periodEnd, dueDate } = req.body;

  if (!billingAccountId || !periodStart || !periodEnd) {
    throw new ValidationError('billingAccountId, periodStart, and periodEnd are required');
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
billingRouter.get('/invoices/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const invoice = await invoiceService.getInvoice(id);
  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }

  res.json({
    success: true,
    data: invoice,
  });
}));

// Get invoices for billing account
billingRouter.get('/accounts/:accountId/invoices', asyncHandler(async (req: Request, res: Response) => {
  const { accountId } = req.params;
  const { limit = '50', offset = '0' } = req.query;

  const result = await invoiceService.getInvoicesForAccount(
    accountId,
    parseInt(limit as string, 10),
    parseInt(offset as string, 10)
  );

  res.json({
    success: true,
    data: result.invoices,
    pagination: {
      total: result.total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    },
  });
}));

// Generate invoice PDF
billingRouter.post('/invoices/:id/pdf', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const pdfUrl = await invoiceService.generateInvoicePDF(id);

  res.json({
    success: true,
    data: { pdfUrl },
  });
}));

// Create payment method
billingRouter.post('/payment-methods', asyncHandler(async (req: Request, res: Response) => {
  const { billingAccountId, stripePaymentMethodId, isDefault } = req.body;

  if (!billingAccountId || !stripePaymentMethodId) {
    throw new ValidationError('billingAccountId and stripePaymentMethodId are required');
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
billingRouter.get('/accounts/:accountId/payment-methods', asyncHandler(async (req: Request, res: Response) => {
  const { accountId } = req.params;

  const paymentMethods = await paymentService.getPaymentMethods(accountId);

  res.json({
    success: true,
    data: paymentMethods,
  });
}));

// Process payment
billingRouter.post('/payments', asyncHandler(async (req: Request, res: Response) => {
  const { invoiceId, paymentMethodId } = req.body;

  if (!invoiceId) {
    throw new ValidationError('invoiceId is required');
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
  } else {
    res.status(400).json({
      success: false,
      error: result.error,
    });
  }
}));

// Delete payment method
billingRouter.delete('/payment-methods/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await paymentService.deletePaymentMethod(id);

  res.json({
    success: true,
    message: 'Payment method deleted successfully',
  });
}));

// Get billing cycles for account
billingRouter.get('/accounts/:accountId/cycles', asyncHandler(async (req: Request, res: Response) => {
  const { accountId } = req.params;
  const { limit = '50', offset = '0' } = req.query;

  const result = await billingCycleService.getBillingCycles(
    accountId,
    parseInt(limit as string, 10),
    parseInt(offset as string, 10)
  );

  res.json({
    success: true,
    data: result.cycles,
    pagination: {
      total: result.total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    },
  });
}));

// Get current billing cycle
billingRouter.get('/accounts/:accountId/cycles/current', asyncHandler(async (req: Request, res: Response) => {
  const { accountId } = req.params;

  const cycle = await billingCycleService.getCurrentBillingCycle(accountId);

  res.json({
    success: true,
    data: cycle,
  });
}));

// Get pricing information
billingRouter.get('/pricing', asyncHandler(async (req: Request, res: Response) => {
  const pricing = costCalculator.getPricingInfo();

  res.json({
    success: true,
    data: pricing,
  });
}));

// Calculate cost for usage event (preview)
billingRouter.post('/pricing/calculate', asyncHandler(async (req: Request, res: Response) => {
  const { eventType, duration, quantity, metadata } = req.body;

  if (!eventType) {
    throw new ValidationError('eventType is required');
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