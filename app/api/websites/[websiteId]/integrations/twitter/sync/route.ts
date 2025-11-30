import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import { syncTwitterMentions } from "@/utils/integrations/twitter";

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

    // Check if Twitter integration is enabled
    if (!website.integrations?.twitter?.enabled) {
      return NextResponse.json(
        { error: "Twitter integration is not enabled" },
        { status: 400 }
      );
    }

    const username = website.integrations.twitter.username;
    const bearerToken = website.integrations.twitter.bearerToken;

    if (!username || !bearerToken) {
      return NextResponse.json(
        { error: "Twitter credentials not configured" },
        { status: 400 }
      );
    }

    // Sync mentions
    const count = await syncTwitterMentions(websiteId, username, bearerToken);

    return NextResponse.json({
      success: true,
      synced: count,
      message: `Synced ${count} new mentions`,
    });
  } catch (error: any) {
    console.error("Error syncing Twitter mentions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync Twitter mentions" },
      { status: 500 }
    );
  }
}
