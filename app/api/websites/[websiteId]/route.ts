import { NextRequest, NextResponse } from "next/server";
import {
  getWebsiteById,
  updateWebsite,
  deleteWebsite,
} from "@/utils/database/website";
import { getUserId } from "@/lib/get-session";
import { isValidObjectId } from "@/utils/validation";
import Stripe from "stripe";
import { sanitizeWebsiteForFrontend } from "@/utils/database/website-sanitize";
import { syncStripePayments } from "@/utils/integrations/stripe";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const { websiteId } = await params;
    if (!isValidObjectId(websiteId)) {
      return NextResponse.json(
        { error: "Invalid website ID" },
        { status: 400 }
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
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const { websiteId } = await params;

    if (!isValidObjectId(websiteId)) {
      return NextResponse.json(
        { error: "Invalid website ID" },
        { status: 400 }
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

    // Check if this is a new Stripe key being added
    const isNewStripeKey =
      paymentProviders?.stripe?.apiKey &&
      website.paymentProviders?.stripe?.apiKey !==
        paymentProviders.stripe.apiKey;

    if (paymentProviders?.stripe?.apiKey) {
      const apiKey = paymentProviders.stripe.apiKey.trim();
      if (!apiKey.startsWith("rk_")) {
        return NextResponse.json(
          {
            error:
              "Please use a restricted API key (starts with 'rk_'). Create a restricted API key with Core (Read), Billing (Read), Checkout (Read), and Webhook (Write) permissions.",
          },
          { status: 400 }
        );
      }

      try {
        const stripe = new Stripe(apiKey, {
          apiVersion: "2025-11-17.clover",
        });
        await stripe.balance.retrieve();
        await stripe.customers.list({ limit: 1 });
        await stripe.checkout.sessions.list({ limit: 1 });
      } catch (error: any) {
        if (error.type === "StripeAuthenticationError") {
          return NextResponse.json(
            {
              error:
                "Invalid Stripe API key. Please check your key and try again.",
            },
            { status: 400 }
          );
        }

        const errorCode = error.code || "";
        const errorMessage = (error.message || "").toLowerCase();
        const errorType = error.type || "";
        const statusCode = error.statusCode || 0;

        if (
          errorType === "StripePermissionError" ||
          errorCode === "resource_missing" ||
          errorMessage.includes("permission") ||
          errorMessage.includes("forbidden") ||
          errorMessage.includes("not allowed") ||
          errorMessage.includes("insufficient permissions") ||
          errorCode === "api_key_expired" ||
          statusCode === 403
        ) {
          return NextResponse.json(
            {
              error:
                "Stripe API key doesn't have the required permissions. Please create a restricted API key with Core (Read), Billing (Read), Checkout (Read), and Webhook (Write) permissions.",
            },
            { status: 400 }
          );
        }
        console.error("Stripe validation error:", {
          type: error.type,
          code: error.code,
          message: error.message,
        });

        return NextResponse.json(
          {
            error:
              error.message ||
              "Failed to validate Stripe API key. Please check that your restricted key has Core (Read), Billing (Read), Checkout (Read), and Webhook (Write) permissions.",
          },
          { status: 400 }
        );
      }
    }

    const updatedWebsite = await updateWebsite(websiteId, {
      name,
      domain,
      iconUrl,
      settings,
      paymentProviders,
    });

    // Auto-sync Stripe payments in the background when a new key is added
    if (isNewStripeKey && paymentProviders?.stripe?.apiKey) {
      // Run sync in background (don't await - let it run async)
      syncStripePayments(websiteId, paymentProviders.stripe.apiKey).catch(
        (error) => {
          console.error(
            `Background Stripe sync failed for website ${websiteId}:`,
            error
          );
          // Don't throw - this is a background operation
        }
      );
    }

    const sanitizedWebsite = sanitizeWebsiteForFrontend(updatedWebsite);

    return NextResponse.json({ website: sanitizedWebsite }, { status: 200 });
  } catch (error) {
    console.error("Error updating website:", error);
    return NextResponse.json(
      { error: "Failed to update website" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const { websiteId } = await params;
    if (!isValidObjectId(websiteId)) {
      return NextResponse.json(
        { error: "Invalid website ID" },
        { status: 400 }
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
      { status: 500 }
    );
  }
}
