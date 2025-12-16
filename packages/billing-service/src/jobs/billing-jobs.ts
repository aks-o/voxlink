import cron from 'node-cron';
import { DatabaseService } from '../services/database.service';
import { CostCalculatorService } from '../services/cost-calculator.service';
import { UsageTrackingService } from '../services/usage-tracking.service';
import { InvoiceService } from '../services/invoice.service';
import { PaymentService } from '../services/payment.service';
import { PDFGenerationService } from '../services/pdf-generation.service';
import { BillingCycleService } from '../services/billing-cycle.service';
import { logger } from '../utils/logger';

export class BillingJobs {
  private billingCycleService: BillingCycleService;
  private invoiceService: InvoiceService;

  constructor() {
    const prisma = DatabaseService.getClient();
    const costCalculator = new CostCalculatorService();
    const pdfGenerator = new PDFGenerationService(costCalculator);
    const usageTracking = new UsageTrackingService(prisma, costCalculator);
    const paymentService = new PaymentService(prisma);
    
    this.invoiceService = new InvoiceService(prisma, costCalculator, usageTracking, pdfGenerator);
    this.billingCycleService = new BillingCycleService(prisma, this.invoiceService, paymentService);
  }

  /**
   * Start all scheduled jobs
   */
  start(): void {
    logger.info('Starting billing jobs');

    // Process billing cycles daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      logger.info('Starting scheduled billing cycle processing');
      try {
        await this.billingCycleService.processBillingCycles();
        logger.info('Scheduled billing cycle processing completed');
      } catch (error) {
        logger.error('Scheduled billing cycle processing failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Handle overdue invoices daily at 3 AM
    cron.schedule('0 3 * * *', async () => {
      logger.info('Starting overdue invoice processing');
      try {
        await this.billingCycleService.handleOverdueInvoices();
        logger.info('Overdue invoice processing completed');
      } catch (error) {
        logger.error('Overdue invoice processing failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Retry failed billing cycles every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      logger.info('Starting failed billing cycle retry');
      try {
        await this.billingCycleService.retryFailedBillingCycles();
        logger.info('Failed billing cycle retry completed');
      } catch (error) {
        logger.error('Failed billing cycle retry failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Generate PDFs for invoices without PDFs every hour
    cron.schedule('0 * * * *', async () => {
      logger.info('Starting PDF generation for invoices');
      try {
        await this.generateMissingInvoicePDFs();
        logger.info('PDF generation completed');
      } catch (error) {
        logger.error('PDF generation failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    logger.info('Billing jobs started successfully');
  }

  /**
   * Generate PDFs for invoices that don't have them
   */
  private async generateMissingInvoicePDFs(): Promise<void> {
    const prisma = DatabaseService.getClient();
    
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

    logger.info('Found invoices without PDFs', {
      count: invoicesWithoutPDF.length,
    });

    for (const invoice of invoicesWithoutPDF) {
      try {
        await this.invoiceService.generateInvoicePDF(invoice.id);
        logger.info('PDF generated for invoice', {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
        });
      } catch (error) {
        logger.error('Failed to generate PDF for invoice', {
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
  stop(): void {
    cron.getTasks().forEach((task) => {
      task.stop();
    });
    logger.info('Billing jobs stopped');
  }
}