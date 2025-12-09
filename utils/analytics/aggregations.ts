import connectDB from "@/db";
import PageView from "@/db/models/PageView";
import Session from "@/db/models/Session";
import Payment from "@/db/models/Payment";
import { Types } from "mongoose";

export type Granularity = "hourly" | "daily" | "weekly" | "monthly";

function getDateTruncUnit(granularity: Granularity): string {
  switch (granularity) {
    case "hourly":
      return "hour";
    case "daily":
      return "day";
    case "weekly":
      return "week";
    case "monthly":
      return "month";
    default:
      return "day";
  }
}

export async function getVisitorsOverTime(
  websiteId: string,
  startDate: Date,
  endDate: Date,
  granularity: Granularity = "daily"
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);
  const unit = getDateTruncUnit(granularity);

  const pipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          $dateTrunc: {
            date: "$timestamp",
            unit: unit,
          },
        },
        visitors: { $addToSet: "$visitorId" },
      },
    },
    {
      $project: {
        date: "$_id",
        count: { $size: "$visitors" },
        _id: 0,
      },
    },
    {
      $sort: { date: 1 as const },
    },
  ];

  const results = await PageView.aggregate(pipeline);
  return results.map((r) => ({
    date: r.date,
    visitors: r.count,
  }));
}

/**
 * Get revenue over time
 * Returns raw revenue components separately - frontend should calculate net revenue if needed
 * - revenue: sum of non-refunded payments (gross revenue)
 * - revenueNew: sum of non-refunded, non-renewal payments
 * - revenueRefund: sum of refunded payments
 * Note: Net revenue = revenue - revenueRefund (calculated in frontend)
 */
export async function getRevenueOverTime(
  websiteId: string,
  startDate: Date,
  endDate: Date,
  granularity: Granularity = "daily"
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);
  const unit = getDateTruncUnit(granularity);

  const pipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          $dateTrunc: {
            date: "$timestamp",
            unit: unit,
          },
        },
        revenue: {
          $sum: {
            $cond: [{ $eq: ["$refunded", false] }, "$amount", 0],
          },
        },
        revenueNew: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$refunded", false] },
                  { $eq: ["$renewal", false] },
                ],
              },
              "$amount",
              0,
            ],
          },
        },
        revenueRefund: {
          $sum: {
            $cond: [{ $eq: ["$refunded", true] }, "$amount", 0],
          },
        },
      },
    },
    {
      $project: {
        date: "$_id",
        revenue: 1,
        revenueNew: 1,
        revenueRefund: 1,
        _id: 0,
      },
    },
    {
      $sort: { date: 1 as const },
    },
  ];

  return await Payment.aggregate(pipeline);
}

/**
 * Get source breakdown (channel, referrer, campaign, keyword)
 */
export async function getSourceBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date,
  type: "channel" | "referrer" | "campaign" | "keyword" = "channel"
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);

  let groupField: string;
  switch (type) {
    case "channel":
      // Determine channel from UTM medium or referrer
      groupField = "$utmMedium";
      break;
    case "referrer":
      groupField = "$referrerDomain";
      break;
    case "campaign":
      groupField = "$utmCampaign";
      break;
    case "keyword":
      groupField = "$utmTerm";
      break;
    default:
      groupField = "$utmMedium";
  }

  const pipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: groupField || "Direct",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        name: { $ifNull: ["$_id", "Direct"] },
        value: "$count",
        _id: 0,
      },
    },
    {
      $sort: { value: -1 as const },
    },
    {
      $limit: 20,
    },
  ];

  return await PageView.aggregate(pipeline);
}

/**
 * Get path breakdown (page, hostname, entry, exit)
 */
export async function getPathBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date,
  type: "page" | "hostname" | "entry" | "exit" = "page"
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);

  let groupField: string;
  switch (type) {
    case "page":
      groupField = "$path";
      break;
    case "hostname":
      groupField = "$hostname";
      break;
    case "entry":
      // Entry pages - first page in session
      // This requires session data, simplified for now
      groupField = "$path";
      break;
    case "exit":
      // Exit pages - last page in session
      // This requires session data, simplified for now
      groupField = "$path";
      break;
    default:
      groupField = "$path";
  }

  const pipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: groupField,
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        name: "$_id",
        value: "$count",
        _id: 0,
      },
    },
    {
      $sort: { value: -1 as const },
    },
    {
      $limit: 20,
    },
  ];

  return await PageView.aggregate(pipeline);
}

