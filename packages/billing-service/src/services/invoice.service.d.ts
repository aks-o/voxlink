import { PrismaClient, Invoice, InvoiceItem, BillingAccount } from '@prisma/client';
import { CostCalculatorService } from './cost-calculator.service';
import { UsageTrackingService } from './usage-tracking.service';
import { PDFGenerationService } from './pdf-generation.service';
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
export declare class InvoiceService {
    private prisma;
    private costCalculator;
    private usageTracking;
    private pdfGenerator;
    constructor(prisma: PrismaClient, costCalculator: CostCalculatorService, usageTracking: UsageTrackingService, pdfGenerator: PDFGenerationService);
    /**
     * Generate invoice for a billing period
     */
    generateInvoice(input: CreateInvoiceInput): Promise<InvoiceWithItems>;
    /**
     * Create invoice items from usage events
     */
    private createInvoiceItems;
    /**
     * Get human-readable description for event type
     */
    private getEventTypeDescription;
    /**
     * Generate unique invoice number
     */
    private generateInvoiceNumber;
    /**
     * Get invoice by ID
     */
    getInvoice(invoiceId: string): Promise<InvoiceWithItems | null>;
    /**
     * Get invoices for a billing account
     */
    getInvoicesForAccount(billingAccountId: string, limit?: number, offset?: number): Promise<{
        invoices: InvoiceWithItems[];
        total: number;
    }>;
    /**
     * Mark invoice as paid
     */
    markInvoiceAsPaid(invoiceId: string): Promise<Invoice>;
    /**
     * Generate PDF for invoice
     */
    generateInvoicePDF(invoiceId: string): Promise<string>;
    /**
     * Get overdue invoices
     */
    getOverdueInvoices(): Promise<InvoiceWithItems[]>;
    /**
     * Mark overdue invoices
     */
    markOverdueInvoices(): Promise<number>;
}
