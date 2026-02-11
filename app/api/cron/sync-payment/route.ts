import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import { syncStripePayments } from "@/utils/integrations/stripe";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const websites = await Website.find({
      "paymentProviders.stripe.apiKey": { $exists: true, $ne: null },
      "paymentProviders.stripe.syncConfig.enabled": { $ne: false },
      "paymentProviders.stripe.syncConfig.frequency": "realtime",
    });

    const results: Array<{
      websiteId: string;
      synced: number;
      skipped: number;
      errors: number;
    }> = [];

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 15 * 60 * 1000);

    const syncPromises = websites
      .filter((w) => w.paymentProviders?.stripe?.apiKey)
      .map(async (website) => {
        const websiteId = website._id.toString();
        const stripeApiKey = website.paymentProviders!.stripe!.apiKey!;
        try {
          const result = await syncStripePayments(
            websiteId,
            stripeApiKey,
            startDate,
            endDate,
          );
          return {
            websiteId,
            synced: result.synced,
            skipped: result.skipped,
            errors: result.errors,
          };
        } catch (err) {
          const error = err as Error & { websiteId?: string };
          error.websiteId = websiteId;
          throw error;
        }
      });

    const settled = await Promise.allSettled(syncPromises);
    for (const s of settled) {
      if (s.status === "fulfilled") {
        results.push(s.value);
      } else {
        const websiteId =
          (s.reason as Error & { websiteId?: string })?.websiteId ?? "unknown";
        results.push({
          websiteId,
          synced: 0,
          skipped: 0,
          errors: 1,
        });
      }
    }

    const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
    const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

    return NextResponse.json({
      success: true,
      websitesProcessed: websites.length,
      totalSynced,
      totalSkipped,
      totalErrors,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to sync realtime payments",
        message: error?.message,
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Realtime payment sync cron endpoint is active",
  });
}
