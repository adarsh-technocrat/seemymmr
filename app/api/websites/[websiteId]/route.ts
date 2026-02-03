import { NextRequest, NextResponse } from "next/server";
import {
  getWebsiteById,
  updateWebsite,
  deleteWebsite,
} from "@/utils/database/website";
import { getUserId } from "@/lib/get-session";
import { isValidObjectId } from "@/utils/validation";
import { sanitizeWebsiteForFrontend } from "@/utils/database/website-sanitize";
import {
  processStripeConfigChanges,
  detectStripeChanges,
  StripePaymentSyncer,
} from "@/utils/integrations/stripe";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  try {
    const { websiteId } = await params;
    if (!isValidObjectId(websiteId)) {
      return NextResponse.json(
        { error: "Invalid website ID" },
        { status: 400 },
      );
    }

    const website = await getWebsiteById(websiteId);

    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    const userId = await getUserId();
    if (!userId || website.userId.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const sanitizedWebsite = sanitizeWebsiteForFrontend(website);

    return NextResponse.json({ website: sanitizedWebsite }, { status: 200 });
  } catch (error) {
    console.error("Error fetching website:", error);
    return NextResponse.json(
      { error: "Failed to fetch website" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  try {
    const { websiteId } = await params;

    if (!isValidObjectId(websiteId)) {
      return NextResponse.json(
        { error: "Invalid website ID" },
        { status: 400 },
      );
    }

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

    const body = await request.json();
    const { name, domain, iconUrl, settings, paymentProviders } = body;

    const stripeConfigResult = await processStripeConfigChanges(
      websiteId,
      website,
      paymentProviders,
    );

    if (stripeConfigResult.error) {
      return NextResponse.json(
        { error: stripeConfigResult.error },
        { status: stripeConfigResult.statusCode || 400 },
      );
    }

    const updatedWebsite = await updateWebsite(websiteId, {
      name,
      domain,
      iconUrl,
      settings,
      paymentProviders,
    });

    const changes = detectStripeChanges(website, paymentProviders);

    // Stripe removal (delete payments + cancel jobs) is already done in processStripeConfigChanges → handleStripeRemoval

    if (changes.isNewStripeKey && paymentProviders?.stripe?.apiKey) {
      const syncer = new StripePaymentSyncer(paymentProviders.stripe.apiKey);
      syncer
        .syncPayments(
          new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000),
          new Date(),
          websiteId,
        )
        .catch((error) => {
          console.error(
            `Failed to sync Stripe payments for website ${websiteId}:`,
            error,
          );
        });
    }

    const sanitizedWebsite = sanitizeWebsiteForFrontend(updatedWebsite);

    return NextResponse.json({ website: sanitizedWebsite }, { status: 200 });
  } catch (error) {
    console.error("Error updating website:", error);
    return NextResponse.json(
      { error: "Failed to update website" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  try {
    const { websiteId } = await params;
    if (!isValidObjectId(websiteId)) {
      return NextResponse.json(
        { error: "Invalid website ID" },
        { status: 400 },
      );
    }

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

    await deleteWebsite(websiteId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting website:", error);
    return NextResponse.json(
      { error: "Failed to delete website" },
      { status: 500 },
    );
  }
}
