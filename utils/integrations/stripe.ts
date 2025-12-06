import Stripe from "stripe";
import connectDB from "@/db";
import Payment from "@/db/models/Payment";
import { linkPaymentToVisitor } from "@/utils/revenue/linkPayment";
import { Types } from "mongoose";

export async function syncStripePayments(
  websiteId: string,
  apiKey: string,
  startDate?: Date,
  endDate?: Date
): Promise<{ synced: number; skipped: number; errors: number }> {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);
  const stripe = new Stripe(apiKey, {
    apiVersion: "2025-11-17.clover",
  });

  let synced = 0;
  let skipped = 0;
  let errors = 0;

  // Default to last 2 years if no date range provided
  const defaultStartDate =
    startDate || new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000);
  const defaultEndDate = endDate || new Date();

  try {
    // Sync Checkout Sessions
    await syncCheckoutSessions(
      stripe,
      websiteObjectId,
      defaultStartDate,
      defaultEndDate,
      (counts) => {
        synced += counts.synced;
        skipped += counts.skipped;
        errors += counts.errors;
      }
    );

    // Sync Payment Intents
    await syncPaymentIntents(
      stripe,
      websiteObjectId,
      defaultStartDate,
      defaultEndDate,
      (counts) => {
        synced += counts.synced;
        skipped += counts.skipped;
        errors += counts.errors;
      }
    );

    // Sync Charges (for refunds and other payment methods)
    await syncCharges(
      stripe,
      websiteObjectId,
      defaultStartDate,
      defaultEndDate,
      (counts) => {
        synced += counts.synced;
        skipped += counts.skipped;
        errors += counts.errors;
      }
    );

    return { synced, skipped, errors };
  } catch (error) {
    console.error(
      `Error syncing Stripe payments for website ${websiteId}:`,
      error
    );
    throw error;
  }
}

/**
 * Sync Checkout Sessions from Stripe
 */
