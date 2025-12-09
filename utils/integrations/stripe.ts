import Stripe from "stripe";
import connectDB from "@/db";
import Payment from "@/db/models/Payment";
import { createPayment } from "@/utils/database/payment";
import { Types } from "mongoose";

interface SyncResult {
  synced: number;
  skipped: number;
  errors: number;
}

class StripePaymentSyncer {
  private websiteId: string;
  private websiteObjectId: Types.ObjectId;
  private stripe: Stripe;
  private startDate: Date;
  private endDate: Date;

  constructor(
    websiteId: string,
    apiKey: string,
    startDate?: Date,
    endDate?: Date
  ) {
    this.websiteId = websiteId;
    this.websiteObjectId = new Types.ObjectId(websiteId);
    this.stripe = new Stripe(apiKey, {
      apiVersion: "2025-11-17.clover",
    });

    this.startDate =
      startDate || new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000);
    this.endDate = endDate || new Date();
  }

  async sync(): Promise<SyncResult> {
    await connectDB();

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    try {
      const paymentResult = await this.syncPayments();
      synced += paymentResult.synced;
      skipped += paymentResult.skipped;
      errors += paymentResult.errors;

      const refundResult = await this.syncRefunds();
      synced += refundResult.synced;
      skipped += refundResult.skipped;
      errors += refundResult.errors;

      return { synced, skipped, errors };
    } catch (error) {
      console.error(
        `Error syncing Stripe payments for website ${this.websiteId}:`,
        error
      );
      throw error;
    }
  }

  private async syncPayments(): Promise<SyncResult> {
    let paymentSynced = 0;
    let paymentSkipped = 0;
    let paymentErrors = 0;

    try {
      const paymentIntents = await this.fetchAllPaymentIntents();

      console.log(
        `Found ${paymentIntents.length} payment intents to sync for website ${this.websiteId}`
      );

      for (const paymentIntent of paymentIntents) {
        try {
          if (paymentIntent.status !== "succeeded") {
            paymentSkipped++;
            continue;
          }

          const result = await this.syncPaymentIntentToPayment(paymentIntent);
          if (result === "synced") {
            paymentSynced++;
          } else if (result === "skipped") {
            paymentSkipped++;
          } else {
            paymentErrors++;
          }
        } catch (error) {
          console.error(
            `Error processing payment intent ${paymentIntent.id}:`,
            error
          );
          paymentErrors++;
        }
      }

      return {
        synced: paymentSynced,
        skipped: paymentSkipped,
        errors: paymentErrors,
      };
    } catch (error) {
      console.error(
        `Error syncing Stripe payments for website ${this.websiteId}:`,
        error
      );
      throw error;
    }
  }

  private async fetchAllPaymentIntents(): Promise<Stripe.PaymentIntent[]> {
    const paymentIntents: Stripe.PaymentIntent[] = [];
    let hasMore = true;
    let startingAfter: string | undefined = undefined;

    while (hasMore) {
      const params: Stripe.PaymentIntentListParams = {
        limit: 100,
        expand: ["data.invoice"],
      };

      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      params.created = {};
      params.created.gte = Math.floor(this.startDate.getTime() / 1000);
      params.created.lte = Math.floor(this.endDate.getTime() / 1000);

      const response = await this.stripe.paymentIntents.list(params);

      paymentIntents.push(...response.data);
      hasMore = response.has_more;
      if (response.data.length > 0) {
        startingAfter = response.data[response.data.length - 1].id;
      }
    }

    return paymentIntents;
  }

  private async syncPaymentIntentToPayment(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<"synced" | "skipped" | "error"> {
    const existingPayment = await Payment.findOne({
      websiteId: this.websiteObjectId,
      provider: "stripe",
      providerPaymentId: paymentIntent.id,
    });

    if (existingPayment) {
      return "skipped";
    }

    const invoice = (paymentIntent as any).invoice as
      | Stripe.Invoice
      | string
      | null;
    let expandedInvoice: Stripe.Invoice | null = null;

    if (invoice && typeof invoice === "string") {
      try {
        expandedInvoice = await this.stripe.invoices.retrieve(invoice);
      } catch (error) {
        console.warn(
          `Could not retrieve invoice ${invoice} for payment intent ${paymentIntent.id}:`,
          error
        );
      }
    } else if (invoice && typeof invoice === "object") {
      expandedInvoice = invoice;
    }

    let paymentType: "new" | "renewal" | "one-time" = "one-time";

    if (expandedInvoice?.billing_reason === "subscription_cycle") {
      paymentType = "renewal";
    } else if (expandedInvoice?.billing_reason === "subscription_create") {
      paymentType = "new";
    }

    let customerEmail: string | undefined;
    let customerId: string | undefined;
    let metadata: Record<string, any> = {
      paymentType,
      billingReason: expandedInvoice?.billing_reason || null,
      invoiceId: expandedInvoice?.id || null,
    };

    if (paymentIntent.receipt_email) {
      customerEmail = paymentIntent.receipt_email;
    }

    if (paymentIntent.customer) {
      customerId =
        typeof paymentIntent.customer === "string"
          ? paymentIntent.customer
          : paymentIntent.customer.id;
    }

    if (paymentIntent.metadata) {
      metadata = { ...metadata, ...paymentIntent.metadata };
    }

    if (expandedInvoice?.customer_email && !customerEmail) {
      customerEmail = expandedInvoice.customer_email;
    }

    if (expandedInvoice?.customer) {
      const invoiceCustomerId =
        typeof expandedInvoice.customer === "string"
          ? expandedInvoice.customer
          : expandedInvoice.customer.id;
      if (!customerId) {
        customerId = invoiceCustomerId;
      }
    }

    try {
      await createPayment({
        websiteId: this.websiteId,
        provider: "stripe",
        providerPaymentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        renewal: paymentType === "renewal",
        refunded: false,
        customerEmail,
        customerId,
        metadata,
        timestamp: new Date(paymentIntent.created * 1000),
      });

      console.log(
        `Synced payment intent ${paymentIntent.id} as payment record (type: ${paymentType})`
      );
      return "synced";
    } catch (error) {
      console.error(
        `Error creating payment for payment intent ${paymentIntent.id}:`,
        error
      );
      return "error";
    }
  }

  private async syncRefunds(): Promise<SyncResult> {
    let refundSynced = 0;
    let refundSkipped = 0;
    let refundErrors = 0;

    try {
      const refunds = await this.fetchAllRefunds();

      console.log(
        `Found ${refunds.length} refunds to sync for website ${this.websiteId}`
      );

      for (const refund of refunds) {
        try {
          if (refund.status !== "succeeded") {
            refundSkipped++;
            continue;
          }

          const result = await this.syncRefundToPayment(refund);
          if (result === "synced") {
            refundSynced++;
          } else if (result === "skipped") {
            refundSkipped++;
          } else {
            refundErrors++;
          }
        } catch (error) {
          console.error(`Error processing refund ${refund.id}:`, error);
          refundErrors++;
        }
      }

      return {
        synced: refundSynced,
        skipped: refundSkipped,
        errors: refundErrors,
      };
    } catch (error) {
      console.error(
        `Error syncing Stripe refunds for website ${this.websiteId}:`,
        error
      );
      throw error;
    }
  }

  private async fetchAllRefunds(): Promise<Stripe.Refund[]> {
    const refunds: Stripe.Refund[] = [];
    let hasMore = true;
    let startingAfter: string | undefined = undefined;

    while (hasMore) {
      const params: Stripe.RefundListParams = {
        limit: 100,
      };

      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      params.created = {};
      params.created.gte = Math.floor(this.startDate.getTime() / 1000);
      params.created.lte = Math.floor(this.endDate.getTime() / 1000);

      const response = await this.stripe.refunds.list(params);

      refunds.push(...response.data);
      hasMore = response.has_more;
      if (response.data.length > 0) {
        startingAfter = response.data[response.data.length - 1].id;
      }
    }

    return refunds;
  }

  private async syncRefundToPayment(
    refund: Stripe.Refund
  ): Promise<"synced" | "skipped" | "error"> {
    const existingPayment = await Payment.findOne({
      websiteId: this.websiteObjectId,
      provider: "stripe",
      providerPaymentId: refund.id,
    });

    if (existingPayment) {
      return "skipped";
    }

    let customerEmail: string | undefined;
    let customerId: string | undefined;
    let metadata: Record<string, any> = {
      refundId: refund.id,
      refundReason: refund.reason,
      receiptNumber: refund.receipt_number,
    };

    if (refund.charge) {
      try {
        const charge = await this.stripe.charges.retrieve(
          refund.charge as string,
          { expand: ["customer"] }
        );
        if (charge.billing_details?.email) {
          customerEmail = charge.billing_details.email;
        }
        if (charge.customer) {
          customerId =
            typeof charge.customer === "string"
              ? charge.customer
              : charge.customer.id;
        }
        if (charge.metadata) {
          metadata = { ...metadata, ...charge.metadata };
        }
      } catch (chargeError) {
        console.warn(
          `Could not retrieve charge ${refund.charge} for refund ${refund.id}:`,
          chargeError
        );
      }
    }

    if (!customerEmail && refund.payment_intent) {
      try {
        const paymentIntent = await this.stripe.paymentIntents.retrieve(
          refund.payment_intent as string
        );
        if (paymentIntent.receipt_email) {
          customerEmail = paymentIntent.receipt_email;
        }
        if (paymentIntent.customer) {
          customerId =
            typeof paymentIntent.customer === "string"
              ? paymentIntent.customer
              : paymentIntent.customer.id;
        }
        if (paymentIntent.metadata) {
          metadata = { ...metadata, ...paymentIntent.metadata };
        }
      } catch (piError) {
        console.warn(
          `Could not retrieve payment intent ${refund.payment_intent} for refund ${refund.id}:`,
          piError
        );
      }
    }

    try {
      await createPayment({
        websiteId: this.websiteId,
        provider: "stripe",
        providerPaymentId: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        renewal: false,
        refunded: true,
        customerEmail,
        customerId,
        metadata,
        timestamp: new Date(refund.created * 1000),
      });

      console.log(`Synced refund ${refund.id} as payment record`);
      return "synced";
    } catch (error) {
      console.error(`Error creating payment for refund ${refund.id}:`, error);
      return "error";
    }
  }
}

export async function syncStripePayments(
  websiteId: string,
  apiKey: string,
  startDate?: Date,
  endDate?: Date
): Promise<{ synced: number; skipped: number; errors: number }> {
  const syncer = new StripePaymentSyncer(websiteId, apiKey, startDate, endDate);
  return await syncer.sync();
}
