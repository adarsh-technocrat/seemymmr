import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import {
  enqueueSyncJob,
  calculateNextSyncDate,
  dequeueSyncJob,
  updateSyncJobStatus,
  incrementJobRetry,
} from "@/utils/jobs/queue";
import { syncStripePayments } from "@/utils/integrations/stripe";
import { getWebsiteById } from "@/utils/database/website";

/**
 * POST /api/cron/sync-payments
 * Cron job endpoint to create sync jobs for all websites with payment providers
 *
 * Schedule this to run:
 * - Hourly: For recent payment syncs
 * - Every 6 hours: For comprehensive catch-up
 * - Daily: For full backup sync
 *
 * Protected by CRON_SECRET environment variable
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    await connectDB();

    // Get all websites with payment providers configured
    const websites = await Website.find({
      $or: [
        { "paymentProviders.stripe.apiKey": { $exists: true, $ne: null } },
        { "paymentProviders.lemonsqueezy.webhookSecret": { $exists: true } },
        { "paymentProviders.polar.webhookSecret": { $exists: true } },
        { "paymentProviders.paddle.webhookSecret": { $exists: true } },
      ],
    });

    const jobsCreated: Array<{
      websiteId: string;
      provider: string;
      jobId: string;
    }> = [];

    // Determine sync frequency from query params or default
    const searchParams = request.nextUrl.searchParams;
    const frequency = searchParams.get("frequency") || "realtime"; // realtime, hourly, every-6-hours, daily

    // Calculate date range based on frequency
    const endDate = new Date();
    let startDate: Date;
    let syncRange: "today" | "last24h" | "last7d" | "custom";

    switch (frequency) {
      case "realtime":
        // For 5-minute cron: Sync last 10 minutes with 5 minute buffer
        // This ensures we catch all payments while being efficient
        startDate = new Date(endDate.getTime() - 15 * 60 * 1000); // 15 minutes
        syncRange = "custom";
        break;
      case "hourly":
        // Sync last 24 hours with 2 hour buffer to catch any missed payments
        // This ensures we don't miss payments due to timezone differences or delays
        startDate = new Date(endDate.getTime() - 26 * 60 * 60 * 1000);
        syncRange = "last24h";
        break;
      case "every-6-hours":
        // Sync last 48 hours to ensure comprehensive coverage
        startDate = new Date(endDate.getTime() - 48 * 60 * 60 * 1000);
        syncRange = "last24h";
        break;
      case "daily":
        // Sync last 7 days + 1 day buffer for timezone differences
        startDate = new Date(endDate.getTime() - 8 * 24 * 60 * 60 * 1000);
        syncRange = "last7d";
        break;
      default:
        // Default to realtime (15 minutes) for frequent cron jobs
        startDate = new Date(endDate.getTime() - 15 * 60 * 1000);
        syncRange = "custom";
    }

    // Create sync jobs for each website/provider combination
    for (const website of websites) {
      const websiteId = website._id.toString();

      // Stripe
      if (website.paymentProviders?.stripe?.apiKey) {
        const syncConfig = website.paymentProviders.stripe.syncConfig;
        if (syncConfig?.enabled !== false) {
          // Check if sync is due (if nextSyncAt is set and in the past)
          const shouldSync =
            !syncConfig?.nextSyncAt ||
            new Date(syncConfig.nextSyncAt) <= new Date();

          if (shouldSync) {
            const job = await enqueueSyncJob({
              websiteId,
              provider: "stripe",
              type: "cron",
              priority: 50,
              startDate,
              endDate,
              syncRange,
            });

            jobsCreated.push({
              websiteId,
              provider: "stripe",
              jobId: job._id.toString(),
            });

            // Update nextSyncAt if syncConfig exists
            if (syncConfig) {
              const nextSync = calculateNextSyncDate(
                syncConfig.frequency || "hourly"
              );
              website.paymentProviders.stripe.syncConfig = {
                ...syncConfig,
                lastSyncAt: new Date(),
                nextSyncAt: nextSync,
              };
              await website.save();
            }
          }
        }
      }

      // TODO: Add other providers (LemonSqueezy, Polar, Paddle) when implemented
    }

    // After creating sync jobs, also process pending jobs
    const processedJobs = await processPendingJobs();

    return NextResponse.json({
      success: true,
      frequency,
      websitesProcessed: websites.length,
      jobsCreated: jobsCreated.length,
      jobs: jobsCreated,
      processed: processedJobs.processed,
      processedJobs: processedJobs.jobs,
    });
  } catch (error: any) {
    console.error("Error in cron sync-payments:", error);
    return NextResponse.json(
      {
        error: "Failed to create sync jobs",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Process pending sync jobs
 */
