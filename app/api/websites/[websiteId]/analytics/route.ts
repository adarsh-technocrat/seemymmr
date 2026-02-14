import { NextRequest, NextResponse } from "next/server";
import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";
import { add, differenceInMilliseconds } from "date-fns";
import { getVisitorsOverTime } from "@/utils/analytics/aggregations/getVisitorsOverTime.aggregation";
import { getRevenueOverTime } from "@/utils/analytics/aggregations/getRevenueOverTime.aggregation";
import { getCustomersAndSalesOverTime } from "@/utils/analytics/aggregations/getCustomersAndSalesOverTime.aggregation";
import { getGoalsOverTime } from "@/utils/analytics/aggregations/getGoalsOverTime.aggregation";
import { getMetrics } from "@/utils/analytics/aggregations/getMetrics.aggregation";
import type { Granularity } from "@/utils/analytics/types";
import { getWebsiteById } from "@/utils/database/website";
import { getUserId } from "@/lib/get-session";
import { getDateRangeForPeriod } from "@/lib/date-time-conversion";
import { type TimeZone } from "timezones-list";

/** Payment amounts are stored in cents; convert to dollars for API response. */
const CENTS_TO_DOLLARS = 1 / 100;

/** Truncate to start of hour in timezone so buckets align with $dateTrunc(unit: "hour", timezone). */
function startOfHourInTimezone(date: Date, timezone: string): Date {
  const zoned = toZonedTime(date, timezone);
  zoned.setMinutes(0, 0, 0);
  return fromZonedTime(zoned, timezone);
}

/** Start of month in timezone (aligns with $dateTrunc unit "month"). */
function startOfMonthInTimezone(date: Date, timezone: string): Date {
  const zoned = toZonedTime(date, timezone);
  zoned.setDate(1);
  zoned.setHours(0, 0, 0, 0);
  return fromZonedTime(zoned, timezone);
}

/** Start of week (Monday) in timezone (aligns with $dateTrunc unit "week"). */
function startOfWeekInTimezone(date: Date, timezone: string): Date {
  const y = parseInt(formatInTimeZone(date, timezone, "yyyy"), 10);
  const mo = parseInt(formatInTimeZone(date, timezone, "MM"), 10);
  const day = parseInt(formatInTimeZone(date, timezone, "dd"), 10);
  const e = parseInt(formatInTimeZone(date, timezone, "e"), 10);
  const mondayDate = new Date(y, mo - 1, day, 0, 0, 0, 0);
  mondayDate.setDate(mondayDate.getDate() - (e - 1));
  return fromZonedTime(mondayDate, timezone);
}

function getBucketDates(
  startDate: Date,
  endDate: Date,
  granularity: Granularity,
  timezone?: string,
): Date[] {
  const buckets: Date[] = [];
  let cursor: Date;
  const step =
    granularity === "hourly"
      ? { hours: 1 }
      : granularity === "daily"
        ? { days: 1 }
        : granularity === "weekly"
          ? { weeks: 1 }
          : { months: 1 };

  if (granularity === "hourly" && timezone) {
    cursor = startOfHourInTimezone(startDate, timezone);
  } else if (granularity === "weekly" && timezone) {
    cursor = startOfWeekInTimezone(startDate, timezone);
  } else if (granularity === "monthly" && timezone) {
    cursor = startOfMonthInTimezone(startDate, timezone);
  } else {
    cursor = new Date(startDate.getTime());
  }

  while (cursor <= endDate) {
    buckets.push(new Date(cursor.getTime()));
    cursor = add(cursor, step);
  }
  return buckets;
}

function getPreviousPeriodRange(
  startDate: Date,
  endDate: Date,
): { startDate: Date; endDate: Date } {
  const spanMs = differenceInMilliseconds(endDate, startDate);
  return {
    startDate: new Date(startDate.getTime() - spanMs),
    endDate: new Date(startDate.getTime() - 1),
  };
}

