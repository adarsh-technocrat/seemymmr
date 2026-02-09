import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/get-session";
import { getWebsiteById } from "@/utils/database/website";
import {
  enqueueSyncJob,
  getRecentJobsForWebsite,
  getPendingJobsForWebsite,
} from "@/utils/jobs/queue";
import type { SyncJobProvider } from "@/db/models/SyncJob";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const { websiteId } = await params;
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const website = await getWebsiteById(websiteId);
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    if (website.userId.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const provider = (body.provider || "stripe") as SyncJobProvider;
    const startDateStr = body.startDate;
    const endDateStr = body.endDate;

    // Determine date range
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    let syncRange: "today" | "last24h" | "last7d" | "custom" | undefined;

    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);
      syncRange = "custom";
    } else {
      // Default: sync last 24 hours
      endDate = new Date();
      startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      syncRange = "last24h";
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
    const providerConfig = website.paymentProviders?.[providerKey];
    if (!providerConfig) {
      return NextResponse.json(
        { error: `Provider ${provider} is not configured for this website` },
        { status: 400 }
      );
    }

    // For Stripe, check API key
    if (
      provider === "stripe" &&
      "apiKey" in providerConfig &&
      !providerConfig.apiKey
    ) {
      return NextResponse.json(
        { error: "Stripe API key is not configured" },
        { status: 400 }
      );
    }

    // Create sync job
    const job = await enqueueSyncJob({
      websiteId,
      provider,
      type: "manual",
      priority: 80, // High priority for manual syncs
      startDate,
      endDate,
      syncRange,
    });

    return NextResponse.json({
      success: true,
      jobId: job._id.toString(),
      status: "pending",
      message: "Sync job created successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create sync job", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/websites/[websiteId]/sync
 * Get sync status and recent sync jobs for a website
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const { websiteId } = await params;
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const website = await getWebsiteById(websiteId);
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    if (website.userId.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get recent sync jobs
    const recentJobs = await getRecentJobsForWebsite(websiteId, 10);

    // Get sync status for each provider
    const syncStatus: Record<string, any> = {};

    if (website.paymentProviders?.stripe) {
      const stripeConfig = website.paymentProviders.stripe.syncConfig;
      syncStatus.stripe = {
        configured: !!website.paymentProviders.stripe.apiKey,
        enabled: stripeConfig?.enabled !== false,
        frequency: stripeConfig?.frequency || "realtime",
        lastSyncAt: stripeConfig?.lastSyncAt,
        nextSyncAt: stripeConfig?.nextSyncAt,
      };
    }

    // Get pending/processing jobs count
    const pendingJobs = await getPendingJobsForWebsite(websiteId);

    return NextResponse.json({
      websiteId,
      syncStatus,
      recentJobs: recentJobs.map((job) => ({
        id: job._id.toString(),
        provider: job.provider,
        type: job.type,
        status: job.status,
        priority: job.priority,
        result: job.result,
        error: job.error,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      })),
      pendingJobs: pendingJobs.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to get sync status", message: error.message },
      { status: 500 }
    );
  }
}
