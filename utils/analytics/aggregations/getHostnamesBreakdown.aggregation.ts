import connectDB from "@/db";
import PageView from "@/db/models/PageView";
import Session from "@/db/models/Session";
import Payment from "@/db/models/Payment";
import GoalEvent from "@/db/models/GoalEvent";
import { Types } from "mongoose";
import type { Granularity } from "../types";
import { getDateTruncUnit } from "../utils";

export async function getHostnamesBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date,
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);

  // Step 1: Get unique visitors per hostname from PageView
  const hostnamesPipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          hostname: "$hostname",
          visitorId: "$visitorId",
        },
      },
    },
    {
      $group: {
        _id: "$_id.hostname",
        uniqueVisitors: { $sum: 1 },
      },
    },
  ];

  const hostnamesData = await PageView.aggregate(hostnamesPipeline);

  // Step 2: Get revenue per hostname from Payment (via Session -> PageView)
  const revenuePipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
        refunded: false,
      },
    },
    {
      $lookup: {
        from: "pageviews",
        localField: "sessionId",
        foreignField: "sessionId",
        as: "pageViews",
      },
    },
    {
      $unwind: {
        path: "$pageViews",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $group: {
        _id: "$pageViews.hostname",
        revenue: { $sum: "$amount" },
        paymentCount: { $sum: 1 },
      },
    },
  ];

  const revenueData = await Payment.aggregate(revenuePipeline);

  // Step 3: Get goal count per hostname from GoalEvent (via Session -> PageView)
  const goalsPipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $lookup: {
        from: "pageviews",
        localField: "sessionId",
        foreignField: "sessionId",
        as: "pageViews",
      },
    },
    {
      $unwind: {
        path: "$pageViews",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $group: {
        _id: "$pageViews.hostname",
        goalCount: { $sum: 1 },
      },
    },
  ];

  const goalsData = await GoalEvent.aggregate(goalsPipeline);

  // Step 4: Combine all data
  const revenueMap = new Map(
    revenueData.map((item) => [item._id || "Unknown", item]),
  );
  const goalsMap = new Map(
    goalsData.map((item) => [item._id || "Unknown", item]),
  );

  const result = hostnamesData.map((item) => {
    const hostname = item._id || "Unknown";
    const revenueInfo = revenueMap.get(hostname);
    const goalsInfo = goalsMap.get(hostname);

    const uv = item.uniqueVisitors || 0;
    const revenue = revenueInfo?.revenue || 0;
    const paymentCount = revenueInfo?.paymentCount || 0;
    const goalCount = goalsInfo?.goalCount || 0;

    return {
      name: hostname,
      uv,
      revenue,
      paymentCount,
      goalCount,
    };
  });

  // Sort by unique visitors descending
  result.sort((a, b) => b.uv - a.uv);

  return result;
}
