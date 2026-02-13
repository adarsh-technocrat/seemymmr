import { NextRequest, NextResponse } from "next/server";
import { getVisitorsOverTime } from "@/utils/analytics/aggregations/getVisitorsOverTime.aggregation";
import { getRevenueOverTime } from "@/utils/analytics/aggregations/getRevenueOverTime.aggregation";
import { getCustomersAndSalesOverTime } from "@/utils/analytics/aggregations/getCustomersAndSalesOverTime.aggregation";
import { getGoalsOverTime } from "@/utils/analytics/aggregations/getGoalsOverTime.aggregation";
import { getMetrics } from "@/utils/analytics/aggregations/getMetrics.aggregation";
import type { Granularity } from "@/utils/analytics/types";
import { getWebsiteById } from "@/utils/database/website";
import { getUserId } from "@/lib/get-session";
import {
  getDateRangeForPeriod,
  getTimezoneOffset,
  getTimezoneComponents,
  createUTCDateFromTimezoneComponents,
  getTimezoneOffsetString,
} from "@/lib/date-time-conversion";
import { getEarliestDataPoint } from "@/utils/analytics/earliest-data";

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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "today";
    const granularity = (searchParams.get("granularity") ||
      "daily") as Granularity;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    // Get timezone from website settings (default to Asia/Calcutta/IST)
    const timezone = website.settings?.timezone || "Asia/Calcutta";

    // Calculate date range based on period or use provided dates
    let startDate: Date;
    let endDate: Date;

    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);
    } else {
      // For "All time", get the earliest data point from the database
      if (
        period.toLowerCase() === "all" ||
        period.toLowerCase() === "all time"
      ) {
        const earliestDate = await getEarliestDataPoint(websiteId);
        const dateRange = getDateRangeForPeriod(
          period,
          timezone,
          website,
          earliestDate,
        );
        startDate = dateRange.startDate;
        endDate = dateRange.endDate;
      } else {
        const dateRange = getDateRangeForPeriod(period, timezone, website);
        startDate = dateRange.startDate;
        endDate = dateRange.endDate;
      }
    }

    // Smart sync: Trigger background sync on manual refresh if needed
    // This ensures users always see up-to-date data when they refresh
    // We only sync if:
    // 1. Payment providers are configured
    // 2. No recent sync was done in the last 15 minutes
    // 3. The period being viewed is recent (today, last 24h, last 7d, or custom within last 7 days)
    //
    // Sync Strategy:
    // - We sync wider date ranges than requested to ensure no payments are missed
    // - This accounts for timezone differences, payment processing delays, and clock skew
    // - Duplicate payments are automatically skipped by checking providerPaymentId
    // - The sync runs in the background, so analytics return immediately with current data
    if (website.paymentProviders) {
      const isRecentPeriod =
        period.toLowerCase() === "today" ||
        period.toLowerCase() === "last24h" ||
        period.toLowerCase() === "last 24 hours" ||
        period.toLowerCase() === "last7d" ||
        period.toLowerCase() === "last 7 days" ||
        period.toLowerCase() === "last30d" ||
        period.toLowerCase() === "last 30 days" ||
        (period.startsWith("custom:") &&
          endDate.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000);

      if (isRecentPeriod) {
        // Determine sync date range based on period
        let syncStartDate: Date;
        let syncEndDate: Date;
        let syncRange: "today" | "last24h" | "last7d" | "custom";

        if (period.toLowerCase() === "today") {
          // Sync last 48 hours to ensure we catch all of today's payments
          // This accounts for timezone differences and payment processing delays
          syncStartDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
          syncEndDate = new Date();
          syncRange = "last24h";
        } else if (
          period.toLowerCase() === "last24h" ||
          period.toLowerCase() === "last 24 hours"
        ) {
          // Sync last 24 hours + 2 hour buffer for processing delays
          syncStartDate = new Date(Date.now() - 26 * 60 * 60 * 1000);
          syncEndDate = new Date();
          syncRange = "last24h";
        } else if (
          period.toLowerCase() === "last7d" ||
          period.toLowerCase() === "last 7 days"
        ) {
          // Sync last 7 days + 1 day buffer for timezone differences
          syncStartDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
          syncEndDate = new Date();
          syncRange = "last7d";
        } else if (period.startsWith("custom:")) {
          // For custom periods, sync the requested range + 24 hour buffer
          syncStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
          syncEndDate = new Date(); // Always sync up to now
          syncRange = "custom";
        } else {
          // For other periods, sync last 48 hours as a safe default
          syncStartDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
          syncEndDate = new Date();
          syncRange = "last24h";
        }
      }
    }

    // Core time-series and metrics only. Breakdowns are available via
    // GET /api/websites/[websiteId]/analytics/breakdowns/[breakdown]
    const [visitors, revenue, customersAndSales, goals, metrics] =
      await Promise.all([
        getVisitorsOverTime(websiteId, startDate, endDate, granularity),
        getRevenueOverTime(websiteId, startDate, endDate, granularity),
        getCustomersAndSalesOverTime(
          websiteId,
          startDate,
          endDate,
          granularity,
        ),
        getGoalsOverTime(websiteId, startDate, endDate, granularity),
        getMetrics(websiteId, startDate, endDate),
      ]);

    const processedData = processDataIntoBuckets(
      visitors,
      revenue,
      customersAndSales,
      goals,
      startDate,
      endDate,
      granularity,
      timezone,
      period,
    );

    // Calculate totals
    const totals = calculateTotals(processedData, metrics);

    // Calculate percentage changes compared to previous period
    let percentageChange: Record<string, string | null>;
    if (period.toLowerCase() === "all" || period.toLowerCase() === "all time") {
      percentageChange = {
        totalVisitors: null,
        totalSessions: null,
        totalCustomers: "0.0",
        totalSales: "0.0",
        totalRevenue: "0.0",
        totalNewRevenue: "0.0",
        totalRenewalRevenue: "0.0",
        totalRefundedRevenue: "0.0",
        totalGoal: null,
        revenuePerVisitor: null,
        conversionRate: null,
        goalConversionRate: null,
        bounceRate: null,
        sessionDuration: null,
      };
    } else {
      const previousDateRange = getPreviousPeriodDateRange(startDate, endDate);
      const previousMetrics = await getMetrics(
        websiteId,
        previousDateRange.startDate,
        previousDateRange.endDate,
      );
      percentageChange = calculatePercentageChange(metrics, previousMetrics);
    }

    // Format response
    const response = {
      processedData,
      totalVisitors: totals.visitors,
      totalSessions: totals.sessions,
      totalCustomers: totals.customers,
      totalSales: totals.sales,
      totalRevenue: totals.revenue,
      totalNewRevenue: totals.newRevenue,
      totalRenewalRevenue: totals.renewalRevenue,
      totalRefundedRevenue: totals.refundedRevenue,
      totalGoal: totals.goal,
      revenuePerVisitor: totals.revenuePerVisitor,
      conversionRate: totals.conversionRate,
      goalConversionRate: null,
      bounceRate: totals.bounceRate,
      sessionDuration: totals.sessionDuration,
      currency: "$",
      percentageChange,
      includeRenewalRevenue: true,
      // Fetch breakdowns from GET /api/websites/[websiteId]/analytics/breakdowns/[breakdown]
      breakdowns: {
        source: {
          channel: [],
          referrer: [],
          campaign: [],
          keyword: [],
          channels: [],
        },
        path: {
          pages: [],
          hostnames: [],
          entryPages: [],
          exitLinks: [],
        },
        location: {
          country: [],
          region: [],
          city: [],
        },
        system: {
          browser: [],
          os: [],
          device: [],
        },
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}

/**
 * Get previous period date range for comparison
 */
function getPreviousPeriodDateRange(
  startDate: Date,
  endDate: Date,
): { startDate: Date; endDate: Date } {
  const duration = endDate.getTime() - startDate.getTime();
  const previousEndDate = new Date(startDate.getTime() - 1);
  const previousStartDate = new Date(previousEndDate.getTime() - duration);

  return { startDate: previousStartDate, endDate: previousEndDate };
}

/**
 * Format timestamp from timezone components
 */
function formatTimestampFromComponents(
  components: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
  },
  timezone: string,
  granularity: Granularity,
  utcDate: Date,
): string {
  const year = String(components.year);
  const month = String(components.month).padStart(2, "0");
  const day = String(components.day).padStart(2, "0");
  const offsetMs = getTimezoneOffset(timezone, utcDate);
  const offsetHours = Math.floor(Math.abs(offsetMs) / (60 * 60 * 1000));
  const offsetMinutes = Math.floor(
    (Math.abs(offsetMs) % (60 * 60 * 1000)) / (60 * 1000),
  );
  const offsetSign = offsetMs >= 0 ? "+" : "-";
  const offsetStr = `${offsetSign}${String(offsetHours).padStart(
    2,
    "0",
  )}:${String(offsetMinutes).padStart(2, "0")}`;

  if (granularity === "hourly") {
    const hour = String(components.hour).padStart(2, "0");
    return `${year}-${month}-${day}T${hour}:00:00${offsetStr}`;
  } else {
    return `${year}-${month}-${day}T00:00:00${offsetStr}`;
  }
}

