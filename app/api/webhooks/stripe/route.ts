import { NextRequest, NextResponse } from "next/server";
import { createPayment, updatePaymentRefunded } from "@/utils/database/payment";
import { getWebsiteById } from "@/utils/database/website";

// Stripe SDK is optional - uncomment and install if needed for signature verification
// import Stripe from "stripe";
// const stripe = process.env.STRIPE_SECRET_KEY
//   ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-11-20.acacia" })
//   : null;

/**
 * Stripe webhook handler
 * Handles checkout.session.completed and payment_intent.succeeded events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // TODO: Verify webhook signature
    // if (stripe) {
    //   try {
    //     const event = stripe.webhooks.constructEvent(
    //       body,
    //       signature,
    //       process.env.STRIPE_WEBHOOK_SECRET!
    //     );
    //   } catch (err) {
    //     return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    //   }
    // }

    const event = JSON.parse(body);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await handleCheckoutSession(session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        await handlePaymentIntent(paymentIntent);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        await handleRefund(charge);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle Stripe checkout session completed
 */
async function handleCheckoutSession(session: any) {
  // Extract website ID from metadata
  const websiteId = session.metadata?.websiteId;
  if (!websiteId) {
    console.warn("No websiteId in checkout session metadata");
    return;
  }

  // Verify website exists
  const website = await getWebsiteById(websiteId);
  if (!website) {
    console.warn(`Website not found: ${websiteId}`);
    return;
  }

  // Extract payment details
  const amount = session.amount_total || 0; // in cents
  const currency = session.currency || "usd";
  const customerEmail = session.customer_details?.email;
  const customerId = session.customer;

  await createPayment({
    websiteId,
    provider: "stripe",
    providerPaymentId: session.id,
    amount,
    currency,
    renewal: false,
    refunded: false,
    customerEmail,
    customerId,
    metadata: session.metadata,
    timestamp: new Date(session.created * 1000),
  });
}

/**
 * Handle Stripe payment intent succeeded
 */
async function handlePaymentIntent(paymentIntent: any) {
  const websiteId = paymentIntent.metadata?.websiteId;
  if (!websiteId) {
    console.warn("No websiteId in payment intent metadata");
    return;
  }

  const website = await getWebsiteById(websiteId);
  if (!website) {
    console.warn(`Website not found: ${websiteId}`);
    return;
  }

  const amount = paymentIntent.amount;
  const currency = paymentIntent.currency;

  await createPayment({
    websiteId,
    provider: "stripe",
    providerPaymentId: paymentIntent.id,
    amount,
    currency,
    renewal: false,
    refunded: false,
    customerEmail: paymentIntent.receipt_email,
    customerId: paymentIntent.customer,
    metadata: paymentIntent.metadata,
    timestamp: new Date(paymentIntent.created * 1000),
  });
}

/**
 * Handle Stripe refund
 */
async function handleRefund(charge: any) {
  const payment = await updatePaymentRefunded(
    "stripe",
    charge.payment_intent || charge.id,
    true
  );

  if (!payment) {
    console.warn(`Payment not found for refund: ${charge.id}`);
  }
}
