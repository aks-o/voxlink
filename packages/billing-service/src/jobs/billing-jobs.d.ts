export declare class BillingJobs {
    private billingCycleService;
    private invoiceService;
    constructor();
    /**
     * Start all scheduled jobs
     */
    start(): void;
    /**
     * Generate PDFs for invoices that don't have them
     */
    private generateMissingInvoicePDFs;
    /**
     * Stop all scheduled jobs
     */
    stop(): void;
}
