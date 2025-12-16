import Stripe from 'stripe';
import { PrismaClient, Payment, PaymentMethod, Invoice } from '@prisma/client';
import { config } from '../config/config';
import { logger } from '../utils/logger';

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

export class PaymentService {
  private stripe: Stripe;

  constructor(private prisma: PrismaClient) {
    this.stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2023-08-16',
    });
  }

  /**
   * Create a payment method
   */
  async createPaymentMethod(input: CreatePaymentMethodInput): Promise<PaymentMethod> {
    const { billingAccountId, stripePaymentMethodId, isDefault = false } = input;

    try {
      // Get payment method details from Stripe
      const stripePaymentMethod = await this.stripe.paymentMethods.retrieve(stripePaymentMethodId);

      // If this is set as default, unset other default payment methods
      if (isDefault) {
        await this.prisma.paymentMethod.updateMany({
          where: { billingAccountId },
          data: { isDefault: false },
        });
      }

      // Create payment method record
      const paymentMethod = await this.prisma.paymentMethod.create({
        data: {
          billingAccountId,
          type: this.mapStripePaymentMethodType(stripePaymentMethod.type),
          isDefault,
          stripePaymentMethodId,
          last4: stripePaymentMethod.card?.last4,
          expiryMonth: stripePaymentMethod.card?.exp_month,
          expiryYear: stripePaymentMethod.card?.exp_year,
          brand: stripePaymentMethod.card?.brand,
        },
      });

      logger.info('Payment method created', {
        paymentMethodId: paymentMethod.id,
        billingAccountId,
        type: paymentMethod.type,
        isDefault,
      });

      return paymentMethod;
    } catch (error) {
      logger.error('Failed to create payment method', {
        error: error instanceof Error ? error.message : 'Unknown error',
        billingAccountId,
        stripePaymentMethodId,
      });
      throw error;
    }
  }

  /**
   * Process payment for an invoice
   */
  async processPayment(input: ProcessPaymentInput): Promise<PaymentResult> {
    const { invoiceId, paymentMethodId } = input;

    try {
      // Get invoice with billing account
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { billingAccount: true },
      });

      if (!invoice) {
        throw new Error(`Invoice not found: ${invoiceId}`);
      }

      if (invoice.status === 'PAID') {
        return { success: false, error: 'Invoice is already paid' };
      }

      // Get payment method
      let paymentMethod: PaymentMethod | null = null;

      if (paymentMethodId) {
        paymentMethod = await this.prisma.paymentMethod.findUnique({
          where: { id: paymentMethodId },
        });
      } else {
        // Use default payment method
        paymentMethod = await this.prisma.paymentMethod.findFirst({
          where: {
            billingAccountId: invoice.billingAccountId,
            isDefault: true,
            isActive: true,
          },
        });
      }

      if (!paymentMethod) {
        return { success: false, error: 'No valid payment method found' };
      }

      // Create payment record
      const payment = await this.prisma.payment.create({
        data: {
          invoiceId,
          paymentMethodId: paymentMethod.id,
          amount: invoice.total,
          status: 'PENDING',
        },
      });

      try {
        // Create payment intent with Stripe
        const paymentIntent = await this.stripe.paymentIntents.create({
          amount: invoice.total,
          currency: config.billing.defaultCurrency.toLowerCase(),
          payment_method: paymentMethod.stripePaymentMethodId!,
          confirm: true,
          return_url: `${config.pdf.storageUrl}/payment-return`,
          metadata: {
            invoiceId,
            paymentId: payment.id,
            billingAccountId: invoice.billingAccountId,
          },
        });

        // Update payment with Stripe payment intent ID
        const updatedPayment = await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            stripePaymentIntentId: paymentIntent.id,
            status: paymentIntent.status === 'succeeded' ? 'COMPLETED' : 'PENDING',
            processedAt: paymentIntent.status === 'succeeded' ? new Date() : null,
          },
        });

        // If payment succeeded, mark invoice as paid
        if (paymentIntent.status === 'succeeded') {
          await this.prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              status: 'PAID',
              paidAt: new Date(),
            },
          });

          logger.info('Payment processed successfully', {
            paymentId: payment.id,
            invoiceId,
            amount: invoice.total,
            paymentIntentId: paymentIntent.id,
          });
        }

        return { success: true, payment: updatedPayment };
      } catch (stripeError) {
        // Update payment with failure
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            failureReason: stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error',
            processedAt: new Date(),
          },
        });

        logger.error('Stripe payment failed', {
          paymentId: payment.id,
          invoiceId,
          error: stripeError instanceof Error ? stripeError.message : 'Unknown error',
        });

        return {
          success: false,
          error: stripeError instanceof Error ? stripeError.message : 'Payment processing failed',
        };
      }
    } catch (error) {
      logger.error('Failed to process payment', {
        error: error instanceof Error ? error.message : 'Unknown error',
        invoiceId,
        paymentMethodId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_method.attached':
          // Handle payment method attached if needed
          break;
        default:
          logger.info('Unhandled webhook event', { type: event.type });
      }
    } catch (error) {
      logger.error('Failed to handle webhook', {
        error: error instanceof Error ? error.message : 'Unknown error',
        eventType: event.type,
        eventId: event.id,
      });
      throw error;
    }
  }

  /**
   * Handle successful payment intent
   */
  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment = await this.prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!payment) {
      logger.warn('Payment not found for successful payment intent', {
        paymentIntentId: paymentIntent.id,
      });
      return;
    }

    // Update payment status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });

    // Mark invoice as paid
    await this.prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    logger.info('Payment completed via webhook', {
      paymentId: payment.id,
      invoiceId: payment.invoiceId,
      paymentIntentId: paymentIntent.id,
    });
  }

  /**
   * Handle failed payment intent
   */
  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment = await this.prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!payment) {
      logger.warn('Payment not found for failed payment intent', {
        paymentIntentId: paymentIntent.id,
      });
      return;
    }

    // Update payment status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
        processedAt: new Date(),
      },
    });

    logger.info('Payment failed via webhook', {
      paymentId: payment.id,
      invoiceId: payment.invoiceId,
      paymentIntentId: paymentIntent.id,
      error: paymentIntent.last_payment_error?.message,
    });
  }

  /**
   * Get payment methods for a billing account
   */
  async getPaymentMethods(billingAccountId: string): Promise<PaymentMethod[]> {
    return this.prisma.paymentMethod.findMany({
      where: {
        billingAccountId,
        isActive: true,
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    if (!paymentMethod) {
      throw new Error(`Payment method not found: ${paymentMethodId}`);
    }

    // Detach from Stripe if it exists
    if (paymentMethod.stripePaymentMethodId) {
      try {
        await this.stripe.paymentMethods.detach(paymentMethod.stripePaymentMethodId);
      } catch (error) {
        logger.warn('Failed to detach payment method from Stripe', {
          paymentMethodId,
          stripePaymentMethodId: paymentMethod.stripePaymentMethodId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Mark as inactive instead of deleting to preserve payment history
    await this.prisma.paymentMethod.update({
      where: { id: paymentMethodId },
      data: { isActive: false },
    });

    logger.info('Payment method deleted', { paymentMethodId });
  }

  /**
   * Map Stripe payment method type to our enum
   */
  private mapStripePaymentMethodType(stripeType: string): 'CREDIT_CARD' | 'BANK_ACCOUNT' | 'PAYPAL' {
    switch (stripeType) {
      case 'card':
        return 'CREDIT_CARD';
      case 'us_bank_account':
      case 'sepa_debit':
        return 'BANK_ACCOUNT';
      default:
        return 'CREDIT_CARD'; // Default fallback
    }
  }
}
