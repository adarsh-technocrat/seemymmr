import connectDB from "@/db";
import Payment from "@/db/models/Payment";
import { linkPaymentToVisitor } from "@/utils/revenue/linkPayment";

export async function createPayment(data: {
  websiteId: string;
  provider: "stripe" | "lemonsqueezy" | "polar" | "paddle" | "other";
  providerPaymentId: string;
  amount: number;
  currency: string;
  renewal: boolean;
  refunded: boolean;
  customerEmail?: string;
  customerId?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}) {
  await connectDB();

  try {
    const existingPayment = await Payment.findOne({
      provider: data.provider,
      providerPaymentId: data.providerPaymentId,
    });

    if (existingPayment) {
      if (
        existingPayment.renewal !== data.renewal ||
        existingPayment.refunded !== data.refunded
      ) {
        existingPayment.renewal = data.renewal;
        existingPayment.refunded = data.refunded;
        await existingPayment.save();
      }
      return existingPayment;
    }

    const link = await linkPaymentToVisitor(
      {
        metadata: data.metadata,
        customerEmail: data.customerEmail,
        timestamp: data.timestamp || new Date(),
      },
      data.websiteId,
    );

    const payment = new Payment({
      websiteId: data.websiteId,
      provider: data.provider,
      providerPaymentId: data.providerPaymentId,
      amount: data.amount,
      currency: data.currency,
      renewal: data.renewal,
      refunded: data.refunded,
      customerEmail: data.customerEmail,
      customerId: data.customerId,
      metadata: data.metadata,
      sessionId: link?.sessionId,
      visitorId: link?.visitorId,
      timestamp: data.timestamp || new Date(),
    });

    await payment.save();
    return payment;
  } catch (error: any) {
    // Handle duplicate key error (race condition when multiple jobs sync the same payment)
    if (error.code === 11000) {
      // Payment was created by another process, fetch and return it
      const existingPayment = await Payment.findOne({
        provider: data.provider,
        providerPaymentId: data.providerPaymentId,
      });

      if (existingPayment) {
        // Update renewal/refunded status if needed
        if (
          existingPayment.renewal !== data.renewal ||
          existingPayment.refunded !== data.refunded
        ) {
          existingPayment.renewal = data.renewal;
          existingPayment.refunded = data.refunded;
          await existingPayment.save();
        }
        return existingPayment;
      }
    }

    console.error("Error creating payment:", error);
    throw error;
  }
}

/**
 * Update payment refunded status
 */
export async function updatePaymentRefunded(
  provider: string,
  providerPaymentId: string,
  refunded: boolean,
) {
  await connectDB();

  try {
    const payment = await Payment.findOneAndUpdate(
      { provider, providerPaymentId },
      { $set: { refunded } },
      { new: true },
    );

    return payment;
  } catch (error) {
    console.error("Error updating payment refunded status:", error);
    throw error;
  }
}

/**
 * Get payments for a website
 */
export async function getPaymentsByWebsiteId(
  websiteId: string,
  startDate?: Date,
  endDate?: Date,
) {
  await connectDB();

  try {
    const query: any = { websiteId };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    const payments = await Payment.find(query).sort({ timestamp: -1 });
    return payments;
  } catch (error) {
    console.error("Error fetching payments:", error);
    throw error;
  }
}

/**
 * Delete all payments for a website/provider combination
 * Used when a payment provider is disconnected
 */
export async function deletePaymentsByProvider(
  websiteId: string,
  provider: "stripe" | "lemonsqueezy" | "polar" | "paddle" | "other",
) {
  await connectDB();

  try {
    const result = await Payment.deleteMany({
      websiteId,
      provider,
    });

    const deletedCount = result.deletedCount || 0;
    console.log(
      `Deleted ${deletedCount} payment records for website ${websiteId}, provider ${provider}`,
    );
    return deletedCount;
  } catch (error) {
    console.error("Error deleting payments:", error);
    throw error;
  }
}
