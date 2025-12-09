import { NextRequest, NextResponse } from "next/server";
import { createPayment } from "@/utils/database/payment";
import { getWebsiteById } from "@/utils/database/website";
import crypto from "crypto";

/**
 * LemonSqueezy webhook handler
 * Handles order_created and order_refunded events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-signature");

    // TODO: Verify webhook signature
    // const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    // if (webhookSecret && signature) {
    //   const hmac = crypto.createHmac('sha256', webhookSecret);
    //   const digest = hmac.update(body).digest('hex');
    //   if (signature !== digest) {
    //     return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    //   }
    // }

    const event = JSON.parse(body);

    // Handle different event types
    switch (event.meta.event_name) {
      case "order_created":
      case "order_updated": {
        const order = event.data;
        await handleOrderCreated(order);
        break;
      }

      case "subscription_created":
      case "subscription_updated": {
        const subscription = event.data;
        await handleSubscription(subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.meta.event_name}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("LemonSqueezy webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle LemonSqueezy order created
 */
async function handleOrderCreated(order: any) {
  // Extract website ID from custom price data or metadata
  const websiteId =
    order.attributes.first_order_item?.product_options?.websiteId ||
    order.attributes.meta?.websiteId;

  if (!websiteId) {
    console.warn("No websiteId in LemonSqueezy order");
    return;
  }

  // Verify website exists
  const website = await getWebsiteById(websiteId);
  if (!website) {
    console.warn(`Website not found: ${websiteId}`);
    return;
  }

  // Extract payment details
  const amount = order.attributes.total; // in cents
  const currency = order.attributes.currency;
  const customerEmail = order.attributes.customer_email;
  const customerId = order.attributes.customer_id?.toString();

  await createPayment({
    websiteId,
    provider: "lemonsqueezy",
    providerPaymentId: order.id,
    amount: Math.round(amount * 100),
    currency: currency.toLowerCase(),
    renewal: false,
    refunded: false,
    customerEmail,
    customerId,
    metadata: {
      orderId: order.id,
      orderNumber: order.attributes.order_number,
      ...order.attributes.meta,
    },
    timestamp: new Date(order.attributes.created_at),
  });
}

/**
 * Handle LemonSqueezy subscription
 */
async function handleSubscription(subscription: any) {
  // Similar to order handling, but for recurring subscriptions
  const websiteId = subscription.attributes.meta?.websiteId;

  if (!websiteId) {
    return;
  }

  const website = await getWebsiteById(websiteId);
  if (!website) {
    return;
  }

  // For subscriptions, you might want to track differently
  // This is a simplified version
  if (subscription.attributes.status === "active") {
    // Track subscription activation as revenue
    // You might want to handle this differently based on your needs
  }
}
