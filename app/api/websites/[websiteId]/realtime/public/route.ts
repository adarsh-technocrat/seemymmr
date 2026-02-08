import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import crypto from "crypto";
import { getSession } from "@/lib/get-session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
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

    let shareId = website.settings?.publicRealtimeGlobe?.shareId;

    // Generate shareId if enabling and doesn't exist
    if (enabled && !shareId) {
      shareId = crypto.randomBytes(16).toString("hex");
    }

    // Update website
    await Website.findByIdAndUpdate(websiteId, {
      "settings.publicRealtimeGlobe": {
        enabled: enabled ?? false,
        shareId: enabled ? shareId : undefined,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    return NextResponse.json({
      success: true,
      publicRealtimeGlobe: {
        enabled: enabled ?? false,
        shareId: enabled ? shareId : undefined,
        url: enabled
          ? `${baseUrl}/globe/${websiteId}?shareId=${shareId}`
          : undefined,
      },
    });
  } catch (error: any) {
    console.error("Error updating public realtime globe:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update public realtime globe" },
      { status: 500 },
    );
  }
}

// GET method removed - now handled by unified /realtime endpoint
// This endpoint only handles POST (enable/disable sharing)
