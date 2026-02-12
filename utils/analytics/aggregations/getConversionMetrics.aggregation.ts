import connectDB from "@/db";
import Session from "@/db/models/Session";
import Payment from "@/db/models/Payment";
import PageView from "@/db/models/PageView";
import GoalEvent from "@/db/models/GoalEvent";
import Goal from "@/db/models/Goal";
import { Types } from "mongoose";
import type {
  ConversionMetricsPayload,
  VisitBucket,
  DimensionRow,
  CustomEventRow,
  HourlyCell,
} from "@/types/conversion-metrics";

const DAYS = 30;
const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function emptyVisitBucket(): VisitBucket {
  return { count: 0, percentage: 0, totalRevenue: 0 };
}

function emptyHourlyCell(): HourlyCell {
  return { count: 0, revenue: 0, averageValue: 0 };
}

export async function getConversionMetrics(
  websiteId: string,
): Promise<ConversionMetricsPayload> {
  await connectDB();
  const websiteObjectId = new Types.ObjectId(websiteId);
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - DAYS * 24 * 60 * 60 * 1000);

  const [
    paymentsWithSessions,
    totalVisitorsCount,
    sessionsForVisitors,
    goalsList,
  ] = await Promise.all([
    getPaymentsWithSessions(websiteObjectId, startDate, endDate),
    PageView.distinct("visitorId", {
      websiteId: websiteObjectId,
      timestamp: { $gte: startDate, $lte: endDate },
    }).then((arr) => arr.length),
    getSessionsWithPageViews(websiteObjectId, startDate, endDate),
    Goal.find({ websiteId: websiteObjectId }).lean(),
  ]);

  const totalConversions = paymentsWithSessions.length;
  const totalRevenueCents = paymentsWithSessions.reduce(
    (sum, p) => sum + (p.amount ?? 0),
    0,
  );
  const totalRevenue = totalRevenueCents / 100;
  const baselineConversionRate =
    totalVisitorsCount > 0 ? totalConversions / totalVisitorsCount : 0;
  const baselineAverageValue =
    totalConversions > 0 ? totalRevenue / totalConversions : 0;
  const averageDailyVisitors = totalVisitorsCount / DAYS;
  const averageDailyRevenue = totalRevenue / DAYS;

  const visitsToConversion = buildVisitsToConversion(paymentsWithSessions);
  const timeToConversion = buildTimeToConversion(paymentsWithSessions);
  const purchaseTimePatterns = buildPurchaseTimePatterns(paymentsWithSessions);
  const dimensions = await buildDimensions(
    websiteObjectId,
    startDate,
    endDate,
    totalConversions,
    totalVisitorsCount,
  );
  const customEvents = await buildCustomEvents(
    websiteObjectId,
    startDate,
    endDate,
    goalsList,
    totalConversions,
    totalRevenue,
  );

  const now = new Date().toISOString();
  return {
    visitsToConversion,
    timeToConversion,
    purchaseTimePatterns,
    dimensions,
    timeRange: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    websiteId,
    totalVisitors: totalVisitorsCount,
    totalConversions,
    baselineConversionRate,
    baselineAverageValue,
    totalRevenue,
    averageDailyVisitors: Math.round(averageDailyVisitors),
    averageDailyRevenue: Math.round(averageDailyRevenue),
    customEvents,
    status: "completed",
    createdAt: now,
    updatedAt: now,
    processingTime: 0,
    revenuePerVisitorOverTime: [],
  };
}

interface PaymentWithSession {
  amount: number;
  timestamp: Date;
  sessionId?: string;
  visitorId?: string;
  pageViews?: number;
  firstVisitAt?: Date;
  device?: string;
  os?: string;
  browser?: string;
  country?: string;
  referrerDomain?: string;
}

