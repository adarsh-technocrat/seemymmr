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

    // Process data into time buckets
    const processedData = processDataIntoBuckets(
      visitors,
      revenue,
      customersAndSales,
      goals,
      startDate,
      endDate,
      granularity
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
  granularity: Granularity
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

  // Helper function to get IST date components from UTC date
  const getISTComponentsFromUTC = (utcDate: Date) => {
    // IST is UTC+5:30
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istTime = utcDate.getTime() + istOffsetMs;
    const istDate = new Date(istTime);

    return {
      year: istDate.getUTCFullYear(),
      month: istDate.getUTCMonth() + 1,
      day: istDate.getUTCDate(),
      hour: istDate.getUTCHours(),
    };
  };

  // Helper function to get IST date components from local date (assuming local = IST)
  const getISTComponentsFromLocal = (localDate: Date) => {
    return {
      year: localDate.getFullYear(),
      month: localDate.getMonth() + 1,
      day: localDate.getDate(),
      hour: localDate.getHours(),
    };
  };

  // Helper function to create a normalized key from IST components
  const createKeyFromIST = (
    year: number,
    month: number,
    day: number,
    hour: number,
    granularity: Granularity
  ): string => {
    // Normalize to start of period based on granularity
    let normalizedYear = year;
    let normalizedMonth = month;
    let normalizedDay = day;
    let normalizedHour = hour;

    switch (granularity) {
      case "hourly":
        // Already at hour level
        break;
      case "daily":
        normalizedHour = 0;
        break;
      case "weekly":
        normalizedHour = 0;
        // Calculate start of week (Sunday = 0)
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - dayOfWeek);
        normalizedYear = startOfWeek.getFullYear();
        normalizedMonth = startOfWeek.getMonth() + 1;
        normalizedDay = startOfWeek.getDate();
        break;
      case "monthly":
        normalizedHour = 0;
        normalizedDay = 1;
        break;
    }

    const monthStr = String(normalizedMonth).padStart(2, "0");
    const dayStr = String(normalizedDay).padStart(2, "0");

    switch (granularity) {
      case "hourly":
        const hourStr = String(normalizedHour).padStart(2, "0");
        return `${normalizedYear}-${monthStr}-${dayStr}T${hourStr}:00:00`;
      case "daily":
        return `${normalizedYear}-${monthStr}-${dayStr}`;
      case "weekly":
        return `${normalizedYear}-${monthStr}-${dayStr}`;
      case "monthly":
        return `${normalizedYear}-${monthStr}`;
      default:
        return `${normalizedYear}-${monthStr}-${dayStr}`;
    }
  };

  // Helper function to create a normalized key from UTC date (for MongoDB dates)
  const createKey = (utcDate: Date, granularity: Granularity): string => {
    const ist = getISTComponentsFromUTC(utcDate);
    return createKeyFromIST(
      ist.year,
      ist.month,
      ist.day,
      ist.hour,
      granularity
    );
  };

  // Helper function to create a normalized key from local date (for bucket dates)
  const createKeyFromLocal = (
    localDate: Date,
    granularity: Granularity
  ): string => {
    const ist = getISTComponentsFromLocal(localDate);
    return createKeyFromIST(
      ist.year,
      ist.month,
      ist.day,
      ist.hour,
      granularity
    );
  };

  visitors.forEach((item) => {
    // Ensure date is a Date object
    const date = item.date instanceof Date ? item.date : new Date(item.date);
    const key = createKey(date, granularity);
    visitorsMap.set(key, item.visitors);
  });

  revenue.forEach((item) => {
    // Ensure date is a Date object
    const date = item.date instanceof Date ? item.date : new Date(item.date);
    const key = createKey(date, granularity);
    revenueMap.set(key, {
      revenue: item.revenue,
      revenueNew: item.revenueNew,
      revenueRefund: item.revenueRefund,
    });
  });

  customersAndSales.forEach((item) => {
    // Ensure date is a Date object
    const date = item.date instanceof Date ? item.date : new Date(item.date);
    const key = createKey(date, granularity);
    customersMap.set(key, {
      customers: item.customers,
      sales: item.sales,
    });
  });

  goals.forEach((item) => {
    // Ensure date is a Date object
    const date = item.date instanceof Date ? item.date : new Date(item.date);
    const key = createKey(date, granularity);
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

  // Normalize start date to beginning of period based on granularity
  const current = new Date(startDate);
  switch (granularity) {
    case "hourly":
      current.setMinutes(0, 0, 0);
      break;
    case "daily":
      current.setHours(0, 0, 0, 0);
      break;
    case "weekly":
      current.setHours(0, 0, 0, 0);
      const startDay = current.getDay();
      current.setDate(current.getDate() - startDay);
      break;
    case "monthly":
      current.setDate(1);
      current.setHours(0, 0, 0, 0);
      break;
  }
  const end = new Date(endDate);

  while (current <= end) {
    const bucketDate = new Date(current);
    // Create key from bucket date (treating local time as IST)
    const key = createKeyFromLocal(bucketDate, granularity);

    // Get revenue data
    const revenueData = revenueMap.get(key);
    // revenueNew is non-refunded, non-renewal payments (new revenue)
    // renewalRevenue = total revenue - new revenue (for non-refunded payments)
    const newRevenue = revenueData ? revenueData.revenueNew / 100 : null;
    const renewalRevenue = revenueData
      ? (revenueData.revenue - revenueData.revenueNew) / 100
      : null;

    // Format name based on granularity
    const name = formatBucketName(bucketDate, granularity);

    // Format timestamp with timezone offset (+05:30 for IST)
    const year = bucketDate.getFullYear();
    const month = String(bucketDate.getMonth() + 1).padStart(2, "0");
    const day = String(bucketDate.getDate()).padStart(2, "0");
    let timestamp: string;
    if (granularity === "hourly") {
      const hour = String(bucketDate.getHours()).padStart(2, "0");
      timestamp = `${year}-${month}-${day}T${hour}:00:00+05:30`;
    } else {
      timestamp = `${year}-${month}-${day}T00:00:00+05:30`;
    }

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

    // Increment based on granularity
    incrementDate(current, granularity);
  }

  return buckets;
}

/**
 * Format bucket name based on granularity
 */
function formatBucketName(date: Date, granularity: Granularity): string {
  switch (granularity) {
    case "hourly":
      return date
        .toLocaleTimeString("en-US", {
          hour: "numeric",
          hour12: true,
        })
        .toLowerCase();
    case "daily":
      // Format: "01 Nov", "02 Nov", etc.
      const day = date.getDate().toString().padStart(2, "0");
      const month = date.toLocaleDateString("en-US", { month: "short" });
      return `${day} ${month}`;
    case "weekly":
      return `Week ${getWeekNumber(date)}`;
    case "monthly":
      // Format: "May 2024", "Jun 2024", etc.
      const monthName = date.toLocaleDateString("en-US", { month: "short" });
      const year = date.getFullYear();
      return `${monthName} ${year}`;
    default:
      return date.toLocaleDateString();
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
 * Increment date based on granularity
 */
function incrementDate(date: Date, granularity: Granularity): void {
  switch (granularity) {
    case "hourly":
      date.setHours(date.getHours() + 1);
      break;
    case "daily":
      date.setDate(date.getDate() + 1);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
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
