import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { DatabaseService } from '../services/database.service';
import { PaymentService } from '../services/payment.service';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export const webhooksRouter = Router();

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-08-16',
});

const prisma = DatabaseService.getClient();
const paymentService = new PaymentService(prisma);

// Stripe webhook endpoint
webhooksRouter.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    logger.warn('Missing Stripe signature header');
    return res.status(400).send('Missing signature header');
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhookSecret
    );
  } catch (error) {
    logger.error('Webhook signature verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    // Handle the event
    await paymentService.handleWebhook(event);

    logger.info('Webhook processed successfully', {
      eventType: event.type,
      eventId: event.id,
    });

    res.json({ received: true });
  } catch (error) {
    logger.error('Failed to process webhook', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventType: event.type,
      eventId: event.id,
    });

    res.status(500).json({
      error: 'Failed to process webhook',
      eventId: event.id,
    });
  }
});