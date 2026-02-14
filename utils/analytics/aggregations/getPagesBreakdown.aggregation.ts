import connectDB from "@/db";
import PageView from "@/db/models/PageView";
import Session from "@/db/models/Session";
import Payment from "@/db/models/Payment";
import GoalEvent from "@/db/models/GoalEvent";
import { Types } from "mongoose";
import type { Granularity } from "../types";
import { getDateTruncUnit } from "../utils";

export async function getPagesBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date,
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);

  // Step 1: Get unique visitors per page from PageView
  const pagesPipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $addFields: {
        cleanPath: {
          $arrayElemAt: [
            {
              $split: ["$path", "?"],
            },
            0,
          ],
        },
      },
    },
    {
      $group: {
        _id: {
          path: "$cleanPath",
          hostname: "$hostname",
          visitorId: "$visitorId",
        },
        sessionIds: { $addToSet: "$sessionId" },
      },
    },
    {
      $group: {
        _id: {
          path: "$_id.path",
          hostname: "$_id.hostname",
        },
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

  const pagesData = await PageView.aggregate(pagesPipeline);

  // Step 2: Get revenue per page from Payment (via Session -> PageView)
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
      $addFields: {
        cleanPath: {
          $arrayElemAt: [
            {
              $split: ["$pageViews.path", "?"],
            },
            0,
          ],
        },
      },
    },
    {
      $group: {
        _id: {
          path: "$cleanPath",
          hostname: "$pageViews.hostname",
        },
        revenue: { $sum: "$amount" },
        sessionsWithPayments: { $addToSet: "$sessionId" },
      },
    },
  ];

  const revenueData = await Payment.aggregate(revenuePipeline);

  // Step 3: Get goal count per page from GoalEvent (via Session -> PageView)
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
      $addFields: {
        cleanPath: {
          $arrayElemAt: [
            {
              $split: ["$pageViews.path", "?"],
            },
            0,
          ],
        },
      },
    },
    {
      $group: {
        _id: {
          path: "$cleanPath",
          hostname: "$pageViews.hostname",
        },
        goalCount: { $sum: 1 },
        uniqueVisitorsWithGoals: { $addToSet: "$visitorId" },
      },
    },
  ];

  const goalsData = await GoalEvent.aggregate(goalsPipeline);

  // Step 4: Combine all data
  const revenueMap = new Map(
    revenueData.map((item) => [
      `${item._id.path || "Unknown"}::${item._id.hostname || "Unknown"}`,
      item,
    ]),
  );
  const goalsMap = new Map(
    goalsData.map((item) => [
      `${item._id.path || "Unknown"}::${item._id.hostname || "Unknown"}`,
      item,
    ]),
  );

  const result = pagesData.map((item) => {
    const path = item._id.path || "Unknown";
    const hostname = item._id.hostname || "Unknown";
    const key = `${path}::${hostname}`;

    const revenueInfo = revenueMap.get(key);
    const goalsInfo = goalsMap.get(key);

    const uv = item.uniqueVisitors || 0;
    const revenue = revenueInfo?.revenue || 0;
    const sessionsWithPayments = revenueInfo?.sessionsWithPayments?.length || 0;
    const conversionRate = uv > 0 ? sessionsWithPayments / uv : 0;
    const goalCount = goalsInfo?.goalCount || 0;
    const goalConversionRate =
      uv > 0 ? (goalsInfo?.uniqueVisitorsWithGoals?.length || 0) / uv : 0;

    return {
      name: path,
      hostname,
      uv,
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
