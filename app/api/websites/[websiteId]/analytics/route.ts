import { NextRequest, NextResponse } from "next/server";
import {
  getVisitorsOverTime,
  getRevenueOverTime,
  getCustomersAndSalesOverTime,
  getGoalsOverTime,
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
    const period = searchParams.get("period") || "today";
    const granularity = (searchParams.get("granularity") ||
      "daily") as Granularity;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    // Calculate date range based on period or use provided dates
    let startDate: Date;
    let endDate: Date;

    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);
    } else {
      const dateRange = getDateRangeForPeriod(period);
      startDate = dateRange.startDate;
      endDate = dateRange.endDate;
    }

    // Get all analytics data
    const [visitors, revenue, customersAndSales, goals, metrics] =
      await Promise.all([
        getVisitorsOverTime(websiteId, startDate, endDate, granularity),
        getRevenueOverTime(websiteId, startDate, endDate, granularity),
        getCustomersAndSalesOverTime(
          websiteId,
          startDate,
          endDate,
          granularity
        ),
        getGoalsOverTime(websiteId, startDate, endDate, granularity),
        getMetrics(websiteId, startDate, endDate),
      ]);

    // Get timezone from website settings (default to Asia/Calcutta/IST)
    const timezone = website.settings?.timezone || "Asia/Calcutta";

    // Process data into time buckets
    const processedData = processDataIntoBuckets(
      visitors,
      revenue,
      customersAndSales,
      goals,
      startDate,
      endDate,
      granularity,
      timezone
    );

    // Calculate totals
    const totals = calculateTotals(processedData, metrics);

    // Calculate percentage changes (comparing with previous period)
    // For "all" period, don't calculate percentage changes (no previous period)
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
        previousDateRange.endDate
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
      goalConversionRate: null, // TODO: Implement if needed
      bounceRate: totals.bounceRate,
      sessionDuration: totals.sessionDuration,
      currency: "$",
      percentageChange,
      includeRenewalRevenue: true,
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
 * Get date range based on period string
 */
function getDateRangeForPeriod(period: string): {
  startDate: Date;
  endDate: Date;
} {
  let endDate = new Date();
  let startDate = new Date();

  // Handle custom period format: custom:YYYY-MM-DD:YYYY-MM-DD
  if (period.startsWith("custom:")) {
    const parts = period.split(":");
    if (parts.length === 3) {
      startDate = new Date(parts[1] + "T00:00:00");
      endDate = new Date(parts[2] + "T23:59:59");
      return { startDate, endDate };
    }
  }

  const periodLower = period.toLowerCase();

  switch (periodLower) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "yesterday":
      startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "last24h":
    case "last 24 hours":
      endDate = new Date();
      startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      break;
    case "last7d":
    case "last7days":
    case "last 7 days":
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "last30d":
    case "last30days":
    case "last 30 days":
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "last12m":
    case "last12months":
    case "last 12 months":
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 12);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "week":
    case "week to date":
      endDate.setHours(23, 59, 59, 999);
      const dayOfWeek = endDate.getDay();
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "month":
    case "month to date":
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date(endDate);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "year":
    case "year to date":
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date(endDate);
      startDate.setMonth(0);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "all":
    case "all time":
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date(0); // Epoch start
      break;
    default:
      // Default to today
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
}

/**
 * Get previous period date range for comparison
 */
function getPreviousPeriodDateRange(
  startDate: Date,
  endDate: Date
): { startDate: Date; endDate: Date } {
  const duration = endDate.getTime() - startDate.getTime();
  const previousEndDate = new Date(startDate.getTime() - 1);
  const previousStartDate = new Date(previousEndDate.getTime() - duration);

  return { startDate: previousStartDate, endDate: previousEndDate };
}

/**
 * Get timezone offset in milliseconds for a given timezone at a specific date
 */
function getTimezoneOffset(timezone: string, date: Date): number {
  // Use Intl to get the offset
  const utcTime = date.getTime();
  const tzTime = new Date(
    date.toLocaleString("en-US", { timeZone: timezone })
  ).getTime();
  const utcTime2 = new Date(
    date.toLocaleString("en-US", { timeZone: "UTC" })
  ).getTime();
  return tzTime - utcTime2;
}

/**
 * Create a UTC Date from timezone components
 * Given year/month/day/hour in a timezone, create the equivalent UTC Date
 */