function formatBucketLabel(
  date: Date,
  granularity: Granularity,
  timezone: string,
): string {
  const zonedDate = toZonedTime(date, timezone);
  const currentYear = new Date().getFullYear();
  const yearInTz = zonedDate.getFullYear();
  const showYear = yearInTz !== currentYear;
  switch (granularity) {
    case "hourly":
      return formatInTimeZone(date, timezone, "h:mm a");
    case "daily":
      return formatInTimeZone(
        date,
        timezone,
        showYear ? "MMM d, yyyy" : "MMM d",
      );
    case "weekly": {
      const weekEnd = add(date, { days: 6 });
      return formatInTimeZone(weekEnd, timezone, "dd MMM");
    }
    case "monthly":
      return formatInTimeZone(date, timezone, "MMM yyyy");
    default:
      return formatInTimeZone(date, timezone, "MMM d");
  }
}

function mergeTimeSeries(
  visitors: { date: Date; visitors: number }[],
  revenue: {
    date: Date;
    revenueNew: number;
    renewalRevenue: number;
    revenueRefund: number;
  }[],
  customersSales: { date: Date; customers: number; sales: number }[],
  goals: { date: Date; goalCount: number }[],
  timezone: string,
  granularity: Granularity,
  startDate: Date,
  endDate: Date,
): {
  name: string;
  timestamp: string;
  visitors: number | null;
  revenue: number | null;
  renewalRevenue: number | null;
  refundedRevenue: number | null;
  customers: number | null;
  sales: number | null;
  goal: number | null;
}[] {
  const now = new Date();
  const byKey = new Map<
    string,
    {
      date: Date;
      visitors: number;
      revenue: number;
      renewalRevenue: number;
      refundedRevenue: number;
      customers: number;
      sales: number;
      goal: number;
    }
  >();

  const setDefault = (date: Date) => {
    const key = date.toISOString();
    if (!byKey.has(key)) {
      byKey.set(key, {
        date,
        visitors: 0,
        revenue: 0,
        renewalRevenue: 0,
        refundedRevenue: 0,
        customers: 0,
        sales: 0,
        goal: 0,
      });
    }
    return byKey.get(key)!;
  };

  visitors.forEach((r) => {
    const row = setDefault(r.date);
    row.visitors = r.visitors;
  });
  revenue.forEach((r) => {
    const row = setDefault(r.date);
    row.revenue = r.revenueNew;
    row.renewalRevenue = r.renewalRevenue;
    row.refundedRevenue = r.revenueRefund;
  });
  customersSales.forEach((r) => {
    const row = setDefault(r.date);
    row.customers = r.customers;
    row.sales = r.sales;
  });
  goals.forEach((r) => {
    const row = setDefault(r.date);
    row.goal = r.goalCount;
  });

  const bucketDates = getBucketDates(startDate, endDate, granularity, timezone);

  return bucketDates.map((date) => {
    const key = date.toISOString();
    const isFuture = date > now;
    const row = byKey.get(key) ?? {
      date,
      visitors: 0,
      revenue: 0,
      renewalRevenue: 0,
      refundedRevenue: 0,
      customers: 0,
      sales: 0,
      goal: 0,
    };
    return {
      name: formatBucketLabel(row.date, granularity, timezone),
      timestamp: formatInTimeZone(
        row.date,
        timezone,
        "yyyy-MM-dd'T'HH:mm:ssXXX",
      ),
      visitors: isFuture ? null : row.visitors,
      revenue: isFuture ? null : row.revenue * CENTS_TO_DOLLARS,
      renewalRevenue: isFuture ? null : row.renewalRevenue * CENTS_TO_DOLLARS,
      refundedRevenue: isFuture ? null : row.refundedRevenue * CENTS_TO_DOLLARS,
      customers: isFuture ? null : row.customers,
      sales: isFuture ? null : row.sales,
      goal: isFuture ? null : row.goal,
    };
  });
}

function computePercentageChange(
  current: number,
  previous: number,
): string | null {
  if (previous === 0) return current > 0 ? "100" : null;
  const pct = ((current - previous) / previous) * 100;
  return pct.toFixed(1);
}

