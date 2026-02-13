import { NextRequest, NextResponse } from "next/server";
import { getWebsiteById } from "@/utils/database/website";
import { getUserId } from "@/lib/get-session";
import { getDateRangeForPeriod } from "@/lib/date-time-conversion";
import { getEarliestDataPoint } from "@/utils/analytics/earliest-data";
import { getSourceBreakdown } from "@/utils/analytics/aggregations/getSourceBreakdown.aggregation";
import { getReferrersBreakdown } from "@/utils/analytics/aggregations/getReferrersBreakdown.aggregation";
import { getCampaignBreakdown } from "@/utils/analytics/aggregations/getCampaignBreakdown.aggregation";
import { getChannelBreakdownWithReferrers } from "@/utils/analytics/aggregations/getChannelBreakdownWithReferrers.aggregation";
import { getPagesBreakdown } from "@/utils/analytics/aggregations/getPagesBreakdown.aggregation";
import { getHostnamesBreakdown } from "@/utils/analytics/aggregations/getHostnamesBreakdown.aggregation";
import { getEntryPagesBreakdown } from "@/utils/analytics/aggregations/getEntryPagesBreakdown.aggregation";
import { getExitLinksBreakdown } from "@/utils/analytics/aggregations/getExitLinksBreakdown.aggregation";
import { getLocationBreakdown } from "@/utils/analytics/aggregations/getLocationBreakdown.aggregation";
import { getSystemBreakdown } from "@/utils/analytics/aggregations/getSystemBreakdown.aggregation";

const VALID_BREAKDOWNS = [
  "source-channel",
  "source-referrer",
  "source-campaign",
  "source-keyword",
  "source-channels",
  "path-pages",
  "path-hostnames",
  "path-entry-pages",
  "path-exit-links",
  "location-country",
  "location-region",
  "location-city",
  "system-browser",
  "system-os",
  "system-device",
] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string; breakdown: string }> },
) {
  try {
    const { websiteId, breakdown } = await params;

    if (
      !VALID_BREAKDOWNS.includes(breakdown as (typeof VALID_BREAKDOWNS)[number])
    ) {
      return NextResponse.json(
        {
          error: "Invalid breakdown",
          validBreakdowns: VALID_BREAKDOWNS,
        },
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

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "today";
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const timezone = website.settings?.timezone || "Asia/Calcutta";

    let startDate: Date;
    let endDate: Date;

    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);
    } else {
      const isAllTime =
        period.toLowerCase() === "all" || period.toLowerCase() === "all time";
      const earliestDataPoint = isAllTime
        ? await getEarliestDataPoint(websiteId)
        : null;
      const dateRange = getDateRangeForPeriod(
        period,
        timezone,
        website,
        earliestDataPoint,
      );
      startDate = dateRange.startDate;
      endDate = dateRange.endDate;
    }

    let data: unknown;

    switch (breakdown) {
      case "source-channel":
        data = await getSourceBreakdown(
          websiteId,
          startDate,
          endDate,
          "channel",
        );
        break;
      case "source-referrer":
        data = await getReferrersBreakdown(websiteId, startDate, endDate);
        break;
      case "source-campaign":
        data = await getCampaignBreakdown(websiteId, startDate, endDate);
        break;
      case "source-keyword":
        data = await getSourceBreakdown(
          websiteId,
          startDate,
          endDate,
          "keyword",
        );
        break;
      case "source-channels":
        data = await getChannelBreakdownWithReferrers(
          websiteId,
          startDate,
          endDate,
        );
        break;
      case "path-pages":
        data = await getPagesBreakdown(websiteId, startDate, endDate);
        break;
      case "path-hostnames":
        data = await getHostnamesBreakdown(websiteId, startDate, endDate);
        break;
      case "path-entry-pages":
        data = await getEntryPagesBreakdown(websiteId, startDate, endDate);
        break;
      case "path-exit-links":
        data = await getExitLinksBreakdown(websiteId, startDate, endDate);
        break;
      case "location-country":
        data = await getLocationBreakdown(
          websiteId,
          startDate,
          endDate,
          "country",
        );
        break;
      case "location-region":
        data = await getLocationBreakdown(
          websiteId,
          startDate,
          endDate,
          "region",
        );
        break;
      case "location-city":
        data = await getLocationBreakdown(
          websiteId,
          startDate,
          endDate,
          "city",
        );
        break;
      case "system-browser":
        data = await getSystemBreakdown(
          websiteId,
          startDate,
          endDate,
          "browser",
        );
        break;
      case "system-os":
        data = await getSystemBreakdown(websiteId, startDate, endDate, "os");
        break;
      case "system-device":
        data = await getSystemBreakdown(
          websiteId,
          startDate,
          endDate,
          "device",
        );
        break;
      default:
        return NextResponse.json(
          { error: "Invalid breakdown" },
          { status: 400 },
        );
    }

    return NextResponse.json(
      { breakdown, startDate, endDate, timezone, data },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch breakdown" },
      { status: 500 },
    );
  }
}
