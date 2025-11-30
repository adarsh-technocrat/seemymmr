import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import { syncSearchConsoleData } from "@/utils/integrations/search-console";

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

    // Check if Google Search Console integration is enabled
    if (!website.integrations?.googleSearchConsole?.enabled) {
      return NextResponse.json(
        { error: "Google Search Console integration is not enabled" },
        { status: 400 }
      );
    }

    const propertyUrl = website.integrations.googleSearchConsole.propertyUrl;
    const accessToken = website.integrations.googleSearchConsole.accessToken;
    const refreshToken = website.integrations.googleSearchConsole.refreshToken;

    if (!propertyUrl || !accessToken || !refreshToken) {
      return NextResponse.json(
        { error: "Google Search Console credentials not configured" },
        { status: 400 }
      );
    }

    // Sync data
    const count = await syncSearchConsoleData(
      websiteId,
      propertyUrl,
      accessToken,
      refreshToken
    );

    return NextResponse.json({
      success: true,
      synced: count,
      message: `Synced ${count} new search data rows`,
    });
  } catch (error: any) {
    console.error("Error syncing Search Console data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync Search Console data" },
      { status: 500 }
    );
  }
}