async function getPaymentsWithSessions(
  websiteId: Types.ObjectId,
  startDate: Date,
  endDate: Date,
): Promise<PaymentWithSession[]> {
  const payments = await Payment.aggregate([
    {
      $match: {
        websiteId,
        timestamp: { $gte: startDate, $lte: endDate },
        refunded: false,
      },
    },
    {
      $lookup: {
        from: "sessions",
        localField: "sessionId",
        foreignField: "sessionId",
        as: "session",
      },
    },
    { $unwind: { path: "$session", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        amount: 1,
        timestamp: 1,
        sessionId: 1,
        visitorId: 1,
        pageViews: "$session.pageViews",
        firstVisitAt: "$session.firstVisitAt",
        device: "$session.device",
        os: "$session.os",
        browser: "$session.browser",
        country: "$session.country",
        referrerDomain: "$session.referrerDomain",
      },
    },
  ]);
  return payments.map((p) => ({
    amount: p.amount ?? 0,
    timestamp: p.timestamp,
    sessionId: p.sessionId,
    visitorId: p.visitorId,
    pageViews: p.pageViews ?? 1,
    firstVisitAt: p.firstVisitAt,
    device: (p.device ?? "desktop").toLowerCase(),
    os: (p.os ?? "").toLowerCase(),
    browser: (p.browser ?? "").toLowerCase(),
    country: p.country ?? "",
    referrerDomain: p.referrerDomain ?? "direct",
  }));
}

async function getSessionsWithPageViews(
  websiteId: Types.ObjectId,
  startDate: Date,
  endDate: Date,
): Promise<Map<string, number>> {
  const sessions = await Session.find({
    websiteId,
    firstVisitAt: { $gte: startDate, $lte: endDate },
  })
    .select("sessionId pageViews")
    .lean();
  const map = new Map<string, number>();
  for (const s of sessions) {
    map.set(s.sessionId, s.pageViews ?? 1);
  }
  return map;
}

function buildVisitsToConversion(
  payments: PaymentWithSession[],
): ConversionMetricsPayload["visitsToConversion"] {
  const distribution: Record<string, VisitBucket> = {};
  for (let i = 1; i <= 30; i++) {
    distribution[String(i)] = emptyVisitBucket();
  }
  distribution["31+"] = emptyVisitBucket();

  const visits: number[] = [];
  let totalRev = 0;
  for (const p of payments) {
    const v = Math.min(31, Math.max(1, p.pageViews ?? 1));
    const key = v <= 30 ? String(v) : "31+";
    if (!distribution[key]) distribution[key] = emptyVisitBucket();
    distribution[key].count += 1;
    distribution[key].totalRevenue += (p.amount ?? 0) / 100;
    totalRev += (p.amount ?? 0) / 100;
    visits.push(v <= 30 ? v : 31);
  }

  const n = payments.length;
  for (const key of Object.keys(distribution)) {
    distribution[key].percentage = n > 0 ? distribution[key].count / n : 0;
  }

  const average = visits.length
    ? visits.reduce((a, b) => a + b, 0) / visits.length
    : 0;
  const sorted = [...visits].sort((a, b) => a - b);
  const median =
    sorted.length > 0
      ? sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2
        : sorted[Math.floor(sorted.length / 2)]!
      : 0;

  return { distribution, average, median };
}

function buildTimeToConversion(
  payments: PaymentWithSession[],
): ConversionMetricsPayload["timeToConversion"] {
  const buckets = [
    "same_day",
    "day_1",
    "day_2",
    "day_3",
    "day_4",
    "day_5",
    "day_6",
    "day_7",
    "day_8",
    "day_9",
    "day_10",
    "days_11_15",
    "days_16_20",
    "days_21_30",
    "days_30_plus",
  ];
  const distribution: Record<string, VisitBucket> = {};
  for (const b of buckets) {
    distribution[b] = emptyVisitBucket();
  }

  const hoursList: number[] = [];
  for (const p of payments) {
    const first = p.firstVisitAt
      ? new Date(p.firstVisitAt).getTime()
      : p.timestamp.getTime();
    const payTime = new Date(p.timestamp).getTime();
    const hours = (payTime - first) / (1000 * 60 * 60);
    const days = hours / 24;
    hoursList.push(hours);

    let key: string;
    if (days < 1) key = "same_day";
    else if (days < 2) key = "day_1";
    else if (days < 3) key = "day_2";
    else if (days < 4) key = "day_3";
    else if (days < 5) key = "day_4";
    else if (days < 6) key = "day_5";
    else if (days < 7) key = "day_6";
    else if (days < 8) key = "day_7";
    else if (days < 9) key = "day_8";
    else if (days < 10) key = "day_9";
    else if (days < 11) key = "day_10";
    else if (days < 16) key = "days_11_15";
    else if (days < 21) key = "days_16_20";
    else if (days < 31) key = "days_21_30";
    else key = "days_30_plus";

    distribution[key].count += 1;
    distribution[key].totalRevenue += (p.amount ?? 0) / 100;
  }

  const n = payments.length;
  for (const key of Object.keys(distribution)) {
    distribution[key].percentage = n > 0 ? distribution[key].count / n : 0;
  }

  const averageHours =
    hoursList.length > 0
      ? hoursList.reduce((a, b) => a + b, 0) / hoursList.length
      : 0;
  const sorted = [...hoursList].sort((a, b) => a - b);
  const medianHours =
    sorted.length > 0
      ? sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2
        : sorted[Math.floor(sorted.length / 2)]!
      : 0;

  return { distribution, averageHours, medianHours };
}

