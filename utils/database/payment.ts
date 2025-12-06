import connectDB from "@/db";
import Payment from "@/db/models/Payment";
import { linkPaymentToVisitor } from "@/utils/revenue/linkPayment";

/**
 * Create a payment record
 */
export async function createPayment(data: {
  websiteId: string;
  provider: "stripe" | "lemonsqueezy" | "polar" | "paddle" | "other";
  providerPaymentId: string;
  amount: number; // in cents
  currency: string;
  status: "completed" | "refunded" | "failed";
  customerEmail?: string;
  customerId?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}) {
  await connectDB();

  try {
    // Check if payment already exists (upsert to prevent duplicates)
    const existingPayment = await Payment.findOne({
      provider: data.provider,
      providerPaymentId: data.providerPaymentId,
    });

    if (existingPayment) {
      // Update existing payment if needed
      if (existingPayment.status !== data.status) {
        existingPayment.status = data.status;
        await existingPayment.save();
      }
      return existingPayment;
    }

    // Try to link to visitor/session
    const link = await linkPaymentToVisitor(
      {
        metadata: data.metadata,
        customerEmail: data.customerEmail,
        timestamp: data.timestamp || new Date(),
      },
      data.websiteId
    );

    const payment = new Payment({
      websiteId: data.websiteId,
      provider: data.provider,
      providerPaymentId: data.providerPaymentId,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      customerEmail: data.customerEmail,
      customerId: data.customerId,
      metadata: data.metadata,
      sessionId: link?.sessionId,
      visitorId: link?.visitorId,
      timestamp: data.timestamp || new Date(),
    });

    await payment.save();
    return payment;
  } catch (error) {
    console.error("Error creating payment:", error);
    throw error;
  }
}

/**
 * Update payment status (e.g., for refunds)
 */
export async function updatePaymentStatus(
  provider: string,
  providerPaymentId: string,
  status: "completed" | "refunded" | "failed"
) {
  await connectDB();

  try {
    const payment = await Payment.findOneAndUpdate(
      { provider, providerPaymentId },
      { $set: { status } },
      { new: true }
    );

    return payment;
  } catch (error) {
    console.error("Error updating payment:", error);
    throw error;
  }
}

/**
 * Get payments for a website
 */
export async function getPaymentsByWebsiteId(
  websiteId: string,
  startDate?: Date,
  endDate?: Date
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