function createUTCDateFromTimezoneComponents(
  year: number,
  month: number,
  day: number,
  hour: number,
  timezone: string
): Date {
  // Create a date string and parse it as if it's in the timezone
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00`;

  // Use Intl to convert: create a date in UTC that represents this time in the timezone
  // We'll use a workaround: create the date and adjust by the offset
  const tempDate = new Date(dateStr + "Z"); // Parse as UTC first
  const offset = getTimezoneOffset(timezone, tempDate);
  return new Date(tempDate.getTime() - offset);
}

/**
 * Convert UTC date to user's timezone and get components
 */
function getTimezoneComponents(utcDate: Date, timezone: string) {
  // Use Intl.DateTimeFormat to get components in the target timezone
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

/**
 * Format timestamp with timezone offset
 */
function formatTimestampWithTimezone(
  date: Date,
  timezone: string,
  granularity: Granularity
): string {
  const components = getTimezoneComponents(date, timezone);
  const year = String(components.year);
  const month = String(components.month).padStart(2, "0");
  const day = String(components.day).padStart(2, "0");

  // Get timezone offset string (e.g., "+05:30")
  const offsetMs = getTimezoneOffset(timezone, date);
  const offsetHours = Math.floor(Math.abs(offsetMs) / (60 * 60 * 1000));
  const offsetMinutes = Math.floor(
    (Math.abs(offsetMs) % (60 * 60 * 1000)) / (60 * 1000)
  );
  const offsetSign = offsetMs >= 0 ? "+" : "-";
  const offsetStr = `${offsetSign}${String(offsetHours).padStart(
    2,
    "0"
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
    revenue: number;
    revenueNew: number;
    revenueRefund: number;
  }>,
  customersAndSales: Array<{ date: Date; customers: number; sales: number }>,
  goals: Array<{ date: Date; goalCount: number }>,
  startDate: Date,
  endDate: Date,
  granularity: Granularity,
  timezone: string
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
  // Create maps for efficient lookup
  const visitorsMap = new Map<string, number>();
  const revenueMap = new Map<
    string,
    { revenue: number; revenueNew: number; revenueRefund: number }
  >();
  const customersMap = new Map<string, { customers: number; sales: number }>();
  const goalsMap = new Map<string, number>();

  // Helper function to create a normalized key from UTC date
  // Converts UTC to user's timezone, then creates key based on timezone components
  const createKey = (
    utcDate: Date,
    granularity: Granularity,
    timezone: string
  ): string => {
    // Get components in user's timezone
    const tzComponents = getTimezoneComponents(utcDate, timezone);

    // Normalize to start of period based on granularity
    let year = tzComponents.year;
    let month = tzComponents.month;
    let day = tzComponents.day;
    let hour = tzComponents.hour;

    switch (granularity) {
      case "hourly":
        // Already at hour level, just normalize minutes
        break;
      case "daily":
        hour = 0;
        break;
      case "weekly":
        hour = 0;
        // Calculate start of week in user's timezone
        // Create a date in the user's timezone to get day of week
        const tzDateStr = `${year}-${String(month).padStart(2, "0")}-${String(
          day
        ).padStart(2, "0")}T00:00:00`;
        // Parse as if it's in the timezone (we'll use a workaround)
        const tempDate = new Date(
          tzDateStr + getTimezoneOffsetString(timezone, utcDate)
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

  // Helper to get timezone offset as string for date construction
  function getTimezoneOffsetString(timezone: string, date: Date): string {
    const offsetMs = getTimezoneOffset(timezone, date);
    const offsetHours = Math.floor(Math.abs(offsetMs) / (60 * 60 * 1000));
    const offsetMinutes = Math.floor(
      (Math.abs(offsetMs) % (60 * 60 * 1000)) / (60 * 1000)
    );
    const offsetSign = offsetMs >= 0 ? "+" : "-";
    return `${offsetSign}${String(offsetHours).padStart(2, "0")}:${String(
      offsetMinutes
    ).padStart(2, "0")}`;
  }

  visitors.forEach((item) => {
    // Ensure date is a Date object (MongoDB returns UTC dates)
    const date = item.date instanceof Date ? item.date : new Date(item.date);
    const key = createKey(date, granularity, timezone);
    visitorsMap.set(key, item.visitors);
  });

  revenue.forEach((item) => {
    // Ensure date is a Date object (MongoDB returns UTC dates)
    const date = item.date instanceof Date ? item.date : new Date(item.date);
    const key = createKey(date, granularity, timezone);
    revenueMap.set(key, {
      revenue: item.revenue,
      revenueNew: item.revenueNew,
      revenueRefund: item.revenueRefund,
    });
  });

  customersAndSales.forEach((item) => {
    // Ensure date is a Date object (MongoDB returns UTC dates)
    const date = item.date instanceof Date ? item.date : new Date(item.date);
    const key = createKey(date, granularity, timezone);
    customersMap.set(key, {
      customers: item.customers,
      sales: item.sales,
    });
  });

  goals.forEach((item) => {
    // Ensure date is a Date object (MongoDB returns UTC dates)
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

  // startDate and endDate are in server local time, but we interpret them as user's timezone
  // We need to generate buckets in the user's timezone
  // Create a date representing startDate in the user's timezone
  const startDateStr = `${startDate.getFullYear()}-${String(
    startDate.getMonth() + 1
  ).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}T${String(
    startDate.getHours()
  ).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(
    2,
    "0"
  )}:${String(startDate.getSeconds()).padStart(2, "0")}`;

  // Parse as if it's in the user's timezone by creating UTC date and adjusting
  // We'll work with the timezone components directly
  const startTZ = getTimezoneComponents(
    new Date(startDate.getTime() - getTimezoneOffset(timezone, startDate)),
    timezone
  );
  const endTZ = getTimezoneComponents(
    new Date(endDate.getTime() - getTimezoneOffset(timezone, endDate)),
    timezone
  );

  // Create current bucket date in user's timezone (start with normalized start date)
  let currentYear = startTZ.year;
  let currentMonth = startTZ.month;
  let currentDay = startTZ.day;
  let currentHour = startTZ.hour;

  // Normalize to start of period
  switch (granularity) {
    case "hourly":
      currentHour = Math.floor(currentHour);
      break;
    case "daily":
      currentHour = 0;
      break;
    case "weekly":
      currentHour = 0;
      // Calculate start of week - create a date to get day of week
      const weekStartDate = new Date(
        Date.UTC(currentYear, currentMonth - 1, currentDay)
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
    // Create a UTC date representing this bucket in user's timezone
    // We need to construct a date that, when converted to user's timezone, gives us currentYear/Month/Day/Hour
    const bucketDateStr = `${currentYear}-${String(currentMonth).padStart(
      2,
      "0"
    )}-${String(currentDay).padStart(2, "0")}T${String(currentHour).padStart(
      2,
      "0"
    )}:00:00`;

    // Create date as if it's in UTC, then adjust for timezone offset
    // This is a bit tricky - we'll use a helper to create the proper UTC date
    const bucketDateUTC = createUTCDateFromTimezoneComponents(
      currentYear,
      currentMonth,
      currentDay,
      currentHour,
      timezone
    );

    // Check if we've exceeded end date
    const bucketEndTZ = getTimezoneComponents(bucketDateUTC, timezone);
    if (
      bucketEndTZ.year > endTZ.year ||
      (bucketEndTZ.year === endTZ.year && bucketEndTZ.month > endTZ.month) ||
      (bucketEndTZ.year === endTZ.year &&
        bucketEndTZ.month === endTZ.month &&
        bucketEndTZ.day > endTZ.day) ||
      (granularity === "hourly" &&
        bucketEndTZ.year === endTZ.year &&
        bucketEndTZ.month === endTZ.month &&
        bucketEndTZ.day === endTZ.day &&
        bucketEndTZ.hour > endTZ.hour)
    ) {
      break;
    }

    // Create key from UTC date (MongoDB dates are UTC, we convert them to user timezone in createKey)
    const key = createKey(bucketDateUTC, granularity, timezone);

    // Get revenue data
    const revenueData = revenueMap.get(key);
    const newRevenue = revenueData ? revenueData.revenueNew / 100 : null;
    const renewalRevenue = revenueData
      ? (revenueData.revenue - revenueData.revenueNew) / 100
      : null;

    // Format name and timestamp in user's timezone
    const tzComponents = getTimezoneComponents(bucketDateUTC, timezone);
    const name = formatBucketNameFromComponents(
      tzComponents,
      granularity,
      timezone
    );
    const timestamp = formatTimestampWithTimezone(
      bucketDateUTC,
      timezone,
      granularity
    );

    buckets.push({
      name,
      visitors: visitorsMap.get(key) ?? null,
      revenue: newRevenue, // New revenue only (not including renewals)
      timestamp: timestamp,
      renewalRevenue: renewalRevenue,
      refundedRevenue: revenueData ? revenueData.revenueRefund / 100 : null,
      customers: customersMap.get(key)?.customers ?? null,
      sales: customersMap.get(key)?.sales ?? null,
      goalCount: goalsMap.get(key) ?? null,
    });

    // Increment based on granularity (in user's timezone)
    switch (granularity) {
      case "hourly":
        currentHour++;
        if (currentHour >= 24) {
          currentHour = 0;
          currentDay++;
          // Check for month/year rollover
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
  timezone: string
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
      // For weekly, we'll use the start of week date
      const weekDate = new Date(
        Date.UTC(components.year, components.month - 1, components.day)
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
        "0"
      )}-${String(components.day).padStart(2, "0")}`;
  }
}

/**
 * Format bucket name based on granularity
 * date is a Date object adjusted to IST (UTC time + 5.5 hours)
 * Use UTC methods to get IST values
 */
function formatBucketName(date: Date, granularity: Granularity): string {
  switch (granularity) {
    case "hourly":
      // Use UTC hours since date is adjusted to IST
      const hour = date.getUTCHours();
      const hour12 = hour % 12 || 12;
      const ampm = hour < 12 ? "am" : "pm";
      return `${hour12}${ampm}`;
    case "daily":
      // Format: "01 Nov", "02 Nov", etc.
      const day = date.getUTCDate().toString().padStart(2, "0");
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
      const month = monthNames[date.getUTCMonth()];
      return `${day} ${month}`;
    case "weekly":
      return `Week ${getWeekNumber(date)}`;
    case "monthly":
      // Format: "May 2024", "Jun 2024", etc.
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
      const monthName = monthNames2[date.getUTCMonth()];
      const year = date.getUTCFullYear();
      return `${monthName} ${year}`;
    default:
      return date.toISOString().split("T")[0];
  }
}

/**
 * Get week number in year
 */
function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Increment date based on granularity (using UTC methods)
 */
function incrementDate(date: Date, granularity: Granularity): void {
  switch (granularity) {
    case "hourly":
      date.setUTCHours(date.getUTCHours() + 1);
      break;
    case "daily":
      date.setUTCDate(date.getUTCDate() + 1);
      break;
    case "weekly":
      date.setUTCDate(date.getUTCDate() + 7);
      break;
    case "monthly":
      date.setUTCMonth(date.getUTCMonth() + 1);
      break;
  }
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
  }
) {
  const totalVisitors = metrics.visitors;
  const totalSessions = metrics.sessions;
  const totalCustomers = processedData.reduce(
    (sum, item) => sum + (item.customers ?? 0),
    0
  );
  const totalSales = processedData.reduce(
    (sum, item) => sum + (item.sales ?? 0),
    0
  );
  // revenue in buckets is new revenue only
  const totalNewRevenue = processedData.reduce(
    (sum, item) => sum + (item.revenue ?? 0) * 100,
    0
  ); // Convert back to cents
  const totalRenewalRevenue = processedData.reduce(
    (sum, item) => sum + (item.renewalRevenue ?? 0) * 100,
    0
  );
  const totalRevenue = totalNewRevenue + totalRenewalRevenue;
  const totalRefundedRevenue = processedData.reduce(
    (sum, item) => sum + (item.refundedRevenue ?? 0) * 100,
    0
  );
  const totalGoal = processedData.reduce(
    (sum, item) => sum + (item.goalCount ?? 0),
    0
  );

  return {
    visitors: totalVisitors,
    sessions: totalSessions,
    customers: totalCustomers,
    sales: totalSales,
    revenue: totalRevenue / 100, // Convert to dollars
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
  }
) {
  const calculateChange = (
    current: number,
    previous: number
  ): string | null => {
    if (previous === 0) {
      return current > 0 ? "100.0" : null;
    }
    const change = ((current - previous) / previous) * 100;
    return change.toFixed(1);
  };

  // Calculate new revenue (revenue - refunds)
  const currentNewRevenue = current.revenue - current.revenueRefund;
  const previousNewRevenue = previous.revenue - previous.revenueRefund;
  const currentRenewalRevenue = current.revenue - currentNewRevenue;
  const previousRenewalRevenue = previous.revenue - previousNewRevenue;

  return {
    totalVisitors: calculateChange(current.visitors, previous.visitors),
    totalSessions: calculateChange(current.sessions, previous.sessions),
    totalCustomers: null, // Would need previous period customer data
    totalSales: null, // Would need previous period sales data
    totalRevenue: calculateChange(current.revenue, previous.revenue),
    totalNewRevenue: calculateChange(currentNewRevenue, previousNewRevenue),
    totalRenewalRevenue: calculateChange(
      currentRenewalRevenue,
      previousRenewalRevenue
    ),
    totalRefundedRevenue: calculateChange(
      current.revenueRefund,
      previous.revenueRefund
    ),
    totalGoal: null, // Would need previous period goal data
    revenuePerVisitor: calculateChange(
      current.revenuePerVisitor,
      previous.revenuePerVisitor
    ),
    conversionRate: calculateChange(
      current.conversionRate,
      previous.conversionRate
    ),
    goalConversionRate: null,
    bounceRate: calculateChange(current.bounceRate, previous.bounceRate),
    sessionDuration: calculateChange(current.sessionTime, previous.sessionTime),
  };
}
