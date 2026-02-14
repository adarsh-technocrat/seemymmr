import { NextRequest, NextResponse } from "next/server";
import { getWebsiteById, updateWebsite } from "@/utils/database/website";
import { getUserId } from "@/lib/get-session";
import { isValidObjectId } from "@/utils/validation";
import { sanitizeWebsiteForFrontend } from "@/utils/database/website-sanitize";
import { handleStripeRemoval } from "@/utils/integrations/stripe";

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

    if (!website.paymentProviders?.stripe?.apiKey) {
      return NextResponse.json(
        { error: "Stripe is not connected for this website" },
        { status: 400 },
      );
    }

    await handleStripeRemoval(websiteId);

    const paymentProviders = { ...website.paymentProviders };
    delete (paymentProviders as any).stripe;

    const updatedWebsite = await updateWebsite(websiteId, {
      paymentProviders,
    });

    const sanitizedWebsite = sanitizeWebsiteForFrontend(updatedWebsite);
    return NextResponse.json(
      { website: sanitizedWebsite, success: true },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to disconnect Stripe" },
      { status: 500 },
    );
  }
}
