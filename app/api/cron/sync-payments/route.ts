import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import { enqueueSyncJob } from "@/utils/jobs/queue";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    await connectDB();

    const websites = await Website.find({
      "paymentProviders.stripe.apiKey": { $exists: true, $ne: null },
    });

    const jobsCreated: Array<{
      websiteId: string;
      provider: string;
      jobId: string;
    }> = [];

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 15 * 60 * 1000);
    const syncRange: "custom" = "custom";

    for (const website of websites) {
      const websiteId = website._id.toString();

      if (website.paymentProviders?.stripe?.apiKey) {
        const syncConfig = website.paymentProviders.stripe.syncConfig;
        if (syncConfig?.enabled !== false) {
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
          }
        }
      }
    }

    // Trigger job processing in background so cron returns before serverless timeout.
    // Pending jobs are also processed by the separate /api/cron/process-jobs cron.
    void triggerJobProcessing().catch((err) =>
      console.error("Background job processing error:", err),
    );

    return NextResponse.json({
      success: true,
      websitesProcessed: websites.length,
      jobsCreated: jobsCreated.length,
      jobs: jobsCreated,
      processed: 0,
      processedJobs: [],
      message:
        jobsCreated.length > 0
          ? "Jobs enqueued; processing runs in background and via process-jobs cron."
          : undefined,
    });
  } catch (error: any) {
    console.error("Error in cron sync-payments:", error);
    return NextResponse.json(
      {
        error: "Failed to create sync jobs",
        message: error.message,
      },
      { status: 500 },
    );
  }
}

async function triggerJobProcessing(): Promise<{
  processed: number;
  jobs: Array<{ jobId: string; status: string; result?: any; error?: string }>;
}> {
  try {
    const baseUrl = getBaseUrl();
    const cronSecret = process.env.CRON_SECRET;

    const response = await fetch(`${baseUrl}/api/jobs/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cronSecret && {
          Authorization: `Bearer ${cronSecret}`,
        }),
      },
      body: JSON.stringify({ batchSize: 10, maxConcurrent: 3 }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to process jobs: ${response.status} ${errorText}`);
      return { processed: 0, jobs: [] };
    }

    const data = await response.json();
    return {
      processed: data.processed || 0,
      jobs: data.jobs || [],
    };
  } catch (error: any) {
    console.error("Error triggering job processing:", error);
    return { processed: 0, jobs: [] };
  }
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

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Cron endpoint is active",
    schedule: "Configure in vercel.json or external cron service",
  });
}
