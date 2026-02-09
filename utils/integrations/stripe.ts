import Stripe from "stripe";
import connectDB from "@/db";
import Payment from "@/db/models/Payment";
import {
  createPayment,
  deletePaymentsByProvider,
} from "@/utils/database/payment";
import { Types } from "mongoose";
import {
  registerPaymentProviderSync,
  unregisterPaymentProviderSync,
} from "@/utils/jobs/register";
import type { IWebsite } from "@/db/models/Website";

export interface SyncResult {
  synced: number;
  skipped: number;
  errors: number;
}

export interface StripeConfigResult {
  error?: string;
  statusCode?: number;
}

export interface StripeChangeDetection {
  isNewStripeKey: boolean;
  isStripeRemoved: boolean;
}

export abstract class PaymentProviderSyncer {
  abstract syncPayments(
    startDate: Date,
    endDate: Date,
    websiteId: string,
  ): Promise<SyncResult>;

  abstract deletePayments(websiteId: string): Promise<void>;

  validatePaymentProviderKey?(apiKey: string): Promise<StripeConfigResult>;
}

export class StripeHelper {
  private stripe: Stripe;
  private apiKey: string;
  private readonly baseUrl = "https://api.stripe.com/v1/payment_intents";
  private readonly RATE_LIMIT_DELAY_MS = 100;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.stripe = new Stripe(apiKey, {
      apiVersion: "2025-11-17.clover",
    });
  }

  async fetchAllPaymentIntents(
    startDate: Date,
    endDate: Date,
  ): Promise<Stripe.PaymentIntent[]> {
    const paymentIntents: Stripe.PaymentIntent[] = [];
    let hasMore = true;
    let startingAfter: string | undefined = undefined;
    let requestCount = 0;

    while (hasMore) {
      if (requestCount > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.RATE_LIMIT_DELAY_MS),
        );
      }

      const params = new URLSearchParams();
      params.append("limit", "100");
      params.append("expand[]", "data.invoice");

      if (startingAfter) {
        params.append("starting_after", startingAfter);
      }

      params.append(
        "created[gte]",
        Math.floor(startDate.getTime() / 1000).toString(),
      );
      params.append(
        "created[lte]",
        Math.floor(endDate.getTime() / 1000).toString(),
      );

      const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.apiKey}:`).toString(
            "base64",
          )}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 2000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      if (!response.ok) {
        throw new Error(
          `Stripe API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      paymentIntents.push(...(data.data as Stripe.PaymentIntent[]));
      hasMore = data.has_more;
      if (data.data.length > 0) {
        startingAfter = data.data[data.data.length - 1].id;
      }

      requestCount++;
    }

    return paymentIntents;
  }

  async retrieveInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return await this.stripe.invoices.retrieve(invoiceId, {
      expand: ["subscription"],
    });
  }

  async retrieveCharge(chargeId: string): Promise<Stripe.Charge> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return await this.stripe.charges.retrieve(chargeId, {
      expand: ["customer"],
    });
  }

  async retrievePaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return await this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async fetchAllRefunds(
    startDate: Date,
    endDate: Date,
  ): Promise<Stripe.Refund[]> {
    const refunds: Stripe.Refund[] = [];
    let hasMore = true;
    let startingAfter: string | undefined = undefined;
    let requestCount = 0;

    while (hasMore) {
      if (requestCount > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.RATE_LIMIT_DELAY_MS),
        );
      }

      const params: Stripe.RefundListParams = {
        limit: 100,
      };

      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      params.created = {};
      params.created.gte = Math.floor(startDate.getTime() / 1000);
      params.created.lte = Math.floor(endDate.getTime() / 1000);

      try {
        const response = await this.stripe.refunds.list(params);

        refunds.push(...response.data);
        hasMore = response.has_more;
        if (response.data.length > 0) {
          startingAfter = response.data[response.data.length - 1].id;
        }
        requestCount++;
      } catch (error: any) {
        if (error.type === "StripeRateLimitError") {
          const retryAfter = error.headers?.["retry-after"] || "2";
          const waitTime = parseInt(retryAfter) * 1000;
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
        throw error;
      }
    }

    return refunds;
  }
}

export class StripePaymentSyncer extends PaymentProviderSyncer {
  private helper: StripeHelper;

  constructor(apiKey: string) {
    super();
    this.helper = new StripeHelper(apiKey);
  }

  async syncPayments(
    startDate: Date,
    endDate: Date,
    websiteId: string,
  ): Promise<SyncResult> {
    await connectDB();

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    try {
      const paymentResult = await this.syncPaymentIntents(
        startDate,
        endDate,
        websiteId,
      );
      synced += paymentResult.synced;
      skipped += paymentResult.skipped;
      errors += paymentResult.errors;

      const refundResult = await this.syncRefunds(
        startDate,
        endDate,
        websiteId,
      );
      synced += refundResult.synced;
      skipped += refundResult.skipped;
      errors += refundResult.errors;

      return { synced, skipped, errors };
    } catch (error) {
      throw error;
    }
  }

