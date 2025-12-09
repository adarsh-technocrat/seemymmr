import { NextRequest, NextResponse } from "next/server";
import {
  getVisitorsOverTime,
  getRevenueOverTime,
  getSourceBreakdown,
  getPathBreakdown,
  getLocationBreakdown,
  getSystemBreakdown,
  getMetrics,
  getVisitorsNow,
  type Granularity,
} from "@/utils/analytics/aggregations";
import { getWebsiteById } from "@/utils/database/website";
import { getUserId } from "@/lib/get-session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const { websiteId } = await params;
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const granularity = (searchParams.get("granularity") ||
      "daily") as Granularity;

    // Default to last 30 days if not provided
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    const startDate = startDateStr
      ? new Date(startDateStr)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get all analytics data
    // Note: All data comes from our database (source of truth)
    // Revenue data is synced from Stripe when the key is added and kept up-to-date via webhooks
    // Revenue components are returned separately (revenue, revenueNew, revenueRefund)
    // Frontend should calculate net revenue if needed (revenue - revenueRefund)
    const [
      visitors,
      revenue,
      metrics,
      visitorsNow,
      sourceChannel,
      sourceReferrer,
      sourceCampaign,
      sourceKeyword,
      pathPage,
      pathHostname,
      locationCountry,
      locationRegion,
      locationCity,
      systemBrowser,
      systemOS,
      systemDevice,
    ] = await Promise.all([
      getVisitorsOverTime(websiteId, startDate, endDate, granularity),
      // Revenue data from database - synced from Stripe API
      getRevenueOverTime(websiteId, startDate, endDate, granularity),
      getMetrics(websiteId, startDate, endDate),
      getVisitorsNow(websiteId),
      getSourceBreakdown(websiteId, startDate, endDate, "channel"),
      getSourceBreakdown(websiteId, startDate, endDate, "referrer"),
      getSourceBreakdown(websiteId, startDate, endDate, "campaign"),
      getSourceBreakdown(websiteId, startDate, endDate, "keyword"),
      getPathBreakdown(websiteId, startDate, endDate, "page"),
      getPathBreakdown(websiteId, startDate, endDate, "hostname"),
      getLocationBreakdown(websiteId, startDate, endDate, "country"),
      getLocationBreakdown(websiteId, startDate, endDate, "region"),
      getLocationBreakdown(websiteId, startDate, endDate, "city"),
      getSystemBreakdown(websiteId, startDate, endDate, "browser"),
      getSystemBreakdown(websiteId, startDate, endDate, "os"),
      getSystemBreakdown(websiteId, startDate, endDate, "device"),
    ]);

    // Format response
    const response = {
      visitors,
      revenue,
      metrics: {
        visitors: formatNumber(metrics.visitors),
        revenue: formatCurrency(metrics.revenue),
        conversionRate: `${metrics.conversionRate.toFixed(2)}%`,
        revenuePerVisitor: formatCurrency(metrics.revenuePerVisitor),
        bounceRate: `${metrics.bounceRate.toFixed(0)}%`,
        sessionTime: formatDuration(metrics.sessionTime),
        visitorsNow: visitorsNow.toString(),
      },
      breakdowns: {
        source: {
          channel: sourceChannel,
          referrer: sourceReferrer,
          campaign: sourceCampaign,
          keyword: sourceKeyword,
        },
        path: {
          page: pathPage,
          hostname: pathHostname,
        },
        location: {
          country: locationCountry,
          region: locationRegion,
          city: locationCity,
        },
        system: {
          browser: systemBrowser,
          os: systemOS,
          device: systemDevice,
        },
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

/**
 * Format number with K, M suffixes
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toString();
}

/**
 * Format currency
 */
function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000000) {
    return "$" + (dollars / 1000000).toFixed(1) + "M";
  }
  if (dollars >= 1000) {
    return "$" + (dollars / 1000).toFixed(1) + "k";
  }
  return "$" + dollars.toFixed(2);
}

/**
 * Format duration in seconds to human readable
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}