/**
 * Format timestamp with timezone offset
 */
function formatTimestampWithTimezone(
  date: Date,
  timezone: string,
  granularity: Granularity,
): string {
  const components = getTimezoneComponents(date, timezone);
  const year = String(components.year);
  const month = String(components.month).padStart(2, "0");
  const day = String(components.day).padStart(2, "0");
  const offsetMs = getTimezoneOffset(timezone, date);
  const offsetHours = Math.floor(Math.abs(offsetMs) / (60 * 60 * 1000));
  const offsetMinutes = Math.floor(
    (Math.abs(offsetMs) % (60 * 60 * 1000)) / (60 * 1000),
  );
  const offsetSign = offsetMs >= 0 ? "+" : "-";
  const offsetStr = `${offsetSign}${String(offsetHours).padStart(
    2,
    "0",
  )}:${String(offsetMinutes).padStart(2, "0")}`;

  if (granularity === "hourly") {
    const hour = String(components.hour).padStart(2, "0");
    return `${year}-${month}-${day}T${hour}:00:00${offsetStr}`;
  } else {
    return `${year}-${month}-${day}T00:00:00${offsetStr}`;
  }
}

/**
 * Process data into time buckets matching the expected structure
 */
function processDataIntoBuckets(
  visitors: Array<{ date: Date; visitors: number }>,
  revenue: Array<{
    date: Date;
    revenueNew: number;
    renewalRevenue: number;
    revenueRefund: number;
  }>,
  customersAndSales: Array<{ date: Date; customers: number; sales: number }>,
  goals: Array<{ date: Date; goalCount: number }>,
  startDate: Date,
  endDate: Date,
  granularity: Granularity,
  timezone: string,
  period?: string,
): Array<{
  name: string;
  visitors: number | null;
  revenue: number | null;
  timestamp: string;
  renewalRevenue: number | null;
  refundedRevenue: number | null;
  customers: number | null;
  sales: number | null;
  goalCount: number | null;
}> {
  // Create lookup maps
  const visitorsMap = new Map<string, number>();
  const revenueMap = new Map<
    string,
    { revenueNew: number; renewalRevenue: number; revenueRefund: number }
  >();
  const customersMap = new Map<string, { customers: number; sales: number }>();
  const goalsMap = new Map<string, number>();

  // Create normalized key from UTC date
  const createKey = (
    utcDate: Date,
    granularity: Granularity,
    timezone: string,
  ): string => {
    const tzComponents = getTimezoneComponents(utcDate, timezone);
    let year = tzComponents.year;
    let month = tzComponents.month;
    let day = tzComponents.day;
    let hour = tzComponents.hour;

    switch (granularity) {
      case "hourly":
        break;
      case "daily":
        hour = 0;
        break;
      case "weekly":
        hour = 0;
        const tzDateStr = `${year}-${String(month).padStart(2, "0")}-${String(
          day,
        ).padStart(2, "0")}T00:00:00`;
        const tempDate = new Date(
          tzDateStr + getTimezoneOffsetString(timezone, utcDate),
        );
        const dayOfWeek = tempDate.getUTCDay();
        const startOfWeek = new Date(tempDate);
        startOfWeek.setUTCDate(tempDate.getUTCDate() - dayOfWeek);
        const weekComponents = getTimezoneComponents(startOfWeek, timezone);
        year = weekComponents.year;
        month = weekComponents.month;
        day = weekComponents.day;
        break;
      case "monthly":
        hour = 0;
        day = 1;
        break;
    }

    const monthStr = String(month).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");

    switch (granularity) {
      case "hourly":
        const hourStr = String(hour).padStart(2, "0");
        return `${year}-${monthStr}-${dayStr}T${hourStr}:00:00`;
      case "daily":
        return `${year}-${monthStr}-${dayStr}`;
      case "weekly":
        return `${year}-${monthStr}-${dayStr}`;
      case "monthly":
        return `${year}-${monthStr}`;
      default:
        return `${year}-${monthStr}-${dayStr}`;
    }
  };

  visitors.forEach((item) => {
    const date = item.date instanceof Date ? item.date : new Date(item.date);
    const key = createKey(date, granularity, timezone);
    visitorsMap.set(key, item.visitors);
  });

  revenue.forEach((item) => {
    const date = item.date instanceof Date ? item.date : new Date(item.date);
    const key = createKey(date, granularity, timezone);
    revenueMap.set(key, {
      revenueNew: item.revenueNew,
      renewalRevenue: item.renewalRevenue,
      revenueRefund: item.revenueRefund,
    });
  });

  customersAndSales.forEach((item) => {
    const date = item.date instanceof Date ? item.date : new Date(item.date);
    const key = createKey(date, granularity, timezone);
    customersMap.set(key, {
      customers: item.customers,
      sales: item.sales,
    });
  });

  goals.forEach((item) => {
    const date = item.date instanceof Date ? item.date : new Date(item.date);
    const key = createKey(date, granularity, timezone);
    goalsMap.set(key, item.goalCount);
  });

  // Generate all time buckets based on granularity
  const buckets: Array<{
    name: string;
    visitors: number | null;
    revenue: number | null;
    timestamp: string;
    renewalRevenue: number | null;
    refundedRevenue: number | null;
    customers: number | null;
    sales: number | null;
    goalCount: number | null;
  }> = [];

  // Get timezone components for current time and date range
  const now = new Date();
  const nowTZ = getTimezoneComponents(now, timezone);
  const startTZ = getTimezoneComponents(startDate, timezone);
  const endTZ = getTimezoneComponents(endDate, timezone);

  const isToday = period?.toLowerCase().trim() === "today";

  // Initialize bucket date
  let currentYear = isToday ? nowTZ.year : startTZ.year;
  let currentMonth = isToday ? nowTZ.month : startTZ.month;
  let currentDay = isToday ? nowTZ.day : startTZ.day;
  let currentHour = 0;
  switch (granularity) {
    case "hourly":
      currentHour = Math.floor(currentHour);
      break;
    case "daily":
      currentHour = 0;
      break;
    case "weekly":
      currentHour = 0;
      const weekStartDate = new Date(
        Date.UTC(currentYear, currentMonth - 1, currentDay),
      );
      const dayOfWeek = weekStartDate.getUTCDay();
      const weekStart = new Date(weekStartDate);
      weekStart.setUTCDate(weekStartDate.getUTCDate() - dayOfWeek);
      currentYear = weekStart.getUTCFullYear();
      currentMonth = weekStart.getUTCMonth() + 1;
      currentDay = weekStart.getUTCDate();
      break;
    case "monthly":
      currentHour = 0;
      currentDay = 1;
      break;
  }

  // Generate buckets by iterating in user's timezone
  while (true) {
    // Create UTC date representing this bucket in user's timezone
    const bucketDateUTC = createUTCDateFromTimezoneComponents(
      currentYear,
      currentMonth,
      currentDay,
      currentHour,
      timezone,
    );

    // Check if we've exceeded end date
    const endYear = isToday ? nowTZ.year : endTZ.year;
    const endMonth = isToday ? nowTZ.month : endTZ.month;
    const endDay = isToday ? nowTZ.day : endTZ.day;
    // For "today" with hourly granularity, show all 24 hours (0-23)
    const endHour =
      granularity === "hourly" && isToday
        ? 23
        : isToday
          ? nowTZ.hour
          : endTZ.hour;

    // For hourly granularity, compare directly with currentHour to avoid timezone conversion issues
    if (granularity === "hourly") {
      if (
        currentYear > endYear ||
        (currentYear === endYear && currentMonth > endMonth) ||
        (currentYear === endYear &&
          currentMonth === endMonth &&
          currentDay > endDay) ||
        (currentYear === endYear &&
          currentMonth === endMonth &&
          currentDay === endDay &&
          currentHour > endHour)
      ) {
        break;
      }
    } else if (granularity === "monthly") {
      if (
        currentYear > endYear ||
        (currentYear === endYear && currentMonth > endMonth)
      ) {
        break;
      }
    } else {
      const bucketEndTZ = getTimezoneComponents(bucketDateUTC, timezone);
      if (
        bucketEndTZ.year > endYear ||
        (bucketEndTZ.year === endYear && bucketEndTZ.month > endMonth) ||
        (bucketEndTZ.year === endYear &&
          bucketEndTZ.month === endMonth &&
          bucketEndTZ.day > endDay)
      ) {
        break;
      }
    }

    const key = createKey(bucketDateUTC, granularity, timezone);

    // Get revenue data
    const revenueData = revenueMap.get(key);
    // revenueNew: refunded: false, renewal: false
    // renewalRevenue: refunded: false, renewal: true
    // refundedRevenue: refunded: true, renewal: false
    // All values are stored in cents, so divide by 100 to get dollars
    const newRevenue = revenueData ? revenueData.revenueNew / 100 : null;
    const renewalRevenue = revenueData
      ? revenueData.renewalRevenue / 100
      : null;
    const refundedRevenue = revenueData
      ? revenueData.revenueRefund / 100
      : null;

    // Format name and timestamp in user's timezone
    const tzComponents = isToday
      ? {
          year: currentYear,
          month: currentMonth,
          day: currentDay,
          hour: currentHour,
          minute: 0,
        }
      : getTimezoneComponents(bucketDateUTC, timezone);

    const name = formatBucketNameFromComponents(
      tzComponents,
      granularity,
      timezone,
    );

    const timestamp = isToday
      ? formatTimestampFromComponents(
          tzComponents,
          timezone,
          granularity,
          bucketDateUTC,
        )
      : formatTimestampWithTimezone(bucketDateUTC, timezone, granularity);

    buckets.push({
      name,
      visitors: visitorsMap.get(key) ?? null,
      revenue: newRevenue,
      timestamp: timestamp,
      renewalRevenue: renewalRevenue,
      refundedRevenue: refundedRevenue,
      customers: customersMap.get(key)?.customers ?? null,
      sales: customersMap.get(key)?.sales ?? null,
      goalCount: goalsMap.get(key) ?? null,
    });

    // Increment bucket date
    switch (granularity) {
      case "hourly":
        currentHour++;
        if (currentHour >= 24) {
          currentHour = 0;
          currentDay++;
          const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
          if (currentDay > daysInMonth) {
            currentDay = 1;
            currentMonth++;
            if (currentMonth > 12) {
              currentMonth = 1;
              currentYear++;
            }
          }
        }
        break;
      case "daily":
        currentDay++;
        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
        if (currentDay > daysInMonth) {
          currentDay = 1;
          currentMonth++;
          if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
          }
        }
        break;
      case "weekly":
        currentDay += 7;
        const daysInMonth2 = new Date(currentYear, currentMonth, 0).getDate();
        if (currentDay > daysInMonth2) {
          currentDay -= daysInMonth2;
          currentMonth++;
          if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
          }
        }
        break;
      case "monthly":
        currentMonth++;
        if (currentMonth > 12) {
          currentMonth = 1;
          currentYear++;
        }
        break;
    }
  }

  return buckets;
}

