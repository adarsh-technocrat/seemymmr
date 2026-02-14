import connectDB from "@/db";
import Session from "@/db/models/Session";
import Payment from "@/db/models/Payment";
import GoalEvent from "@/db/models/GoalEvent";
import { Types } from "mongoose";
import { getSystemImageUrl } from "@/utils/tracking/device";
import type { Granularity } from "../types";
import { getDateTruncUnit } from "../utils";

export async function getSystemBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date,
  type: "browser" | "os" | "device" = "browser",
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);

  // Step 1: Get unique visitors and sessions per system type from Session
  // Build the group _id dynamically based on type
  let sessionsGroupId: any;

  if (type === "browser") {
    sessionsGroupId = { systemType: "$browser", visitorId: "$visitorId" };
  } else if (type === "os") {
    sessionsGroupId = { systemType: "$os", visitorId: "$visitorId" };
  } else {
    sessionsGroupId = { systemType: "$device", visitorId: "$visitorId" };
  }

  const sessionsPipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        firstVisitAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: sessionsGroupId,
        sessionIds: { $addToSet: "$_id" },
      },
    },
    {
      $group: {
        _id: "$_id.systemType",
        uniqueVisitors: { $sum: 1 },
        allSessionIds: { $push: "$sessionIds" },
      },
    },
    {
      $project: {
        _id: 1,
        uniqueVisitors: 1,
        sessionIds: {
          $reduce: {
            input: "$allSessionIds",
            initialValue: [],
            in: { $setUnion: ["$$value", "$$this"] },
          },
        },
      },
    },
  ];

  const sessionsData = await Session.aggregate(sessionsPipeline);

  // Step 2: Get revenue per system type from Payment (via Session)
  // Build the group _id dynamically based on type
  let revenueGroupId: any;
  let goalsGroupId: any;

  if (type === "browser") {
    revenueGroupId = "$session.browser";
    goalsGroupId = "$session.browser";
  } else if (type === "os") {
    revenueGroupId = "$session.os";
    goalsGroupId = "$session.os";
  } else {
    revenueGroupId = "$session.device";
    goalsGroupId = "$session.device";
  }

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
        from: "sessions",
        localField: "sessionId",
        foreignField: "sessionId",
        as: "session",
      },
    },
    {
      $unwind: {
        path: "$session",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $group: {
        _id: revenueGroupId,
        revenue: { $sum: "$amount" },
        sessionsWithPayments: { $addToSet: "$sessionId" },
      },
    },
  ];

  const revenueData = await Payment.aggregate(revenuePipeline);

  // Step 3: Get goal count per system type from GoalEvent (via Session)
  const goalsPipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
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
    {
      $unwind: {
        path: "$session",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $group: {
        _id: goalsGroupId,
        goalCount: { $sum: 1 },
        uniqueVisitorsWithGoals: { $addToSet: "$visitorId" },
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

  const result = sessionsData.map((item) => {
    const systemName = item._id || "Unknown";
    const revenueInfo = revenueMap.get(systemName);
    const goalsInfo = goalsMap.get(systemName);

    const uv = item.uniqueVisitors || 0;
    const revenue = revenueInfo?.revenue || 0;
    const sessionsWithPayments = revenueInfo?.sessionsWithPayments?.length || 0;
    // Conversion rate: sessions with payments / unique visitors
    const conversionRate = uv > 0 ? sessionsWithPayments / uv : 0;
    const goalCount = goalsInfo?.goalCount || 0;
    // Goal conversion rate: unique visitors with goals / unique visitors
    const goalConversionRate =
      uv > 0 ? (goalsInfo?.uniqueVisitorsWithGoals?.length || 0) / uv : 0;

    return {
      name: systemName,
      uv,
      image: getSystemImageUrl(systemName, type),
      revenue,
      conversionRate,
      goalCount,
      goalConversionRate,
    };
  });

  // Sort by unique visitors descending
  result.sort((a, b) => b.uv - a.uv);

  return result;
}
