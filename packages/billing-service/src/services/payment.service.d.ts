import Stripe from 'stripe';
import { PrismaClient, Payment, PaymentMethod } from '@prisma/client';
export interface CreatePaymentMethodInput {
    billingAccountId: string;
    stripePaymentMethodId: string;
    isDefault?: boolean;
}
export interface ProcessPaymentInput {
    invoiceId: string;
    paymentMethodId?: string;
}
export interface PaymentResult {
    success: boolean;
    payment?: Payment;
    error?: string;
}
export declare class PaymentService {
    private prisma;
    private stripe;
    constructor(prisma: PrismaClient);
    /**
     * Create a payment method
     */
    createPaymentMethod(input: CreatePaymentMethodInput): Promise<PaymentMethod>;
    /**
     * Process payment for an invoice
     */
    processPayment(input: ProcessPaymentInput): Promise<PaymentResult>;
    /**
     * Handle Stripe webhook events
     */
    handleWebhook(event: Stripe.Event): Promise<void>;
    /**
     * Handle successful payment intent
     */
    private handlePaymentIntentSucceeded;
    /**
     * Handle failed payment intent
     */
    private handlePaymentIntentFailed;
    /**
     * Get payment methods for a billing account
     */
    getPaymentMethods(billingAccountId: string): Promise<PaymentMethod[]>;
    /**
     * Delete a payment method
     */
    deletePaymentMethod(paymentMethodId: string): Promise<void>;
    /**
     * Map Stripe payment method type to our enum
     */
    private mapStripePaymentMethodType;
}
