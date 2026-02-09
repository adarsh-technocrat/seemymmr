import { enqueueSyncJob, cancelPendingJobs } from "./queue";
import { getWebsiteById } from "@/utils/database/website";
import type { SyncJobProvider, SyncRange } from "@/db/models/SyncJob";
import connectDB from "@/db";
import SyncJob from "@/db/models/SyncJob";
import { Types } from "mongoose";

export async function registerPaymentProviderSync(
  websiteId: string,
  provider: SyncJobProvider,
  overrideConfig?: {
    stripe?: {
      apiKey?: string;
      webhookSecret?: string;
      syncConfig?: {
        enabled?: boolean;
        frequency?: "realtime" | "hourly" | "every-6-hours" | "daily";
        lastSyncAt?: Date;
        nextSyncAt?: Date;
      };
    };
  },
  options?: { forceInitialSync?: boolean },
): Promise<void> {
  const website = await getWebsiteById(websiteId);
  if (!website) {
    throw new Error("Website not found");
  }

  const providerKeyMap: Record<
    SyncJobProvider,
    keyof NonNullable<typeof website.paymentProviders>
  > = {
    stripe: "stripe",
    lemonsqueezy: "lemonSqueezy",
    polar: "polar",
    paddle: "paddle",
  };

  const providerKey = providerKeyMap[provider];

  if (provider === "stripe") {
    const stripeConfig =
      overrideConfig?.stripe || website.paymentProviders?.stripe;
    if (!stripeConfig) {
      throw new Error(`Provider ${provider} not configured`);
    }
    if (!stripeConfig.apiKey) {
      throw new Error("Stripe API key not configured");
    }
    const frequency = stripeConfig.syncConfig?.frequency || "realtime";
    const enabled = stripeConfig.syncConfig?.enabled !== false;

    if (!enabled) {
      return;
    }

    await connectDB();
    const forceInitialSync = options?.forceInitialSync === true;
    const existingSync = forceInitialSync
      ? null
      : await SyncJob.findOne({
          websiteId: new Types.ObjectId(websiteId),
          provider: "stripe",
          status: "completed",
        });

    let startDate: Date;
    let endDate: Date;
    let syncRange: SyncRange;
    let priority: number;

    if (!existingSync) {
      // Chunk 2-year initial sync into monthly jobs so each completes in seconds
      // instead of one 5+ minute job that blocks the trigger request and times out.
      const end = new Date();
      const start = new Date(end.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
      const chunks = getMonthlyChunks(start, end);
      for (const [chunkStart, chunkEnd] of chunks) {
        await enqueueSyncJob({
          websiteId,
          provider,
          type: "periodic",
          priority: 90,
          startDate: chunkStart,
          endDate: chunkEnd,
          syncRange: "custom",
        });
      }
      return;
    }

    const dateRange = getSyncDateRange(frequency);
    startDate = dateRange.startDate;
    endDate = dateRange.endDate;
    syncRange = dateRange.syncRange;
    priority = 60;

    await enqueueSyncJob({
      websiteId,
      provider,
      type: "periodic",
      priority,
      startDate,
      endDate,
      syncRange,
    });
    return;
  }

  throw new Error(`Sync for provider ${provider} is not yet implemented`);
}

function getMonthlyChunks(start: Date, end: Date): Array<[Date, Date]> {
  const chunks: Array<[Date, Date]> = [];
  let chunkStart = new Date(start);

  while (chunkStart < end) {
    const chunkEnd = new Date(chunkStart);
    chunkEnd.setMonth(chunkEnd.getMonth() + 1);
    chunks.push([
      new Date(chunkStart),
      chunkEnd > end ? new Date(end) : chunkEnd,
    ]);
    chunkStart = new Date(chunkEnd);
  }

  return chunks;
}

function getSyncDateRange(
  frequency: "realtime" | "hourly" | "every-6-hours" | "daily",
): {
  startDate: Date;
  endDate: Date;
  syncRange: SyncRange;
} {
  const endDate = new Date();
  let startDate: Date;
  let syncRange: SyncRange;

  switch (frequency) {
    case "realtime":
      startDate = new Date(endDate.getTime() - 15 * 60 * 1000);
      syncRange = "custom";
      break;
    case "hourly":
      startDate = new Date(endDate.getTime() - 26 * 60 * 60 * 1000);
      syncRange = "last24h";
      break;
    case "every-6-hours":
      startDate = new Date(endDate.getTime() - 48 * 60 * 60 * 1000);
      syncRange = "last24h";
      break;
    case "daily":
      startDate = new Date(endDate.getTime() - 8 * 24 * 60 * 60 * 1000);
      syncRange = "last7d";
      break;
    default:
      startDate = new Date(endDate.getTime() - 15 * 60 * 1000);
      syncRange = "custom";
  }

  return { startDate, endDate, syncRange };
}

export async function unregisterPaymentProviderSync(
  websiteId: string,
  provider: SyncJobProvider,
): Promise<void> {
  await cancelPendingJobs(websiteId, provider);
}