function buildPurchaseTimePatterns(
  payments: PaymentWithSession[],
): ConversionMetricsPayload["purchaseTimePatterns"] {
  const hourlyDistribution: Record<string, HourlyCell> = {};
  for (const day of DAY_NAMES) {
    for (let h = 0; h < 24; h++) {
      hourlyDistribution[`${day}_${h}`] = emptyHourlyCell();
    }
  }

  let peakCount = 0;
  let peakDay = "sunday";
  let peakHour = 0;

  for (const p of payments) {
    const d = new Date(p.timestamp);
    const day = DAY_NAMES[d.getUTCDay()];
    const hour = d.getUTCHours();
    const key = `${day}_${hour}`;
    if (!hourlyDistribution[key]) hourlyDistribution[key] = emptyHourlyCell();
    hourlyDistribution[key].count += 1;
    hourlyDistribution[key].revenue += (p.amount ?? 0) / 100;
    if (hourlyDistribution[key].count > peakCount) {
      peakCount = hourlyDistribution[key].count;
      peakDay = day;
      peakHour = hour;
    }
  }
  for (const key of Object.keys(hourlyDistribution)) {
    const c = hourlyDistribution[key];
    hourlyDistribution[key].averageValue =
      c.count > 0 ? c.revenue / c.count : 0;
  }

  return {
    peakDayHour: { day: peakDay, hour: peakHour, count: peakCount },
    hourlyDistribution,
    peakDay,
    peakHour,
  };
}

async function buildDimensions(
  websiteId: Types.ObjectId,
  startDate: Date,
  endDate: Date,
  totalConversions: number,
  totalVisitors: number,
): Promise<ConversionMetricsPayload["dimensions"]> {
  const [deviceRows, osRows, browserRows, countryRows, referrerRows] =
    await Promise.all([
      getDimensionFromPayments(websiteId, startDate, endDate, "device"),
      getDimensionFromPayments(websiteId, startDate, endDate, "os"),
      getDimensionFromPayments(websiteId, startDate, endDate, "browser"),
      getDimensionFromPayments(websiteId, startDate, endDate, "country"),
      getReferrerDimension(websiteId, startDate, endDate),
    ]);

  const devices: Record<string, DimensionRow> = {};
  for (const r of deviceRows) {
    const deviceKey = (r._id ?? "desktop").toString().toLowerCase();
    devices[deviceKey] = {
      visitors: r.visitors,
      conversions: r.conversions,
      conversionRate: r.conversionRate,
      totalRevenue: r.totalRevenue / 100,
      averageValue:
        r.conversions > 0 ? r.totalRevenue / 100 / r.conversions : 0,
      averageVisitsToConversion: 0,
    };
  }
  const operatingSystems: Record<string, DimensionRow> = {};
  for (const r of osRows) {
    const key = (r._id ?? "unknown").toLowerCase();
    operatingSystems[key] = {
      visitors: r.visitors,
      conversions: r.conversions,
      conversionRate: r.conversionRate,
      totalRevenue: r.totalRevenue / 100,
      averageValue:
        r.conversions > 0 ? r.totalRevenue / 100 / r.conversions : 0,
      averageVisitsToConversion: 0,
    };
  }
  const browsers: Record<string, DimensionRow> = {};
  for (const r of browserRows) {
    const key = (r._id ?? "unknown").toLowerCase();
    browsers[key] = {
      visitors: r.visitors,
      conversions: r.conversions,
      conversionRate: r.conversionRate,
      totalRevenue: r.totalRevenue / 100,
      averageValue:
        r.conversions > 0 ? r.totalRevenue / 100 / r.conversions : 0,
      averageVisitsToConversion: 0,
    };
  }
  const countries: Record<string, DimensionRow> = {};
  for (const r of countryRows) {
    countries[r._id ?? "Unknown"] = {
      visitors: r.visitors,
      conversions: r.conversions,
      conversionRate: r.conversionRate,
      totalRevenue: r.totalRevenue / 100,
      averageValue:
        r.conversions > 0 ? r.totalRevenue / 100 / r.conversions : 0,
      averageVisitsToConversion: 0,
    };
  }
  const referrers: Record<string, DimensionRow> = {};
  for (const r of referrerRows) {
    referrers[r._id ?? "direct"] = {
      visitors: r.visitors,
      conversions: r.conversions,
      conversionRate: r.conversionRate,
      totalRevenue: r.totalRevenue / 100,
      averageValue:
        r.conversions > 0 ? r.totalRevenue / 100 / r.conversions : 0,
    };
  }

  return {
    devices,
    operatingSystems,
    browsers,
    countries,
    referrers,
  };
}