/**
 * Format bucket name from timezone components
 */
function formatBucketNameFromComponents(
  components: { year: number; month: number; day: number; hour: number },
  granularity: Granularity,
  timezone: string,
): string {
  switch (granularity) {
    case "hourly":
      const hour12 = components.hour % 12 || 12;
      const ampm = components.hour < 12 ? "am" : "pm";
      return `${hour12}${ampm}`;
    case "daily":
      const day = String(components.day).padStart(2, "0");
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const month = monthNames[components.month - 1];
      return `${day} ${month}`;
    case "weekly":
      const weekDate = new Date(
        Date.UTC(components.year, components.month - 1, components.day),
      );
      return `Week ${getWeekNumber(weekDate)}`;
    case "monthly":
      const monthNames2 = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthName = monthNames2[components.month - 1];
      return `${monthName} ${components.year}`;
    default:
      return `${components.year}-${String(components.month).padStart(
        2,
        "0",
      )}-${String(components.day).padStart(2, "0")}`;
  }
}

/**
 * Get week number in year
 */
function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Calculate totals from processed data and metrics
 */
function calculateTotals(
  processedData: Array<{
    visitors: number | null;
    revenue: number | null;
    renewalRevenue: number | null;
    refundedRevenue: number | null;
    customers: number | null;
    sales: number | null;
    goalCount: number | null;
  }>,
  metrics: {
    visitors: number;
    pageViews: number;
    revenue: number;
    revenueRefund: number;
    sessions: number;
    bounceRate: number;
    sessionTime: number;
    conversionRate: number;
    revenuePerVisitor: number;
  },
) {
  const totalVisitors = metrics.visitors;
  const totalSessions = metrics.sessions;
  const totalCustomers = processedData.reduce(
    (sum, item) => sum + (item.customers ?? 0),
    0,
  );
  const totalSales = processedData.reduce(
    (sum, item) => sum + (item.sales ?? 0),
    0,
  );
  const totalNewRevenue = processedData.reduce(
    (sum, item) => sum + (item.revenue ?? 0) * 100,
    0,
  );
  const totalRenewalRevenue = processedData.reduce(
    (sum, item) => sum + (item.renewalRevenue ?? 0) * 100,
    0,
  );
  const totalRevenue = totalNewRevenue + totalRenewalRevenue;
  const totalRefundedRevenue = processedData.reduce(
    (sum, item) => sum + (item.refundedRevenue ?? 0) * 100,
    0,
  );
  const totalGoal = processedData.reduce(
    (sum, item) => sum + (item.goalCount ?? 0),
    0,
  );

  return {
    visitors: totalVisitors,
    sessions: totalSessions,
    customers: totalCustomers,
    sales: totalSales,
    revenue: totalRevenue / 100,
    newRevenue: totalNewRevenue / 100,
    renewalRevenue: totalRenewalRevenue / 100,
    refundedRevenue: totalRefundedRevenue / 100,
    goal: totalGoal,
    revenuePerVisitor:
      totalVisitors > 0 ? totalRevenue / 100 / totalVisitors : null,
    conversionRate: metrics.conversionRate,
    bounceRate: metrics.bounceRate,
    sessionDuration: metrics.sessionTime,
  };
}

