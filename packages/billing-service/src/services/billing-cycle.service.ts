import { PrismaClient, BillingAccount, BillingCycle } from '@prisma/client';
import { InvoiceService } from './invoice.service';
import { PaymentService } from './payment.service';
import { logger } from '../utils/logger';
import { config } from '../config/config';

export class BillingCycleService {
  constructor(
    private prisma: PrismaClient,
    private invoiceService: InvoiceService,
    private paymentService: PaymentService
  ) { }

  /**
   * Process billing cycles for accounts due for billing
   */
  async processBillingCycles(): Promise<void> {
    try {
      const accountsDue = await this.getAccountsDueForBilling();

      logger.info('Processing billing cycles', {
        accountCount: accountsDue.length,
      });

      for (const account of accountsDue) {
        await this.processBillingCycleForAccount(account);
      }

      logger.info('Billing cycles processing completed', {
        processedCount: accountsDue.length,
      });
    } catch (error) {
      logger.error('Failed to process billing cycles', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Process billing cycle for a specific account
   */
  async processBillingCycleForAccount(account: BillingAccount): Promise<void> {
    try {
      // Calculate billing period
      const periodEnd = new Date(account.nextBillingDate);
      const periodStart = this.calculatePeriodStart(periodEnd, account.billingPeriod);

      // Check if billing cycle already exists
      const existingCycle = await this.prisma.billingCycle.findFirst({
        where: {
          billingAccountId: account.id,
          periodStart,
          periodEnd,
        },
      });

      if (existingCycle) {
        logger.info('Billing cycle already exists', {
          billingAccountId: account.id,
          cycleId: existingCycle.id,
        });
        return;
      }

      // Create billing cycle record
      const billingCycle = await this.prisma.billingCycle.create({
        data: {
          billingAccountId: account.id,
          periodStart,
          periodEnd,
          status: 'processing',
        },
      });

      try {
        // Generate invoice for the period
        const invoice = await this.invoiceService.generateInvoice({
          billingAccountId: account.id,
          periodStart,
          periodEnd,
        });

        // Update billing cycle with invoice
        await this.prisma.billingCycle.update({
          where: { id: billingCycle.id },
          data: {
            invoiceId: invoice.id,
            status: 'completed',
            processedAt: new Date(),
          },
        });

        // Update next billing date
        const nextBillingDate = this.calculateNextBillingDate(periodEnd, account.billingPeriod);
        await this.prisma.billingAccount.update({
          where: { id: account.id },
          data: { nextBillingDate },
        });

        // Attempt automatic payment if default payment method exists
        await this.attemptAutomaticPayment(invoice.id);

        logger.info('Billing cycle processed successfully', {
          billingAccountId: account.id,
          cycleId: billingCycle.id,
          invoiceId: invoice.id,
          nextBillingDate,
        });
      } catch (error) {
        // Mark billing cycle as failed
        await this.prisma.billingCycle.update({
          where: { id: billingCycle.id },
          data: {
            status: 'failed',
            processedAt: new Date(),
          },
        });

        logger.error('Failed to process billing cycle', {
          billingAccountId: account.id,
          cycleId: billingCycle.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        throw error;
      }
    } catch (error) {
      logger.error('Failed to process billing cycle for account', {
        billingAccountId: account.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get accounts due for billing
   */
  private async getAccountsDueForBilling(): Promise<BillingAccount[]> {
    const now = new Date();

    return this.prisma.billingAccount.findMany({
      where: {
        nextBillingDate: {
          lte: now,
        },
      },
      orderBy: { nextBillingDate: 'asc' },
    });
  }

  /**
   * Calculate period start date based on period end and billing period
   */
  private calculatePeriodStart(periodEnd: Date, billingPeriod: string): Date {
    const start = new Date(periodEnd);

    switch (billingPeriod) {
      case 'MONTHLY':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'QUARTERLY':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'YEARLY':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        throw new Error(`Unknown billing period: ${billingPeriod}`);
    }

    return start;
  }

  /**
   * Calculate next billing date
   */
  private calculateNextBillingDate(currentDate: Date, billingPeriod: string): Date {
    const next = new Date(currentDate);

    switch (billingPeriod) {
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'QUARTERLY':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'YEARLY':
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        throw new Error(`Unknown billing period: ${billingPeriod}`);
    }

    return next;
  }

  /**
   * Attempt automatic payment for an invoice
   */
  private async attemptAutomaticPayment(invoiceId: string): Promise<void> {
    try {
      const result = await this.paymentService.processPayment({ invoiceId });

      if (result.success) {
        logger.info('Automatic payment processed successfully', {
          invoiceId,
          paymentId: result.payment?.id,
        });
      } else {
        logger.warn('Automatic payment failed', {
          invoiceId,
          error: result.error,
        });
      }
    } catch (error) {
      logger.warn('Failed to attempt automatic payment', {
        invoiceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw error - billing cycle should still complete
    }
  }

  /**
   * Get billing cycles for an account
   */
  async getBillingCycles(
    billingAccountId: string,
    limit = 50,
    offset = 0
  ): Promise<{ cycles: BillingCycle[]; total: number }> {
    const [cycles, total] = await Promise.all([
      this.prisma.billingCycle.findMany({
        where: { billingAccountId },
        orderBy: { periodEnd: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.billingCycle.count({
        where: { billingAccountId },
      }),
    ]);

    return { cycles, total };
  }

  /**
   * Get current billing cycle for an account
   */
  async getCurrentBillingCycle(billingAccountId: string): Promise<BillingCycle | null> {
    const now = new Date();

    return this.prisma.billingCycle.findFirst({
      where: {
        billingAccountId,
        periodStart: { lte: now },
        periodEnd: { gte: now },
      },
    });
  }

  /**
   * Retry failed billing cycles
   */
  async retryFailedBillingCycles(): Promise<void> {
    const failedCycles = await this.prisma.billingCycle.findMany({
      where: { status: 'failed' },
      orderBy: { createdAt: 'asc' },
      take: 10, // Limit retries to avoid overwhelming the system
    });

    logger.info('Retrying failed billing cycles', {
      count: failedCycles.length,
    });

    for (const cycle of failedCycles) {
      try {
        // Get billing account for this cycle
        const billingAccount = await this.prisma.billingAccount.findUnique({
          where: { id: cycle.billingAccountId },
        });

        if (!billingAccount) {
          logger.warn('Billing account not found for cycle', {
            cycleId: cycle.id,
            billingAccountId: cycle.billingAccountId,
          });
          continue;
        }

        // Mark as processing
        await this.prisma.billingCycle.update({
          where: { id: cycle.id },
          data: { status: 'processing' },
        });

        // Retry processing
        await this.processBillingCycleForAccount(billingAccount);

        logger.info('Failed billing cycle retried successfully', {
          cycleId: cycle.id,
          billingAccountId: cycle.billingAccountId,
        });
      } catch (error) {
        logger.error('Failed to retry billing cycle', {
          cycleId: cycle.id,
          billingAccountId: cycle.billingAccountId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        // Mark as failed again
        await this.prisma.billingCycle.update({
          where: { id: cycle.id },
          data: { status: 'failed' },
        });
      }
    }
  }

  /**
   * Mark overdue invoices and handle grace period
   */
  async handleOverdueInvoices(): Promise<void> {
    try {
      // Mark overdue invoices
      const overdueCount = await this.invoiceService.markOverdueInvoices();

      if (overdueCount > 0) {
        logger.info('Marked invoices as overdue', { count: overdueCount });
      }

      // Handle accounts with invoices past grace period
      await this.handleGracePeriodExpired();
    } catch (error) {
      logger.error('Failed to handle overdue invoices', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle accounts with invoices past grace period
   */
  private async handleGracePeriodExpired(): Promise<void> {
    const gracePeriodDate = new Date();
    gracePeriodDate.setDate(gracePeriodDate.getDate() - config.billing.gracePeriodDays);

    const expiredInvoices = await this.prisma.invoice.findMany({
      where: {
        status: 'OVERDUE',
        dueDate: {
          lt: gracePeriodDate,
        },
      },
      include: { billingAccount: true },
    });

    for (const invoice of expiredInvoices) {
      // Here you could implement account suspension logic
      logger.warn('Invoice past grace period', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        billingAccountId: invoice.billingAccountId,
        dueDate: invoice.dueDate,
        gracePeriodExpired: gracePeriodDate,
      });

      // TODO: Implement account suspension or other actions
      // This could include:
      // - Suspending services
      // - Sending final notices
      // - Escalating to collections
    }
  }
}
