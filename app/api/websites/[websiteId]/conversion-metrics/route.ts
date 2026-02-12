import { NextResponse } from "next/server";
import { getWebsiteById } from "@/utils/database/website";
import { getUserId } from "@/lib/get-session";
import { getConversionMetrics } from "@/utils/analytics/aggregations/getConversionMetrics.aggregation";
import type { ConversionMetricsResponse } from "@/types/conversion-metrics";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  try {
    const { websiteId } = await params;
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

    const start = Date.now();
    const conversionMetrics = await getConversionMetrics(websiteId);
    const processingTime = Date.now() - start;

    const response: ConversionMetricsResponse = {
      conversionMetrics: {
        ...conversionMetrics,
        processingTime,
        id: websiteId,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch conversion metrics" },
      { status: 500 },
    );
  }
}