  async deletePayments(websiteId: string): Promise<void> {
    await deletePaymentsByProvider(websiteId, "stripe");
  }

  async validatePaymentProviderKey(
    apiKey: string,
  ): Promise<StripeConfigResult> {
    return await validateStripeApiKey(apiKey);
  }

  private async syncPaymentIntents(
    startDate: Date,
    endDate: Date,
    websiteId: string,
  ): Promise<SyncResult> {
    let paymentSynced = 0;
    let paymentSkipped = 0;
    let paymentErrors = 0;

    try {
      const paymentIntents = await this.helper.fetchAllPaymentIntents(
        startDate,
        endDate,
      );
      for (const paymentIntent of paymentIntents) {
        try {
          if (paymentIntent.status !== "succeeded") {
            paymentSkipped++;
            continue;
          }

          const result = await this.savePaymentIntentToDatabase(
            paymentIntent,
            websiteId,
          );
          if (result === "synced") {
            paymentSynced++;
          } else if (result === "skipped") {
            paymentSkipped++;
          } else {
            paymentErrors++;
          }
        } catch (error) {
          paymentErrors++;
        }
      }

      return {
        synced: paymentSynced,
        skipped: paymentSkipped,
        errors: paymentErrors,
      };
    } catch (error) {
      throw error;
    }
  }

  private async syncRefunds(
    startDate: Date,
    endDate: Date,
    websiteId: string,
  ): Promise<SyncResult> {
    let refundSynced = 0;
    let refundSkipped = 0;
    let refundErrors = 0;

    try {
      const refunds = await this.helper.fetchAllRefunds(startDate, endDate);
      for (const refund of refunds) {
        try {
          if (refund.status !== "succeeded") {
            refundSkipped++;
            continue;
          }

          const result = await this.saveRefundToDatabase(refund, websiteId);
          if (result === "synced") {
            refundSynced++;
          } else if (result === "skipped") {
            refundSkipped++;
          } else {
            refundErrors++;
          }
        } catch (error) {
          refundErrors++;
        }
      }

      return {
        synced: refundSynced,
        skipped: refundSkipped,
        errors: refundErrors,
      };
    } catch (error) {
      throw error;
    }
  }

