import { PrismaClient, Invoice, InvoiceItem, BillingAccount, UsageEvent } from '@prisma/client';
import { CostCalculatorService } from './cost-calculator.service';
import { UsageTrackingService } from './usage-tracking.service';
import { PDFGenerationService } from './pdf-generation.service';
import { logger } from '../utils/logger';
import { config } from '../config/config';

export interface CreateInvoiceInput {
  billingAccountId: string;
  periodStart: Date;
  periodEnd: Date;
  dueDate?: Date;
}

export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
  billingAccount: BillingAccount;
}

export class InvoiceService {
  constructor(
    private prisma: PrismaClient,
    private costCalculator: CostCalculatorService,
    private usageTracking: UsageTrackingService,
    private pdfGenerator: PDFGenerationService
  ) {}

  /**
   * Generate invoice for a billing period
   */
  async generateInvoice(input: CreateInvoiceInput): Promise<InvoiceWithItems> {
    const { billingAccountId, periodStart, periodEnd, dueDate } = input;

    try {
      // Get billing account
      const billingAccount = await this.prisma.billingAccount.findUnique({
        where: { id: billingAccountId },
      });

      if (!billingAccount) {
        throw new Error(`Billing account not found: ${billingAccountId}`);
      }

      // Calculate due date if not provided
      const invoiceDueDate = dueDate || new Date(Date.now() + config.billing.invoiceDueDays * 24 * 60 * 60 * 1000);

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Get uninvoiced usage events for the period
      const usageEvents = await this.usageTracking.getUninvoicedUsage(
        billingAccountId,
        periodStart,
        periodEnd
      );

      // Create invoice
      const invoice = await this.prisma.invoice.create({
        data: {
          billingAccountId,
          invoiceNumber,
          status: 'DRAFT',
          periodStart,
          periodEnd,
          subtotal: 0,
          tax: 0,
          total: 0,
          dueDate: invoiceDueDate,
        },
        include: {
          billingAccount: true,
          items: true,
        },
      });

      // Group usage events by type and number for invoice items
      const invoiceItems = await this.createInvoiceItems(invoice.id, usageEvents);

      // Calculate totals
      const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
      const tax = this.costCalculator.calculateTax(subtotal);
      const total = subtotal + tax;

      // Update invoice with totals
      const updatedInvoice = await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          subtotal,
          tax,
          total,
          status: 'SENT',
        },
        include: {
          billingAccount: true,
          items: true,
        },
      });

      // Mark usage events as invoiced
      if (usageEvents.length > 0) {
        const usageEventIds = usageEvents.map(event => event.id);
        await this.usageTracking.markAsInvoiced(usageEventIds, invoiceItems[0]?.id || '');
      }

      logger.info('Invoice generated', {
        invoiceId: invoice.id,
        invoiceNumber,
        billingAccountId,
        subtotal,
        tax,
        total,
        itemCount: invoiceItems.length,
      });

      return updatedInvoice;
    } catch (error) {
      logger.error('Failed to generate invoice', {
        error: error instanceof Error ? error.message : 'Unknown error',
        billingAccountId,
        periodStart,
        periodEnd,
      });
      throw error;
    }
  }

  /**
   * Create invoice items from usage events
   */
  private async createInvoiceItems(invoiceId: string, usageEvents: UsageEvent[]): Promise<InvoiceItem[]> {
    // Group usage events by type and number
    const groupedEvents = new Map<string, UsageEvent[]>();

    usageEvents.forEach(event => {
      const key = `${event.eventType}-${event.numberId}`;
      if (!groupedEvents.has(key)) {
        groupedEvents.set(key, []);
      }
      groupedEvents.get(key)!.push(event);
    });

    const invoiceItems: InvoiceItem[] = [];

    // Create invoice items for each group
    for (const [key, events] of groupedEvents) {
      const firstEvent = events[0];
      const totalCost = events.reduce((sum, event) => sum + event.totalCost, 0);
      const quantity = events.reduce((sum, event) => sum + event.quantity, 0);
      const unitPrice = events.length > 0 ? Math.round(totalCost / quantity) : 0;

      let description = this.getEventTypeDescription(firstEvent.eventType);
      if (events.length > 1) {
        description += ` (${events.length} events)`;
      }

      const item = await this.prisma.invoiceItem.create({
        data: {
          invoiceId,
          description,
          quantity,
          unitPrice,
          total: totalCost,
          numberId: firstEvent.numberId,
          usageEventIds: events.map(e => e.id),
        },
      });

      invoiceItems.push(item);
    }

    return invoiceItems;
  }

  /**
   * Get human-readable description for event type
   */
  private getEventTypeDescription(eventType: string): string {
    const descriptions: Record<string, string> = {
      INBOUND_CALL: 'Inbound calls',
      OUTBOUND_CALL: 'Outbound calls',
      SMS_RECEIVED: 'SMS received',
      SMS_SENT: 'SMS sent',
      VOICEMAIL_RECEIVED: 'Voicemail messages',
      CALL_FORWARDED: 'Call forwarding',
      MONTHLY_SUBSCRIPTION: 'Monthly subscription',
      SETUP_FEE: 'Setup fee',
    };

    return descriptions[eventType] || eventType;
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Get the count of invoices for this month
    const startOfMonth = new Date(year, new Date().getMonth(), 1);
    const endOfMonth = new Date(year, new Date().getMonth() + 1, 0);
    
    const count = await this.prisma.invoice.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `INV-${year}${month}-${sequence}`;
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<InvoiceWithItems | null> {
    return this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        billingAccount: true,
        items: true,
      },
    });
  }

  /**
   * Get invoices for a billing account
   */
  async getInvoicesForAccount(
    billingAccountId: string,
    limit = 50,
    offset = 0
  ): Promise<{ invoices: InvoiceWithItems[]; total: number }> {
    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { billingAccountId },
        include: {
          billingAccount: true,
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.invoice.count({
        where: { billingAccountId },
      }),
    ]);

    return { invoices, total };
  }

  /**
   * Mark invoice as paid
   */
  async markInvoiceAsPaid(invoiceId: string): Promise<Invoice> {
    const invoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    logger.info('Invoice marked as paid', {
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
    });

    return invoice;
  }

  /**
   * Generate PDF for invoice
   */
  async generateInvoicePDF(invoiceId: string): Promise<string> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    const pdfUrl = await this.pdfGenerator.generateInvoicePDF(invoice);

    // Update invoice with PDF URL
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        pdfUrl,
        pdfGeneratedAt: new Date(),
      },
    });

    logger.info('Invoice PDF generated', {
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      pdfUrl,
    });

    return pdfUrl;
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(): Promise<InvoiceWithItems[]> {
    const now = new Date();
    
    return this.prisma.invoice.findMany({
      where: {
        status: 'SENT',
        dueDate: {
          lt: now,
        },
      },
      include: {
        billingAccount: true,
        items: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  /**
   * Mark overdue invoices
   */
  async markOverdueInvoices(): Promise<number> {
    const now = new Date();
    
    const result = await this.prisma.invoice.updateMany({
      where: {
        status: 'SENT',
        dueDate: {
          lt: now,
        },
      },
      data: {
        status: 'OVERDUE',
      },
    });

    logger.info('Invoices marked as overdue', {
      count: result.count,
    });

    return result.count;
  }
}