async function processPendingJobs(): Promise<{
  processed: number;
  jobs: Array<{ jobId: string; status: string; result?: any; error?: string }>;
}> {
  const processedJobs: Array<{
    jobId: string;
    status: string;
    result?: any;
    error?: string;
  }> = [];

  // Process up to 10 jobs at a time, 3 concurrently
  const batchSize = 10;
  const maxConcurrent = 3;
  const jobPromises: Promise<{
    jobId: string;
    status: string;
    result?: any;
    error?: string;
  }>[] = [];

  // Dequeue jobs and create promises
  for (let i = 0; i < batchSize; i++) {
    const job = await dequeueSyncJob();

    if (!job) {
      break; // No more pending jobs
    }

    // Create promise for job processing
    const jobPromise = processJob(job)
      .then((result) => ({
        jobId: job._id.toString(),
        status: "completed",
        result: result,
      }))
      .catch((error) => ({
        jobId: job._id.toString(),
        status: "failed",
        error: error.message,
      }));

    jobPromises.push(jobPromise);

    // Limit concurrent processing
    if (jobPromises.length >= maxConcurrent) {
      const results = await Promise.all(jobPromises);
      processedJobs.push(...results);
      jobPromises.length = 0; // Clear array for next batch
    }
  }

  // Wait for remaining jobs
  if (jobPromises.length > 0) {
    const results = await Promise.all(jobPromises);
    processedJobs.push(...results);
  }

  return {
    processed: processedJobs.length,
    jobs: processedJobs,
  };
}

/**
 * Process a single sync job
 */
async function processJob(job: any): Promise<{
  synced: number;
  skipped: number;
  errors: number;
}> {
  try {
    const website = await getWebsiteById(job.websiteId.toString());
    if (!website) {
      throw new Error(`Website not found: ${job.websiteId}`);
    }

    // Determine date range
    const startDate =
      job.startDate || new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endDate = job.endDate || new Date();

    // Process based on provider
    let result: { synced: number; skipped: number; errors: number };

    switch (job.provider) {
      case "stripe":
        const stripeApiKey = website.paymentProviders?.stripe?.apiKey;
        if (!stripeApiKey) {
          throw new Error("Stripe API key not configured");
        }
        result = await syncStripePayments(
          job.websiteId.toString(),
          stripeApiKey,
          startDate,
          endDate
        );
        break;

      case "lemonsqueezy":
        // TODO: Implement LemonSqueezy sync
        throw new Error("LemonSqueezy sync not yet implemented");

      case "polar":
        // TODO: Implement Polar sync
        throw new Error("Polar sync not yet implemented");

      case "paddle":
        // TODO: Implement Paddle sync
        throw new Error("Paddle sync not yet implemented");

      default:
        throw new Error(`Unsupported provider: ${job.provider}`);
    }

    // Update job status
    await updateSyncJobStatus(job._id.toString(), "completed", result);

    return result;
  } catch (error: any) {
    console.error(`Error processing job ${job._id}:`, error);

    // Check if we should retry
    if (job.retryCount < job.maxRetries) {
      // Increment retry count and reset to pending
      await incrementJobRetry(job._id.toString());
      throw error; // Re-throw to be handled by caller
    } else {
      // Max retries reached, mark as failed
      await updateSyncJobStatus(
        job._id.toString(),
        "failed",
        undefined,
        error.message
      );
      throw error;
    }
  }
}

/**
 * GET /api/cron/sync-payments
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Cron endpoint is active",
    schedule: "Configure in vercel.json or external cron service",
  });
}
