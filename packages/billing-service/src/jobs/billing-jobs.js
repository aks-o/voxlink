"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const database_service_1 = require("../services/database.service");
const cost_calculator_service_1 = require("../services/cost-calculator.service");
const usage_tracking_service_1 = require("../services/usage-tracking.service");
const invoice_service_1 = require("../services/invoice.service");
const payment_service_1 = require("../services/payment.service");
const pdf_generation_service_1 = require("../services/pdf-generation.service");
const billing_cycle_service_1 = require("../services/billing-cycle.service");
const logger_1 = require("../utils/logger");
class BillingJobs {
    constructor() {
        const prisma = database_service_1.DatabaseService.getClient();
        const costCalculator = new cost_calculator_service_1.CostCalculatorService();
        const pdfGenerator = new pdf_generation_service_1.PDFGenerationService(costCalculator);
        const usageTracking = new usage_tracking_service_1.UsageTrackingService(prisma, costCalculator);
        const paymentService = new payment_service_1.PaymentService(prisma);
        this.invoiceService = new invoice_service_1.InvoiceService(prisma, costCalculator, usageTracking, pdfGenerator);
        this.billingCycleService = new billing_cycle_service_1.BillingCycleService(prisma, this.invoiceService, paymentService);
    }
    /**
     * Start all scheduled jobs
     */
    start() {
        logger_1.logger.info('Starting billing jobs');
        // Process billing cycles daily at 2 AM
        node_cron_1.default.schedule('0 2 * * *', async () => {
            logger_1.logger.info('Starting scheduled billing cycle processing');
            try {
                await this.billingCycleService.processBillingCycles();
                logger_1.logger.info('Scheduled billing cycle processing completed');
            }
            catch (error) {
                logger_1.logger.error('Scheduled billing cycle processing failed', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        });
        // Handle overdue invoices daily at 3 AM
        node_cron_1.default.schedule('0 3 * * *', async () => {
            logger_1.logger.info('Starting overdue invoice processing');
            try {
                await this.billingCycleService.handleOverdueInvoices();
                logger_1.logger.info('Overdue invoice processing completed');
            }
            catch (error) {
                logger_1.logger.error('Overdue invoice processing failed', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        });
        // Retry failed billing cycles every 6 hours
        node_cron_1.default.schedule('0 */6 * * *', async () => {
            logger_1.logger.info('Starting failed billing cycle retry');
            try {
                await this.billingCycleService.retryFailedBillingCycles();
                logger_1.logger.info('Failed billing cycle retry completed');
            }
            catch (error) {
                logger_1.logger.error('Failed billing cycle retry failed', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        });
        // Generate PDFs for invoices without PDFs every hour
        node_cron_1.default.schedule('0 * * * *', async () => {
            logger_1.logger.info('Starting PDF generation for invoices');
            try {
                await this.generateMissingInvoicePDFs();
                logger_1.logger.info('PDF generation completed');
            }
            catch (error) {
                logger_1.logger.error('PDF generation failed', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        });
        logger_1.logger.info('Billing jobs started successfully');
    }
    /**
     * Generate PDFs for invoices that don't have them
     */
    async generateMissingInvoicePDFs() {
        const prisma = database_service_1.DatabaseService.getClient();
        // Find invoices without PDFs
        const invoicesWithoutPDF = await prisma.invoice.findMany({
            where: {
                pdfUrl: null,
                status: {
                    in: ['SENT', 'PAID', 'OVERDUE'],
                },
            },
            take: 10, // Limit to avoid overwhelming the system
            orderBy: { createdAt: 'desc' },
        });
        logger_1.logger.info('Found invoices without PDFs', {
            count: invoicesWithoutPDF.length,
        });
        for (const invoice of invoicesWithoutPDF) {
            try {
                await this.invoiceService.generateInvoicePDF(invoice.id);
                logger_1.logger.info('PDF generated for invoice', {
                    invoiceId: invoice.id,
                    invoiceNumber: invoice.invoiceNumber,
                });
            }
            catch (error) {
                logger_1.logger.error('Failed to generate PDF for invoice', {
                    invoiceId: invoice.id,
                    invoiceNumber: invoice.invoiceNumber,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
    }
    /**
     * Stop all scheduled jobs
     */
    stop() {
        node_cron_1.default.getTasks().forEach((task) => {
            task.stop();
        });
        logger_1.logger.info('Billing jobs stopped');
    }
}
exports.BillingJobs = BillingJobs;
