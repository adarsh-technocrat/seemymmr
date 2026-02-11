import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/get-session";
import { getWebsiteById } from "@/utils/database/website";
import { syncStripePayments } from "@/utils/integrations/stripe";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
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
    const provider = body.provider || "stripe";
    const startDateStr = body.startDate;
    const endDateStr = body.endDate;

    // Determine date range
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);
    } else {
      // Default: sync last 24 hours
      endDate = new Date();
      startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
    }

    // Only Stripe is supported for now
    if (provider !== "stripe") {
      return NextResponse.json(
        { error: `Provider ${provider} is not yet supported` },
        { status: 400 },
      );
    }

    const stripeApiKey = website.paymentProviders?.stripe?.apiKey;
    if (!stripeApiKey) {
      return NextResponse.json(
        { error: "Stripe API key is not configured" },
        { status: 400 },
      );
    }

    // Sync payments directly
    const result = await syncStripePayments(
      websiteId,
      stripeApiKey,
      startDate,
      endDate,
    );

    return NextResponse.json({
      success: true,
      synced: result.synced,
      skipped: result.skipped,
      errors: result.errors,
      message: `Synced ${result.synced} payments, skipped ${result.skipped} duplicates, ${result.errors} errors`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create sync job", message: error.message },
      { status: 500 },
    );
  }
}

/**
 * GET /api/websites/[websiteId]/sync
 * Get sync status for a website
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
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

    return NextResponse.json({
      websiteId,
      syncStatus,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to get sync status", message: error.message },
      { status: 500 },
    );
  }
}