/**
 * Get location breakdown (country, region, city)
 */
export async function getLocationBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date,
  type: "country" | "region" | "city" = "country"
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);

  let groupField: string;
  switch (type) {
    case "country":
      groupField = "$country";
      break;
    case "region":
      groupField = "$region";
      break;
    case "city":
      groupField = "$city";
      break;
    default:
      groupField = "$country";
  }

  const pipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: groupField || "Unknown",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        name: { $ifNull: ["$_id", "Unknown"] },
        value: "$count",
        _id: 0,
      },
    },
    {
      $sort: { value: -1 as const },
    },
    {
      $limit: 20,
    },
  ];

  return await PageView.aggregate(pipeline);
}

/**
 * Get system breakdown (browser, OS, device)
 */
export async function getSystemBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date,
  type: "browser" | "os" | "device" = "browser"
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);

  let groupField: string;
  switch (type) {
    case "browser":
      groupField = "$browser";
      break;
    case "os":
      groupField = "$os";
      break;
    case "device":
      groupField = "$device";
      break;
    default:
      groupField = "$browser";
  }

  const pipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: groupField,
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        name: "$_id",
        value: "$count",
        _id: 0,
      },
    },
    {
      $sort: { value: -1 as const },
    },
    {
      $limit: 20,
    },
  ];

  return await PageView.aggregate(pipeline);
}

/**
 * Get overall metrics
 * Returns raw revenue components separately - frontend should calculate net revenue if needed
 * - revenue: total non-refunded payments (gross revenue)
 * - revenueRefund: total refunded payments
 * Note: Net revenue = revenue - revenueRefund (calculated in frontend)
 */
export async function getMetrics(
  websiteId: string,
  startDate: Date,
  endDate: Date
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);

  const uniqueVisitors = await PageView.distinct("visitorId", {
    websiteId: websiteObjectId,
    timestamp: { $gte: startDate, $lte: endDate },
  });

  const totalPageViews = await PageView.countDocuments({
    websiteId: websiteObjectId,
    timestamp: { $gte: startDate, $lte: endDate },
  });

  // Get raw revenue components (not net revenue)
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

  const totalRevenue = revenueResult[0]?.totalRevenue || 0;
  const totalRefunds = revenueResult[0]?.totalRefunds || 0;

  // Get sessions
  const sessions = await Session.find({
    websiteId: websiteObjectId,
    firstVisitAt: { $gte: startDate, $lte: endDate },
  });

  const totalSessions = sessions.length;
  const bounceRate =
    totalSessions > 0
      ? (sessions.filter((s) => s.bounce).length / totalSessions) * 100
      : 0;

  // Average session duration
  const avgDuration =
    totalSessions > 0
      ? sessions.reduce((sum, s) => sum + s.duration, 0) / totalSessions
      : 0;

  // Conversion rate (sessions with payments / total sessions)
  const sessionsWithPayments = await Payment.distinct("sessionId", {
    websiteId: websiteObjectId,
    timestamp: { $gte: startDate, $lte: endDate },
    refunded: false,
  });

  const conversionRate =
    totalSessions > 0 ? (sessionsWithPayments.length / totalSessions) * 100 : 0;

  // Revenue per visitor
  const revenuePerVisitor =
    uniqueVisitors.length > 0 ? totalRevenue / uniqueVisitors.length : 0;

  return {
    visitors: uniqueVisitors.length,
    pageViews: totalPageViews,
    revenue: totalRevenue,
    revenueRefund: totalRefunds,
    sessions: totalSessions,
    bounceRate,
    sessionTime: avgDuration,
    conversionRate,
    revenuePerVisitor,
  };
}

export async function getVisitorsNow(websiteId: string) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const activeSessions = await Session.distinct("visitorId", {
    websiteId: websiteObjectId,
    lastSeenAt: { $gte: fiveMinutesAgo },
  });

  return activeSessions.length;
}
