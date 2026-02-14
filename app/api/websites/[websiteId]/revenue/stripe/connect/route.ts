import { NextRequest, NextResponse } from "next/server";
import { getWebsiteById, updateWebsite } from "@/utils/database/website";
import { getUserId } from "@/lib/get-session";
import { isValidObjectId } from "@/utils/validation";
import { sanitizeWebsiteForFrontend } from "@/utils/database/website-sanitize";
import {
  validateStripeApiKey,
  initializeStripeSyncConfig,
  syncStripePayments,
} from "@/utils/integrations/stripe";

export async function POST(
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
    const apiKey = body?.apiKey?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Stripe API key is required" },
        { status: 400 },
      );
    }

    const validation = await validateStripeApiKey(apiKey);
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.statusCode ?? 400 },
      );
    }

    const paymentProviders = {
      ...website.paymentProviders,
      stripe: {
        apiKey,
        ...(website.paymentProviders?.stripe?.webhookSecret && {
          webhookSecret: website.paymentProviders.stripe.webhookSecret,
        }),
      },
    };
    initializeStripeSyncConfig(paymentProviders);

    const updatedWebsite = await updateWebsite(websiteId, {
      paymentProviders,
    });

    const twoYearsAgo = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000);
    syncStripePayments(websiteId, apiKey, twoYearsAgo, new Date()).catch(
      () => {},
    );

    const sanitizedWebsite = sanitizeWebsiteForFrontend(updatedWebsite);
    return NextResponse.json(
      { website: sanitizedWebsite, success: true },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to connect Stripe" },
      { status: 500 },
    );
  }
}
