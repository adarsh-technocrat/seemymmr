import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db";
import PageView from "@/db/models/PageView";
import Session from "@/db/models/Session";
import Payment from "@/db/models/Payment";
import GoalEvent from "@/db/models/GoalEvent";
import { getWebsiteById } from "@/utils/database/website";
import { getUserId } from "@/lib/get-session";
import { Types } from "mongoose";

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

    await connectDB();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "today";
    const granularity = searchParams.get("granularity") || "daily";

    // Get timezone from website settings (default to Asia/Calcutta/IST)
    const timezone = website.settings?.timezone || "Asia/Calcutta";

    // Calculate date range (same logic as analytics route)
    let startDate: Date;
    let endDate: Date;

    const dateRange = getDateRangeForPeriod(period, timezone);
    startDate = dateRange.startDate;
    endDate = dateRange.endDate;

    const websiteObjectId = new Types.ObjectId(websiteId);

    // Get raw counts from database
    const pageViewCount = await PageView.countDocuments({
      websiteId: websiteObjectId,
      timestamp: { $gte: startDate, $lte: endDate },
    });

    const sessionCount = await Session.countDocuments({
      websiteId: websiteObjectId,
      firstVisitAt: { $gte: startDate, $lte: endDate },
    });

    const paymentCount = await Payment.countDocuments({
      websiteId: websiteObjectId,
      timestamp: { $gte: startDate, $lte: endDate },
    });

    const goalEventCount = await GoalEvent.countDocuments({
      websiteId: websiteObjectId,
      timestamp: { $gte: startDate, $lte: endDate },
    });

    // Get unique visitors
    const uniqueVisitors = await PageView.distinct("visitorId", {
      websiteId: websiteObjectId,
      timestamp: { $gte: startDate, $lte: endDate },
    });

    // Get total revenue
    const revenueResult = await Payment.aggregate([
      {
        $match: {
          websiteId: websiteObjectId,
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ["$refunded", false] }, "$amount", 0],
            },
          },
          totalRefunds: {
            $sum: {
              $cond: [{ $eq: ["$refunded", true] }, "$amount", 0],
            },
          },
        },
      },
    ]);

    // Get sample records to see actual timestamps
    const samplePageViews = await PageView.find({
      websiteId: websiteObjectId,
      timestamp: { $gte: startDate, $lte: endDate },
    })
      .sort({ timestamp: -1 })
      .limit(5)
      .select("timestamp visitorId path")
      .lean();

    const samplePayments = await Payment.find({
      websiteId: websiteObjectId,
      timestamp: { $gte: startDate, $lte: endDate },
    })
      .sort({ timestamp: -1 })
      .limit(5)
      .select("timestamp amount refunded renewal customerId")
      .lean();

    const sampleSessions = await Session.find({
      websiteId: websiteObjectId,
      firstVisitAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ firstVisitAt: -1 })
      .limit(5)
      .select("firstVisitAt lastSeenAt visitorId bounce duration")
      .lean();

    // Get latest records regardless of date range
    const latestPageView = await PageView.findOne({
      websiteId: websiteObjectId,
    })
      .sort({ timestamp: -1 })
      .select("timestamp visitorId path")
      .lean();

    const latestPayment = await Payment.findOne({
      websiteId: websiteObjectId,
    })
      .sort({ timestamp: -1 })
      .select("timestamp amount refunded renewal customerId")
      .lean();

    const latestSession = await Session.findOne({
      websiteId: websiteObjectId,
    })
      .sort({ firstVisitAt: -1 })
      .select("firstVisitAt lastSeenAt visitorId bounce duration")
      .lean();

    // Get date range info
    const now = new Date();
    const timezoneOffset = getTimezoneOffset(timezone, now);

    return NextResponse.json(
      {
        debug: {
          period,
          granularity,
          timezone,
          calculatedDateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            startDateLocal: startDate.toLocaleString("en-US", {
              timeZone: timezone,
            }),
            endDateLocal: endDate.toLocaleString("en-US", {
              timeZone: timezone,
            }),
          },
          currentTime: {
            utc: now.toISOString(),
            local: now.toLocaleString("en-US", { timeZone: timezone }),
            timezoneOffset: `${timezoneOffset / (60 * 60 * 1000)} hours`,
          },
        },
        databaseCounts: {
          pageViews: pageViewCount,
          sessions: sessionCount,
          payments: paymentCount,
          goalEvents: goalEventCount,
          uniqueVisitors: uniqueVisitors.length,
          totalRevenue: revenueResult[0]?.totalRevenue || 0,
          totalRefunds: revenueResult[0]?.totalRefunds || 0,
          netRevenue:
            (revenueResult[0]?.totalRevenue || 0) -
            (revenueResult[0]?.totalRefunds || 0),
        },
        sampleRecords: {
          pageViews: samplePageViews.map((pv) => ({
            timestamp: pv.timestamp,
            timestampLocal: new Date(pv.timestamp).toLocaleString("en-US", {
              timeZone: timezone,
            }),
            visitorId: pv.visitorId,
            path: pv.path,
          })),
          payments: samplePayments.map((p) => ({
            timestamp: p.timestamp,
            timestampLocal: new Date(p.timestamp).toLocaleString("en-US", {
              timeZone: timezone,
            }),
            amount: p.amount,
            refunded: p.refunded,
            renewal: p.renewal,
            customerId: p.customerId,
          })),
          sessions: sampleSessions.map((s) => ({
            firstVisitAt: s.firstVisitAt,
            firstVisitAtLocal: new Date(s.firstVisitAt).toLocaleString(
              "en-US",
              {
                timeZone: timezone,
              }
            ),
            lastSeenAt: s.lastSeenAt,
            visitorId: s.visitorId,
            bounce: s.bounce,
            duration: s.duration,
          })),
        },
        latestRecords: {
          latestPageView: latestPageView
            ? {
                timestamp: latestPageView.timestamp,
                timestampLocal: new Date(
                  latestPageView.timestamp
                ).toLocaleString("en-US", { timeZone: timezone }),
                visitorId: latestPageView.visitorId,
                path: latestPageView.path,
                isInRange:
                  latestPageView.timestamp >= startDate &&
                  latestPageView.timestamp <= endDate,
              }
            : null,
          latestPayment: latestPayment
            ? {
                timestamp: latestPayment.timestamp,
                timestampLocal: new Date(
                  latestPayment.timestamp
                ).toLocaleString("en-US", { timeZone: timezone }),
                amount: latestPayment.amount,
                refunded: latestPayment.refunded,
                renewal: latestPayment.renewal,
                isInRange:
                  latestPayment.timestamp >= startDate &&
                  latestPayment.timestamp <= endDate,
              }
            : null,
          latestSession: latestSession
            ? {
                firstVisitAt: latestSession.firstVisitAt,
                firstVisitAtLocal: new Date(
                  latestSession.firstVisitAt
                ).toLocaleString("en-US", { timeZone: timezone }),
                lastSeenAt: latestSession.lastSeenAt,
                isInRange:
                  latestSession.firstVisitAt >= startDate &&
                  latestSession.firstVisitAt <= endDate,
              }
            : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch debug info", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Get date range based on period string (same as analytics route)
 */
function getDateRangeForPeriod(
  period: string,
  timezone: string = "UTC"
): {
  startDate: Date;
  endDate: Date;
} {
  if (period.startsWith("custom:")) {
    const parts = period.split(":");
    if (parts.length === 3) {
      const startDate = new Date(parts[1] + "T00:00:00");
      const endDate = new Date(parts[2] + "T23:59:59");
      return { startDate, endDate };
    }
  }

  const periodLower = period.toLowerCase();
  const now = new Date();

  const getStartOfDayInTimezone = (date: Date, tz: string): Date => {
    const components = getTimezoneComponents(date, tz);
    return createUTCDateFromTimezoneComponents(
      components.year,
      components.month,
      components.day,
      0,
      tz
    );
  };

  const getEndOfDayInTimezone = (date: Date, tz: string): Date => {
    const startOfDay = getStartOfDayInTimezone(date, tz);
    return new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
  };

  let startDate: Date;
  let endDate: Date;

  switch (periodLower) {
    case "today":
      startDate = getStartOfDayInTimezone(now, timezone);
      endDate = getEndOfDayInTimezone(now, timezone);
      break;
    case "yesterday":
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      startDate = getStartOfDayInTimezone(yesterday, timezone);
      endDate = getEndOfDayInTimezone(yesterday, timezone);
      break;
    case "last24h":
    case "last 24 hours":
      endDate = new Date();
      startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = getStartOfDayInTimezone(now, timezone);
      endDate = getEndOfDayInTimezone(now, timezone);
  }

  return { startDate, endDate };
}

function getTimezoneOffset(timezone: string, date: Date): number {
  const utcDate = new Date(date.getTime());
  const utcComponents = {
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
    hour: utcDate.getUTCHours(),
  };
  const tzComponents = getTimezoneComponents(utcDate, timezone);

  const utcAsLocal = Date.UTC(
    utcComponents.year,
    utcComponents.month - 1,
    utcComponents.day,
    utcComponents.hour,
    0,
    0
  );
  const tzAsLocal = Date.UTC(
    tzComponents.year,
    tzComponents.month - 1,
    tzComponents.day,
    tzComponents.hour,
    0,
    0
  );

  return tzAsLocal - utcAsLocal;
}

function createUTCDateFromTimezoneComponents(
  year: number,
  month: number,
  day: number,
  hour: number,
  timezone: string
): Date {
  const utcTimestamp = Date.UTC(year, month - 1, day, hour, 0, 0);
  const testDate = new Date(utcTimestamp);
  const offsetMs = getTimezoneOffset(timezone, testDate);
  return new Date(utcTimestamp - offsetMs);
}

function getTimezoneComponents(utcDate: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(utcDate);
  const partsMap: Record<string, string> = {};
  parts.forEach((part) => {
    partsMap[part.type] = part.value;
  });

  return {
    year: parseInt(partsMap.year!),
    month: parseInt(partsMap.month!),
    day: parseInt(partsMap.day!),
    hour: parseInt(partsMap.hour!),
    minute: parseInt(partsMap.minute!),
  };
}