async function getDimensionFromPayments(
  websiteId: Types.ObjectId,
  startDate: Date,
  endDate: Date,
  field: "device" | "os" | "browser" | "country",
): Promise<
  Array<{
    _id: string;
    visitors: number;
    conversions: number;
    conversionRate: number;
    totalRevenue: number;
  }>
> {
  const sessionField = `session.${field}`;
  const sessionIdField = field === "country" ? "$country" : `$${field}`;
  const [visitorCounts, paymentGroups] = await Promise.all([
    Session.aggregate([
      {
        $match: {
          websiteId,
          firstVisitAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: { _id: sessionIdField, visitors: { $addToSet: "$visitorId" } },
      },
      { $project: { _id: 1, visitors: { $size: "$visitors" } } },
    ]),
    Payment.aggregate([
      {
        $match: {
          websiteId,
          timestamp: { $gte: startDate, $lte: endDate },
          refunded: false,
        },
      },
      {
        $lookup: {
          from: "sessions",
          localField: "sessionId",
          foreignField: "sessionId",
          as: "session",
        },
      },
      { $unwind: { path: "$session", preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: `$${sessionField}`,
          conversions: { $sum: 1 },
          totalRevenue: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  const visitorMap = new Map<string, number>();
  for (const r of visitorCounts) {
    const id = (r._id ?? "unknown").toString();
    const key = field === "country" ? id : id.toLowerCase();
    visitorMap.set(key, r.visitors ?? 0);
  }
  const paymentMap = new Map<
    string,
    { conversions: number; totalRevenue: number }
  >();
  for (const p of paymentGroups) {
    const id = (p._id ?? "unknown").toString();
    const key = field === "country" ? id : id.toLowerCase();
    paymentMap.set(key, {
      conversions: p.conversions ?? 0,
      totalRevenue: p.totalRevenue ?? 0,
    });
  }
  const result: Array<{
    _id: string;
    visitors: number;
    conversions: number;
    conversionRate: number;
    totalRevenue: number;
  }> = [];
  const seen = new Set<string>();
  for (const r of visitorCounts) {
    const id = (r._id ?? "unknown").toString();
    const key = field === "country" ? id : id.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const visitors = visitorMap.get(key) ?? 0;
    const pay = paymentMap.get(key);
    result.push({
      _id: field === "country" ? id : key,
      visitors,
      conversions: pay?.conversions ?? 0,
      conversionRate: visitors > 0 ? (pay?.conversions ?? 0) / visitors : 0,
      totalRevenue: pay?.totalRevenue ?? 0,
    });
  }
  return result;
}

async function getReferrerDimension(
  websiteId: Types.ObjectId,
  startDate: Date,
  endDate: Date,
): Promise<
  Array<{
    _id: string;
    visitors: number;
    conversions: number;
    conversionRate: number;
    totalRevenue: number;
  }>
> {
  const [visitorCounts, paymentGroups] = await Promise.all([
    Session.aggregate([
      {
        $match: {
          websiteId,
          firstVisitAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $addFields: {
          ref: {
            $cond: {
              if: {
                $and: ["$referrerDomain", { $ne: ["$referrerDomain", ""] }],
              },
              then: "$referrerDomain",
              else: "direct",
            },
          },
        },
      },
      { $group: { _id: "$ref", visitors: { $addToSet: "$visitorId" } } },
      { $project: { _id: 1, visitors: { $size: "$visitors" } } },
    ]),
    Payment.aggregate([
      {
        $match: {
          websiteId,
          timestamp: { $gte: startDate, $lte: endDate },
          refunded: false,
        },
      },
      {
        $lookup: {
          from: "sessions",
          localField: "sessionId",
          foreignField: "sessionId",
          as: "session",
        },
      },
      { $unwind: { path: "$session", preserveNullAndEmptyArrays: false } },
      {
        $addFields: {
          ref: {
            $cond: {
              if: {
                $and: [
                  "$session.referrerDomain",
                  { $ne: ["$session.referrerDomain", ""] },
                ],
              },
              then: "$session.referrerDomain",
              else: "direct",
            },
          },
        },
      },
      {
        $group: {
          _id: "$ref",
          conversions: { $sum: 1 },
          totalRevenue: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  const visitorMap = new Map<string, number>();
  for (const r of visitorCounts) {
    visitorMap.set(
      (r._id ?? "direct").toString().replace(/\./g, "_"),
      r.visitors ?? 0,
    );
  }
  return paymentGroups.map((p) => {
    const id = (p._id ?? "direct").toString().replace(/\./g, "_");
    const visitors = visitorMap.get(id) ?? 0;
    return {
      _id: id,
      visitors,
      conversions: p.conversions ?? 0,
      conversionRate: visitors > 0 ? (p.conversions ?? 0) / visitors : 0,
      totalRevenue: p.totalRevenue ?? 0,
    };
  });
}

async function buildCustomEvents(
  websiteId: Types.ObjectId,
  startDate: Date,
  endDate: Date,
  goalsList: Array<{
    _id: Types.ObjectId;
    event: string;
    description?: string;
  }>,
  totalConversions: number,
  totalRevenue: number,
): Promise<Record<string, CustomEventRow>> {
  const result: Record<string, CustomEventRow> = {};
  const convertingVisitorIds = await Payment.distinct("visitorId", {
    websiteId,
    timestamp: { $gte: startDate, $lte: endDate },
    refunded: false,
  });
  const set = new Set(
    convertingVisitorIds.map((id) => id?.toString()).filter(Boolean),
  );

  for (const goal of goalsList) {
    const eventName = goal.event;
    const [eventCount, eventsWithConverters] = await Promise.all([
      GoalEvent.countDocuments({
        websiteId,
        goalId: goal._id,
        timestamp: { $gte: startDate, $lte: endDate },
      }),
      GoalEvent.aggregate([
        {
          $match: {
            websiteId,
            goalId: goal._id,
            timestamp: { $gte: startDate, $lte: endDate },
            visitorId: { $in: convertingVisitorIds },
          },
        },
        {
          $group: {
            _id: "$visitorId",
            revenue: { $sum: "$value" },
          },
        },
      ]),
    ]);

    const convertersWithGoal = eventsWithConverters.length;
    const revenueFromPayments = await Payment.aggregate([
      {
        $match: {
          websiteId,
          timestamp: { $gte: startDate, $lte: endDate },
          refunded: false,
          visitorId: { $in: eventsWithConverters.map((e) => e._id) },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRev = (revenueFromPayments[0]?.total ?? 0) / 100;

    result[eventName] = {
      count: eventCount,
      totalConversions: convertersWithGoal,
      conversionRate:
        totalConversions > 0 ? convertersWithGoal / totalConversions : 0,
      averageTimeToConversion: 0,
      description: goal.description ?? "",
      totalRevenue: totalRev,
      averageValue: convertersWithGoal > 0 ? totalRev / convertersWithGoal : 0,
    };
  }
  return result;
}
