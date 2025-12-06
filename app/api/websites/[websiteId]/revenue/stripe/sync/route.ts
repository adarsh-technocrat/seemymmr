import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import { syncStripePayments } from "@/utils/integrations/stripe";

/**
 * POST /api/websites/[websiteId]/revenue/stripe/sync
 * Manually trigger Stripe payment sync
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const { websiteId } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Verify user owns this website
    const website = await Website.findOne({
      _id: websiteId,
      userId: session.user.id,
    });

    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    // Check if Stripe is connected
    const stripeApiKey = website.paymentProviders?.stripe?.apiKey;
    if (!stripeApiKey) {
      return NextResponse.json(
        { error: "Stripe is not connected for this website" },
        { status: 400 }
      );
    }

    // Get optional date range from query params
    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    // Sync Stripe payments
    const result = await syncStripePayments(
      websiteId,
      stripeApiKey,
      startDate,
      endDate
    );

    return NextResponse.json({
      success: true,
      synced: result.synced,
      skipped: result.skipped,
      errors: result.errors,
      message: `Synced ${result.synced} payments, skipped ${result.skipped} duplicates, ${result.errors} errors`,
    });
  } catch (error: any) {
    console.error("Error syncing Stripe payments:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to sync Stripe payments",
        details:
          error.type === "StripeAuthenticationError"
            ? "Invalid Stripe API key. Please check your key and try again."
            : undefined,
      },
      { status: 500 }
    );
  }
}
