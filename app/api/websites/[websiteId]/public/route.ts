import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import crypto from "crypto";
import { getSession } from "@/lib/get-session";

/**
 * GET /api/websites/[websiteId]/public
 * Get public dashboard data (no authentication required if shareId matches)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const { websiteId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const shareId = searchParams.get("shareId");

    await connectDB();

    const website = await Website.findById(websiteId);

    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    // Check if public dashboard is enabled and shareId matches
    if (
      !website.settings?.publicDashboard?.enabled ||
      website.settings.publicDashboard.shareId !== shareId
    ) {
      return NextResponse.json(
        { error: "Public dashboard not available" },
        { status: 403 }
      );
    }

    // Return public analytics data (limited data, no sensitive info)
    // You'd implement actual analytics aggregation here
    return NextResponse.json({
      website: {
        name: website.name,
        domain: website.domain,
      },
      // Add public analytics data here
      message: "Public dashboard data",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch public dashboard" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/websites/[websiteId]/public
 * Enable/disable public dashboard and generate shareId
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

    const body = await request.json();
    const { enabled } = body;

    let shareId = website.settings?.publicDashboard?.shareId;

    // Generate shareId if enabling and doesn't exist
    if (enabled && !shareId) {
      shareId = crypto.randomBytes(16).toString("hex");
    }

    // Update website
    await Website.findByIdAndUpdate(websiteId, {
      "settings.publicDashboard": {
        enabled: enabled ?? false,
        shareId: enabled ? shareId : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      publicDashboard: {
        enabled: enabled ?? false,
        shareId: enabled ? shareId : undefined,
        url: enabled
          ? `${process.env.NEXT_PUBLIC_APP_URL}/api/websites/${websiteId}/public?shareId=${shareId}`
          : undefined,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update public dashboard" },
      { status: 500 }
    );
  }
}
