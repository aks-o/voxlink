import { PrismaClient, BillingAccount, BillingCycle } from '@prisma/client';
import { InvoiceService } from './invoice.service';
import { PaymentService } from './payment.service';
export declare class BillingCycleService {
    private prisma;
    private invoiceService;
    private paymentService;
    constructor(prisma: PrismaClient, invoiceService: InvoiceService, paymentService: PaymentService);
    /**
     * Process billing cycles for accounts due for billing
     */
    processBillingCycles(): Promise<void>;
    /**
     * Process billing cycle for a specific account
     */
    processBillingCycleForAccount(account: BillingAccount): Promise<void>;
    /**
     * Get accounts due for billing
     */
    private getAccountsDueForBilling;
    /**
     * Calculate period start date based on period end and billing period
     */
    private calculatePeriodStart;
    /**
     * Calculate next billing date
     */
    private calculateNextBillingDate;
    /**
     * Attempt automatic payment for an invoice
     */
    private attemptAutomaticPayment;
    /**
     * Get billing cycles for an account
     */
    getBillingCycles(billingAccountId: string, limit?: number, offset?: number): Promise<{
        cycles: BillingCycle[];
        total: number;
    }>;
    /**
     * Get current billing cycle for an account
     */
    getCurrentBillingCycle(billingAccountId: string): Promise<BillingCycle | null>;
    /**
     * Retry failed billing cycles
     */
    retryFailedBillingCycles(): Promise<void>;
    /**
     * Mark overdue invoices and handle grace period
     */
    handleOverdueInvoices(): Promise<void>;
    /**
     * Handle accounts with invoices past grace period
     */
    private handleGracePeriodExpired;
}
