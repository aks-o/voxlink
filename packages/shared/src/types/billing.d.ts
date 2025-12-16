export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type BillingPeriod = 'monthly' | 'quarterly' | 'yearly';
export interface Invoice {
    id: string;
    accountId: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    period: {
        start: Date;
        end: Date;
    };
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    total: number;
    dueDate: Date;
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    numberId?: string;
    usageRecordIds?: string[];
}
export interface PaymentMethod {
    id: string;
    userId: string;
    type: 'credit_card' | 'bank_account' | 'paypal';
    isDefault: boolean;
    last4?: string;
    expiryMonth?: number;
    expiryYear?: number;
    brand?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Payment {
    id: string;
    invoiceId: string;
    paymentMethodId: string;
    amount: number;
    status: PaymentStatus;
    transactionId?: string;
    failureReason?: string;
    processedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface BillingAccount {
    id: string;
    userId: string;
    companyName?: string;
    billingAddress: Address;
    taxId?: string;
    paymentMethods: PaymentMethod[];
    defaultPaymentMethodId?: string;
    billingPeriod: BillingPeriod;
    nextBillingDate: Date;
    createdAt: Date;
    updatedAt: Date;
}
import type { Address } from './porting-request';
export type { Address };
