import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import { getVisitorsNow } from "@/utils/analytics/aggregations/getVisitorsNow.aggregation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
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

    if (
      !website.settings?.publicDashboard?.enabled ||
      website.settings.publicDashboard.shareId !== shareId
    ) {
      return NextResponse.json(
        { error: "Widget not available" },
        { status: 403 },
      );
    }

    const visitorsNow = await getVisitorsNow(websiteId);

    return NextResponse.json({ visitorsNow });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch widget data" },
      { status: 500 },
    );
  }
}