  private async savePaymentIntentToDatabase(
    paymentIntent: Stripe.PaymentIntent,
    websiteId: string,
  ): Promise<"synced" | "skipped" | "error"> {
    const websiteObjectId = new Types.ObjectId(websiteId);

    const existingPayment = await Payment.findOne({
      websiteId: websiteObjectId,
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

    if (invoice) {
      if (typeof invoice === "object" && invoice !== null && "id" in invoice) {
        expandedInvoice = invoice as Stripe.Invoice;
      } else if (typeof invoice === "string") {
        try {
          expandedInvoice = await this.helper.retrieveInvoice(invoice);
        } catch (error: any) {
          if (error.type === "StripeRateLimitError") {
          } else {
          }
        }
      }
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
        websiteId,
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

      return "synced";
    } catch (error) {
      return "error";
    }
  }

  private async saveRefundToDatabase(
    refund: Stripe.Refund,
    websiteId: string,
  ): Promise<"synced" | "skipped" | "error"> {
    const websiteObjectId = new Types.ObjectId(websiteId);

    const existingPayment = await Payment.findOne({
      websiteId: websiteObjectId,
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
        const charge = await this.helper.retrieveCharge(
          refund.charge as string,
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
      } catch (chargeError) {}
    }

    if (!customerEmail && refund.payment_intent) {
      try {
        const paymentIntent = await this.helper.retrievePaymentIntent(
          refund.payment_intent as string,
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
      } catch (piError) {}
    }

    try {
      await createPayment({
        websiteId,
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
      return "synced";
    } catch (error) {
      return "error";
    }
  }
}

export async function syncStripePayments(
  websiteId: string,
  apiKey: string,
  startDate?: Date,
  endDate?: Date,
): Promise<{ synced: number; skipped: number; errors: number }> {
  const syncer = new StripePaymentSyncer(apiKey);
  const start =
    startDate || new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();
  return await syncer.syncPayments(start, end, websiteId);
}

export function detectStripeChanges(
  currentWebsite: IWebsite,
  newPaymentProviders?: IWebsite["paymentProviders"],
): StripeChangeDetection {
  const currentApiKey = currentWebsite.paymentProviders?.stripe?.apiKey;
  const newApiKey = newPaymentProviders?.stripe?.apiKey;

  const isNewStripeKey = !!newApiKey && currentApiKey !== newApiKey;
  const isStripeRemoved = !newApiKey && !!currentApiKey;

  return {
    isNewStripeKey,
    isStripeRemoved,
  };
}

export async function validateStripeApiKey(
  apiKey: string,
): Promise<StripeConfigResult> {
  const trimmedKey = apiKey.trim();

  if (!trimmedKey.startsWith("rk_")) {
    return {
      error:
        "Please use a restricted API key (starts with 'rk_'). Create a restricted API key with Core (Read), Billing (Read), Checkout (Read), and Webhook (Write) permissions.",
      statusCode: 400,
    };
  }

  try {
    const stripe = new Stripe(trimmedKey, {
      apiVersion: "2025-11-17.clover",
    });

    await stripe.balance.retrieve();
    await stripe.customers.list({ limit: 1 });
    await stripe.checkout.sessions.list({ limit: 1 });
  } catch (error: any) {
    if (error.type === "StripeAuthenticationError") {
      return {
        error: "Invalid Stripe API key. Please check your key and try again.",
        statusCode: 400,
      };
    }

    const errorCode = error.code || "";
    const errorMessage = (error.message || "").toLowerCase();
    const errorType = error.type || "";
    const statusCode = error.statusCode || 0;

    if (
      errorType === "StripePermissionError" ||
      errorCode === "resource_missing" ||
      errorMessage.includes("permission") ||
      errorMessage.includes("forbidden") ||
      errorMessage.includes("not allowed") ||
      errorMessage.includes("insufficient permissions") ||
      errorCode === "api_key_expired" ||
      statusCode === 403
    ) {
      return {
        error:
          "Stripe API key doesn't have the required permissions. Please create a restricted API key with Core (Read), Billing (Read), Checkout (Read), and Webhook (Write) permissions.",
        statusCode: 400,
      };
    }
    return {
      error:
        error.message ||
        "Failed to validate Stripe API key. Please check that your restricted key has Core (Read), Billing (Read), Checkout (Read), and Webhook (Write) permissions.",
      statusCode: 400,
    };
  }

  return {};
}

export function initializeStripeSyncConfig(
  paymentProviders?: IWebsite["paymentProviders"],
): void {
  if (paymentProviders?.stripe?.apiKey && !paymentProviders.stripe.syncConfig) {
    paymentProviders.stripe.syncConfig = {
      enabled: true,
      frequency: "realtime",
    };
  }
}

export async function handleStripeRemoval(websiteId: string): Promise<void> {
  await unregisterPaymentProviderSync(websiteId, "stripe");
  await deletePaymentsByProvider(websiteId, "stripe");
}

export async function handleStripeAddition(
  websiteId: string,
  apiKey: string,
  stripeConfig?: NonNullable<IWebsite["paymentProviders"]>["stripe"],
): Promise<void> {
  const configToUse: NonNullable<IWebsite["paymentProviders"]>["stripe"] =
    stripeConfig || {
      apiKey,
    };
  await registerPaymentProviderSync(
    websiteId,
    "stripe",
    { stripe: configToUse },
    { forceInitialSync: true },
  );

  const baseUrl = getBaseUrl();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);
  fetch(`${baseUrl}/api/jobs/process`, {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      ...(process.env.CRON_SECRET && {
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      }),
    },
    body: JSON.stringify({ batchSize: 10, maxConcurrent: 3 }),
  })
    .then((res) => {
      clearTimeout(timeoutId);
      if (!res.ok) {
      }
    })
    .catch((err) => {
      clearTimeout(timeoutId);
      if (err?.name !== "AbortError") {
      }
    });
}

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export async function processStripeConfigChanges(
  websiteId: string,
  currentWebsite: IWebsite,
  newPaymentProviders?: IWebsite["paymentProviders"],
): Promise<StripeConfigResult> {
  const changes = detectStripeChanges(currentWebsite, newPaymentProviders);

  if (newPaymentProviders?.stripe?.apiKey) {
    const validation = await validateStripeApiKey(
      newPaymentProviders.stripe.apiKey,
    );
    if (validation.error) {
      return validation;
    }
  }

  if (changes.isNewStripeKey && newPaymentProviders?.stripe?.apiKey) {
    initializeStripeSyncConfig(newPaymentProviders);
  }

  try {
    if (changes.isStripeRemoved) {
      await handleStripeRemoval(websiteId);
    }

    if (changes.isNewStripeKey && newPaymentProviders?.stripe?.apiKey) {
      await handleStripeAddition(
        websiteId,
        newPaymentProviders.stripe.apiKey,
        newPaymentProviders.stripe,
      );
    }
  } catch (error) {}

  return {};
}
