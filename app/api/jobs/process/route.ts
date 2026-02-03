import { NextRequest, NextResponse } from "next/server";
import {
  dequeueSyncJob,
  updateSyncJobStatus,
  incrementJobRetry,
  calculateNextSyncDate,
} from "@/utils/jobs/queue";
import { syncStripePayments } from "@/utils/integrations/stripe";
import { getWebsiteById } from "@/utils/database/website";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const batchSize = body.batchSize || 10; // Process up to 10 jobs at a time
    const maxConcurrent = body.maxConcurrent || 3; // Process 3 jobs concurrently

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
        await Promise.all(jobPromises);
        jobPromises.length = 0; // Clear array for next batch
      }
    }

    // Wait for remaining jobs
    const processedJobs = await Promise.all(jobPromises);

    return NextResponse.json({
      success: true,
      processed: processedJobs.length,
      jobs: processedJobs,
    });
  } catch (error: any) {
    console.error("Error processing jobs:", error);
    return NextResponse.json(
      { error: "Failed to process jobs", message: error.message },
      { status: 500 },
    );
  }
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
          endDate,
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

    if (
      job.type === "cron" &&
      job.provider === "stripe" &&
      website?.paymentProviders?.stripe?.syncConfig
    ) {
      const syncConfig = website.paymentProviders.stripe.syncConfig;
      const nextSync = calculateNextSyncDate(
        syncConfig.frequency || "realtime",
      );
      website.paymentProviders.stripe.syncConfig = {
        ...syncConfig,
        lastSyncAt: new Date(),
        nextSyncAt: nextSync,
      };
      await website.save();
    }

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
        error.message,
      );
      throw error;
    }
  }
}
