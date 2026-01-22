import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Export webhook handler function for use in server.ts
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).send('Missing stripe-signature header');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Stripe webhook secret is not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook event:', error);
    res.status(500).json({ error: error.message });
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { eventId, ticketId } = paymentIntent.metadata;

    if (!eventId || !ticketId) {
      console.error('Missing metadata in payment intent:', paymentIntent.id);
      return;
    }

    // Find the registration by payment intent ID
    const registration = await prisma.registration.findFirst({
      where: {
        paymentIntentId: paymentIntent.id,
      },
      include: {
        event: true,
        ticket: true,
      },
    });

    if (!registration) {
      console.error('Registration not found for payment intent:', paymentIntent.id);
      return;
    }

    // Update registration status
    await prisma.registration.update({
      where: { id: registration.id },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'paid',
        amountPaid: paymentIntent.amount / 100, // Convert from cents
        confirmedAt: new Date(),
      },
    });

    console.log(`Registration ${registration.id} confirmed via payment intent ${paymentIntent.id}`);
  } catch (error: any) {
    console.error('Error handling payment intent succeeded:', error);
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Find the registration by payment intent ID
    const registration = await prisma.registration.findFirst({
      where: {
        paymentIntentId: paymentIntent.id,
      },
    });

    if (!registration) {
      console.error('Registration not found for payment intent:', paymentIntent.id);
      return;
    }

    // Update registration status to reflect payment failure
    await prisma.registration.update({
      where: { id: registration.id },
      data: {
        paymentStatus: 'failed',
        // Keep status as PENDING so user can retry
      },
    });

    console.log(`Payment failed for registration ${registration.id}, payment intent ${paymentIntent.id}`);
  } catch (error: any) {
    console.error('Error handling payment intent failed:', error);
    throw error;
  }
}

export default router;