export async function GET(
  request: NextRequest,
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

    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get("period") || "today").toString();
    const granularity = (
      searchParams.get("granularity") || "daily"
    ).toLowerCase() as Granularity;
    const timezone =
      (website.settings?.timezone as TimeZone["tzCode"]) || "UTC";
    const currency = website.settings?.currency ?? "USD";

    const { startDate, endDate } = getDateRangeForPeriod(period, timezone);
    const { startDate: prevStart, endDate: prevEnd } = getPreviousPeriodRange(
      startDate,
      endDate,
    );

    const [
      metrics,
      prevMetrics,
      visitorsOverTime,
      revenueOverTime,
      customersSalesOverTime,
      goalsOverTime,
    ] = await Promise.all([
      getMetrics(websiteId, startDate, endDate),
      getMetrics(websiteId, prevStart, prevEnd),
      getVisitorsOverTime(websiteId, startDate, endDate, granularity, timezone),
      getRevenueOverTime(websiteId, startDate, endDate, granularity, timezone),
      getCustomersAndSalesOverTime(
        websiteId,
        startDate,
        endDate,
        granularity,
        timezone,
      ),
      getGoalsOverTime(websiteId, startDate, endDate, granularity, timezone),
    ]);

    const revenueSums = revenueOverTime.reduce(
      (acc, r) => ({
        newRevenue: acc.newRevenue + r.revenueNew,
        renewalRevenue: acc.renewalRevenue + r.renewalRevenue,
        refundedRevenue: acc.refundedRevenue + r.revenueRefund,
      }),
      { newRevenue: 0, renewalRevenue: 0, refundedRevenue: 0 },
    );

    const totalGoal = goalsOverTime.reduce((sum, r) => sum + r.goalCount, 0);
    const totalCustomers = customersSalesOverTime.reduce(
      (sum, r) => sum + r.customers,
      0,
    );
    const totalSales = customersSalesOverTime.reduce(
      (sum, r) => sum + r.sales,
      0,
    );

    const processedData = mergeTimeSeries(
      visitorsOverTime,
      revenueOverTime,
      customersSalesOverTime,
      goalsOverTime,
      timezone,
      granularity,
      startDate,
      endDate,
    );

    const percentageChange = {
      visitors: computePercentageChange(metrics.visitors, prevMetrics.visitors),
      revenue: computePercentageChange(metrics.revenue, prevMetrics.revenue),
      sessions: computePercentageChange(metrics.sessions, prevMetrics.sessions),
      conversionRate: computePercentageChange(
        metrics.conversionRate,
        prevMetrics.conversionRate,
      ),
      bounceRate: computePercentageChange(
        metrics.bounceRate,
        prevMetrics.bounceRate,
      ),
    };

    const totalRevenueDollars = metrics.revenue * CENTS_TO_DOLLARS;
    const totalNewRevenueDollars = revenueSums.newRevenue * CENTS_TO_DOLLARS;
    const totalRenewalRevenueDollars =
      revenueSums.renewalRevenue * CENTS_TO_DOLLARS;
    const totalRefundedRevenueDollars =
      revenueSums.refundedRevenue * CENTS_TO_DOLLARS;

    const response = {
      processedData,
      totalVisitors: metrics.visitors,
      totalSessions: metrics.sessions,
      totalCustomers,
      totalSales,
      totalRevenue: totalRevenueDollars,
      totalNewRevenue: totalNewRevenueDollars,
      totalRenewalRevenue: totalRenewalRevenueDollars,
      totalRefundedRevenue: totalRefundedRevenueDollars,
      totalGoal,
      revenuePerVisitor: metrics.revenuePerVisitor * CENTS_TO_DOLLARS,
      conversionRate: metrics.conversionRate,
      goalConversionRate:
        metrics.visitors > 0 ? (totalGoal / metrics.visitors) * 100 : null,
      bounceRate: metrics.bounceRate,
      sessionDuration: metrics.sessionTime,
      currency,
      percentageChange,
      includeRenewalRevenue: true,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
