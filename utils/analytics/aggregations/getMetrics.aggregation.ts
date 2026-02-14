import connectDB from "@/db";
import PageView from "@/db/models/PageView";
import Payment from "@/db/models/Payment";
import Session from "@/db/models/Session";
import { Types } from "mongoose";

export async function getMetrics(
  websiteId: string,
  startDate: Date,
  endDate: Date,
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);
  const match = {
    websiteId: websiteObjectId,
    timestamp: { $gte: startDate, $lte: endDate },
  };
  const sessionMatch = {
    websiteId: websiteObjectId,
    firstVisitAt: { $gte: startDate, $lte: endDate },
  };

  const [
    uniqueVisitorsResult,
    totalPageViews,
    revenueResult,
    sessionStatsResult,
    sessionsWithPaymentsResult,
  ] = await Promise.all([
    PageView.aggregate([
      { $match: match },
      { $group: { _id: "$visitorId" } },
      { $count: "count" },
    ]),
    PageView.countDocuments(match),
    Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $cond: [{ $eq: ["$refunded", false] }, "$amount", 0] },
          },
          totalRefunds: {
            $sum: { $cond: [{ $eq: ["$refunded", true] }, "$amount", 0] },
          },
        },
      },
    ]),
    Session.aggregate([
      { $match: sessionMatch },
      {
        $project: {
          bounce: 1,
          duration: 1,
          firstVisitAt: 1,
          lastSeenAt: 1,
          computedDuration: {
            $cond: [
              { $gt: ["$duration", 0] },
              "$duration",
              {
                $floor: {
                  $divide: [
                    { $subtract: ["$lastSeenAt", "$firstVisitAt"] },
                    1000,
                  ],
                },
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          bounceCount: { $sum: { $cond: ["$bounce", 1, 0] } },
          totalDuration: { $sum: "$computedDuration" },
        },
      },
    ]),
    Payment.aggregate([
      {
        $match: {
          websiteId: websiteObjectId,
          timestamp: { $gte: startDate, $lte: endDate },
          refunded: false,
        },
      },
      { $group: { _id: "$sessionId" } },
      { $count: "count" },
    ]),
  ]);

  const uniqueVisitorsCount = uniqueVisitorsResult[0]?.count ?? 0;
  const totalRevenue = revenueResult[0]?.totalRevenue ?? 0;
  const totalRefunds = revenueResult[0]?.totalRefunds ?? 0;
  const sessionStats = sessionStatsResult[0];
  const totalSessions = sessionStats?.totalSessions ?? 0;
  const bounceCount = sessionStats?.bounceCount ?? 0;
  const totalDuration = sessionStats?.totalDuration ?? 0;
  const sessionsWithPaymentsCount = sessionsWithPaymentsResult[0]?.count ?? 0;

  const bounceRate =
    totalSessions > 0 ? (bounceCount / totalSessions) * 100 : 0;
  const avgDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
  const conversionRate =
    totalSessions > 0 ? (sessionsWithPaymentsCount / totalSessions) * 100 : 0;
  const revenuePerVisitor =
    uniqueVisitorsCount > 0 ? totalRevenue / uniqueVisitorsCount : 0;

  return {
    visitors: uniqueVisitorsCount,
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