/**
 * Calculate percentage change between current and previous period
 */
function calculatePercentageChange(
  current: {
    visitors: number;
    revenue: number;
    revenueRefund: number;
    sessions: number;
    bounceRate: number;
    sessionTime: number;
    conversionRate: number;
    revenuePerVisitor: number;
  },
  previous: {
    visitors: number;
    revenue: number;
    revenueRefund: number;
    sessions: number;
    bounceRate: number;
    sessionTime: number;
    conversionRate: number;
    revenuePerVisitor: number;
  },
) {
  const calculateChange = (
    current: number,
    previous: number,
  ): string | null => {
    if (previous === 0) {
      return current > 0 ? "100.0" : null;
    }
    const change = ((current - previous) / previous) * 100;
    return change.toFixed(1);
  };

  const currentNewRevenue = current.revenue - current.revenueRefund;
  const previousNewRevenue = previous.revenue - previous.revenueRefund;
  const currentRenewalRevenue = current.revenue - currentNewRevenue;
  const previousRenewalRevenue = previous.revenue - previousNewRevenue;

  return {
    totalVisitors: calculateChange(current.visitors, previous.visitors),
    totalSessions: calculateChange(current.sessions, previous.sessions),
    totalCustomers: null,
    totalSales: null,
    totalRevenue: calculateChange(current.revenue, previous.revenue),
    totalNewRevenue: calculateChange(currentNewRevenue, previousNewRevenue),
    totalRenewalRevenue: calculateChange(
      currentRenewalRevenue,
      previousRenewalRevenue,
    ),
    totalRefundedRevenue: calculateChange(
      current.revenueRefund,
      previous.revenueRefund,
    ),
    totalGoal: null,
    revenuePerVisitor: calculateChange(
      current.revenuePerVisitor,
      previous.revenuePerVisitor,
    ),
    conversionRate: calculateChange(
      current.conversionRate,
      previous.conversionRate,
    ),
    goalConversionRate: null,
    bounceRate: calculateChange(current.bounceRate, previous.bounceRate),
    sessionDuration: calculateChange(current.sessionTime, previous.sessionTime),
  };
}