async function syncCheckoutSessions(
  stripe: Stripe,
  websiteId: Types.ObjectId,
  startDate: Date,
  endDate: Date,
  onProgress: (counts: {
    synced: number;
    skipped: number;
    errors: number;
  }) => void
) {
  let synced = 0;
  let skipped = 0;
  let errors = 0;

  try {
    let hasMore = true;
    let startingAfter: string | undefined = undefined;

    while (hasMore) {
      const sessions: Stripe.Response<Stripe.ApiList<Stripe.Checkout.Session>> =
        await stripe.checkout.sessions.list({
          limit: 100,
          created: {
            gte: Math.floor(startDate.getTime() / 1000),
            lte: Math.floor(endDate.getTime() / 1000),
          },
          starting_after: startingAfter,
        });

      for (const session of sessions.data) {
        try {
          // Only process completed sessions with payments
          if (session.payment_status === "paid" && session.amount_total) {
            const websiteIdFromMetadata = session.metadata?.websiteId;

            // If websiteId is in metadata, only sync if it matches
            // Otherwise, sync all (user might have multiple websites)
            if (
              websiteIdFromMetadata &&
              websiteIdFromMetadata !== websiteId.toString()
            ) {
              skipped++;
              continue;
            }

            // Check if payment already exists
            const existing = await Payment.findOne({
              provider: "stripe",
              providerPaymentId: session.id,
            });

            if (existing) {
              skipped++;
              continue;
            }

            // Link to visitor/session if metadata available
            const link = await linkPaymentToVisitor(
              {
                metadata: session.metadata || undefined,
                customerEmail: session.customer_details?.email || undefined,
                timestamp: new Date(session.created * 1000),
              },
              websiteId.toString()
            );

            // Create payment record
            const payment = new Payment({
              websiteId,
              provider: "stripe",
              providerPaymentId: session.id,
              amount: session.amount_total,
              currency: session.currency || "usd",
              status:
                session.payment_status === "paid" ? "completed" : "failed",
              customerEmail: session.customer_details?.email,
              customerId: session.customer as string,
              metadata: session.metadata,
              sessionId: link?.sessionId,
              visitorId: link?.visitorId,
              timestamp: new Date(session.created * 1000),
            });

            await payment.save();
            synced++;
          } else {
            skipped++;
          }
        } catch (error) {
          console.error(`Error syncing checkout session ${session.id}:`, error);
          errors++;
        }
      }

      hasMore = sessions.has_more;
      if (sessions.data.length > 0) {
        startingAfter = sessions.data[sessions.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }
  } catch (error) {
    console.error("Error syncing checkout sessions:", error);
    errors++;
  }

  onProgress({ synced, skipped, errors });
}

/**
 * Sync Payment Intents from Stripe
 */
async function syncPaymentIntents(
  stripe: Stripe,
  websiteId: Types.ObjectId,
  startDate: Date,
  endDate: Date,
  onProgress: (counts: {
    synced: number;
    skipped: number;
    errors: number;
  }) => void
) {
  let synced = 0;
  let skipped = 0;
  let errors = 0;

  try {
    let hasMore = true;
    let startingAfter: string | undefined = undefined;

    while (hasMore) {
      const paymentIntents: Stripe.Response<
        Stripe.ApiList<Stripe.PaymentIntent>
      > = await stripe.paymentIntents.list({
        limit: 100,
        created: {
          gte: Math.floor(startDate.getTime() / 1000),
          lte: Math.floor(endDate.getTime() / 1000),
        },
        starting_after: startingAfter,
      });

      for (const paymentIntent of paymentIntents.data) {
        try {
          // Only process succeeded payment intents
          if (paymentIntent.status === "succeeded" && paymentIntent.amount) {
            const websiteIdFromMetadata = paymentIntent.metadata?.websiteId;

            if (
              websiteIdFromMetadata &&
              websiteIdFromMetadata !== websiteId.toString()
            ) {
              skipped++;
              continue;
            }

            // Check if payment already exists
            const existing = await Payment.findOne({
              provider: "stripe",
              providerPaymentId: paymentIntent.id,
            });

            if (existing) {
              skipped++;
              continue;
            }

            // Link to visitor/session if metadata available
            const link = await linkPaymentToVisitor(
              {
                metadata: paymentIntent.metadata || undefined,
                customerEmail: paymentIntent.receipt_email || undefined,
                timestamp: new Date(paymentIntent.created * 1000),
              },
              websiteId.toString()
            );

            // Create payment record
            const payment = new Payment({
              websiteId,
              provider: "stripe",
              providerPaymentId: paymentIntent.id,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
              status: "completed",
              customerEmail: paymentIntent.receipt_email || undefined,
              customerId: (paymentIntent.customer as string) || undefined,
              metadata: paymentIntent.metadata || undefined,
              sessionId: link?.sessionId,
              visitorId: link?.visitorId,
              timestamp: new Date(paymentIntent.created * 1000),
            });

            await payment.save();
            synced++;
          } else {
            skipped++;
          }
        } catch (error) {
          console.error(
            `Error syncing payment intent ${paymentIntent.id}:`,
            error
          );
          errors++;
        }
      }

      hasMore = paymentIntents.has_more;
      if (paymentIntents.data.length > 0) {
        startingAfter = paymentIntents.data[paymentIntents.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }
  } catch (error) {
    console.error("Error syncing payment intents:", error);
    errors++;
  }

  onProgress({ synced, skipped, errors });
}

/**
 * Sync Charges from Stripe (for refunds and other payment methods)
 */
async function syncCharges(
  stripe: Stripe,
  websiteId: Types.ObjectId,
  startDate: Date,
  endDate: Date,
  onProgress: (counts: {
    synced: number;
    skipped: number;
    errors: number;
  }) => void
) {
  let synced = 0;
  let skipped = 0;
  let errors = 0;

  try {
    let hasMore = true;
    let startingAfter: string | undefined = undefined;

    while (hasMore) {
      const charges: Stripe.Response<Stripe.ApiList<Stripe.Charge>> =
        await stripe.charges.list({
          limit: 100,
          created: {
            gte: Math.floor(startDate.getTime() / 1000),
            lte: Math.floor(endDate.getTime() / 1000),
          },
          starting_after: startingAfter,
        });

      for (const charge of charges.data) {
        try {
          // Only process paid charges
          if (charge.paid && charge.amount) {
            // Try to find payment intent metadata
            let websiteIdFromMetadata: string | undefined;
            if (charge.payment_intent) {
              try {
                const paymentIntent = await stripe.paymentIntents.retrieve(
                  typeof charge.payment_intent === "string"
                    ? charge.payment_intent
                    : charge.payment_intent.id
                );
                websiteIdFromMetadata = paymentIntent.metadata?.websiteId;
              } catch (e) {
                // Payment intent might not exist, continue
              }
            }

            if (
              websiteIdFromMetadata &&
              websiteIdFromMetadata !== websiteId.toString()
            ) {
              skipped++;
              continue;
            }

            // Use charge ID or payment intent ID as providerPaymentId
            const providerPaymentId = charge.payment_intent
              ? typeof charge.payment_intent === "string"
                ? charge.payment_intent
                : charge.payment_intent.id
              : charge.id;

            // Check if payment already exists
            const existing = await Payment.findOne({
              provider: "stripe",
              providerPaymentId,
            });

            if (existing) {
              skipped++;
              continue;
            }

            // Determine status
            let status: "completed" | "refunded" | "failed" = "completed";
            if (charge.refunded) {
              status = "refunded";
            } else if (!charge.paid) {
              status = "failed";
            }

            // Link to visitor/session if metadata available
            const link = await linkPaymentToVisitor(
              {
                metadata: charge.metadata || undefined,
                customerEmail: charge.billing_details?.email || undefined,
                timestamp: new Date(charge.created * 1000),
              },
              websiteId.toString()
            );

            // Create payment record
            const payment = new Payment({
              websiteId,
              provider: "stripe",
              providerPaymentId,
              amount: charge.amount,
              currency: charge.currency,
              status,
              customerEmail: charge.billing_details?.email || undefined,
              customerId: (charge.customer as string) || undefined,
              metadata: charge.metadata || undefined,
              sessionId: link?.sessionId,
              visitorId: link?.visitorId,
              timestamp: new Date(charge.created * 1000),
            });

            await payment.save();
            synced++;
          } else {
            skipped++;
          }
        } catch (error) {
          console.error(`Error syncing charge ${charge.id}:`, error);
          errors++;
        }
      }

      hasMore = charges.has_more;
      if (charges.data.length > 0) {
        startingAfter = charges.data[charges.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }
  } catch (error) {
    console.error("Error syncing charges:", error);
    errors++;
  }

  onProgress({ synced, skipped, errors });
}
