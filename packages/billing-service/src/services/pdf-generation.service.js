"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFGenerationService = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const handlebars_1 = __importDefault(require("handlebars"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
class PDFGenerationService {
    constructor(costCalculator) {
        this.costCalculator = costCalculator;
    }
    /**
     * Generate PDF for an invoice
     */
    async generateInvoicePDF(invoice) {
        try {
            // Ensure storage directory exists
            await this.ensureStorageDirectory();
            // Generate HTML content
            const htmlContent = await this.generateInvoiceHTML(invoice);
            // Generate PDF
            const pdfPath = await this.generatePDF(htmlContent, `invoice-${invoice.invoiceNumber}.pdf`);
            // Return public URL
            const pdfUrl = `${config_1.config.pdf.storageUrl}/${path_1.default.basename(pdfPath)}`;
            logger_1.logger.info('PDF generated successfully', {
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                pdfPath,
                pdfUrl,
            });
            return pdfUrl;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate PDF', {
                error: error instanceof Error ? error.message : 'Unknown error',
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
            });
            throw error;
        }
    }
    /**
     * Generate HTML content for invoice
     */
    async generateInvoiceHTML(invoice) {
        const template = await this.getInvoiceTemplate();
        const compiledTemplate = handlebars_1.default.compile(template);
        const templateData = {
            invoice: {
                ...invoice,
                formattedSubtotal: this.costCalculator.formatAmount(invoice.subtotal),
                formattedTax: this.costCalculator.formatAmount(invoice.tax),
                formattedTotal: this.costCalculator.formatAmount(invoice.total),
                formattedDueDate: invoice.dueDate.toLocaleDateString(),
                formattedPeriodStart: invoice.periodStart.toLocaleDateString(),
                formattedPeriodEnd: invoice.periodEnd.toLocaleDateString(),
            },
            items: invoice.items.map(item => ({
                ...item,
                formattedUnitPrice: this.costCalculator.formatAmount(item.unitPrice),
                formattedTotal: this.costCalculator.formatAmount(item.total),
            })),
            billingAccount: invoice.billingAccount,
            company: {
                name: 'VoxLink',
                address: '123 Business Street, Suite 100',
                city: 'San Francisco, CA 94105',
                phone: '+1 (555) 123-4567',
                email: 'billing@voxlink.com',
                website: 'www.voxlink.com',
            },
            generatedAt: new Date().toLocaleDateString(),
        };
        return compiledTemplate(templateData);
    }
    /**
     * Get invoice HTML template
     */
    async getInvoiceTemplate() {
        // For now, return a simple inline template
        // In production, this would load from a template file
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {{invoice.invoiceNumber}}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
        }
        .company-info {
            flex: 1;
        }
        .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 10px;
        }
        .invoice-info {
            text-align: right;
            flex: 1;
        }
        .invoice-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .billing-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
        }
        .bill-to, .invoice-details {
            flex: 1;
        }
        .bill-to h3, .invoice-details h3 {
            margin-bottom: 10px;
            color: #007bff;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th,
        .items-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .items-table th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        .items-table .amount {
            text-align: right;
        }
        .totals {
            float: right;
            width: 300px;
        }
        .totals table {
            width: 100%;
            border-collapse: collapse;
        }
        .totals td {
            padding: 8px 12px;
            border-bottom: 1px solid #ddd;
        }
        .totals .total-row {
            font-weight: bold;
            font-size: 18px;
            background-color: #f8f9fa;
        }
        .footer {
            clear: both;
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        .payment-info {
            margin-top: 40px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-info">
            <div class="company-name">{{company.name}}</div>
            <div>{{company.address}}</div>
            <div>{{company.city}}</div>
            <div>Phone: {{company.phone}}</div>
            <div>Email: {{company.email}}</div>
        </div>
        <div class="invoice-info">
            <div class="invoice-title">INVOICE</div>
            <div><strong>Invoice #:</strong> {{invoice.invoiceNumber}}</div>
            <div><strong>Date:</strong> {{generatedAt}}</div>
            <div><strong>Due Date:</strong> {{invoice.formattedDueDate}}</div>
        </div>
    </div>

    <div class="billing-details">
        <div class="bill-to">
            <h3>Bill To:</h3>
            {{#if billingAccount.companyName}}
            <div><strong>{{billingAccount.companyName}}</strong></div>
            {{/if}}
            <div>Account ID: {{billingAccount.userId}}</div>
            {{#if billingAccount.taxId}}
            <div>Tax ID: {{billingAccount.taxId}}</div>
            {{/if}}
        </div>
        <div class="invoice-details">
            <h3>Invoice Details:</h3>
            <div><strong>Billing Period:</strong></div>
            <div>{{invoice.formattedPeriodStart}} - {{invoice.formattedPeriodEnd}}</div>
            <div><strong>Status:</strong> {{invoice.status}}</div>
        </div>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th class="amount">Unit Price</th>
                <th class="amount">Total</th>
            </tr>
        </thead>
        <tbody>
            {{#each items}}
            <tr>
                <td>{{description}}</td>
                <td>{{quantity}}</td>
                <td class="amount">{{formattedUnitPrice}}</td>
                <td class="amount">{{formattedTotal}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>

    <div class="totals">
        <table>
            <tr>
                <td>Subtotal:</td>
                <td class="amount">{{invoice.formattedSubtotal}}</td>
            </tr>
            <tr>
                <td>Tax:</td>
                <td class="amount">{{invoice.formattedTax}}</td>
            </tr>
            <tr class="total-row">
                <td>Total:</td>
                <td class="amount">{{invoice.formattedTotal}}</td>
            </tr>
        </table>
    </div>

    <div class="payment-info">
        <h3>Payment Information</h3>
        <p>Please pay by the due date to avoid service interruption. You can make payments through your VoxLink dashboard or contact our billing department.</p>
        <p><strong>Questions?</strong> Contact us at {{company.email}} or {{company.phone}}</p>
    </div>

    <div class="footer">
        <p>Thank you for choosing VoxLink for your communication needs!</p>
        <p>{{company.website}} | Generated on {{generatedAt}}</p>
    </div>
</body>
</html>`;
    }
    /**
     * Generate PDF from HTML content
     */
    async generatePDF(htmlContent, filename) {
        const browser = await puppeteer_1.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        try {
            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
            const pdfPath = path_1.default.join(config_1.config.pdf.storagePath, filename);
            await page.pdf({
                path: pdfPath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px',
                },
            });
            return pdfPath;
        }
        finally {
            await browser.close();
        }
    }
    /**
     * Ensure storage directory exists
     */
    async ensureStorageDirectory() {
        try {
            await promises_1.default.access(config_1.config.pdf.storagePath);
        }
        catch {
            await promises_1.default.mkdir(config_1.config.pdf.storagePath, { recursive: true });
        }
    }
}
exports.PDFGenerationService = PDFGenerationService;
