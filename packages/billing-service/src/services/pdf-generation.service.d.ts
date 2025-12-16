import { InvoiceWithItems } from './invoice.service';
import { CostCalculatorService } from './cost-calculator.service';
export declare class PDFGenerationService {
    private costCalculator;
    constructor(costCalculator: CostCalculatorService);
    /**
     * Generate PDF for an invoice
     */
    generateInvoicePDF(invoice: InvoiceWithItems): Promise<string>;
    /**
     * Generate HTML content for invoice
     */
    private generateInvoiceHTML;
    /**
     * Get invoice HTML template
     */
    private getInvoiceTemplate;
    /**
     * Generate PDF from HTML content
     */
    private generatePDF;
    /**
     * Ensure storage directory exists
     */
    private ensureStorageDirectory;
}
