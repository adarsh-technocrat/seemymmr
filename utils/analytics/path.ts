import connectDB from "@/db";
import PageView from "@/db/models/PageView";
import Session from "@/db/models/Session";
import Payment from "@/db/models/Payment";
import GoalEvent from "@/db/models/GoalEvent";
import { Types } from "mongoose";

export async function getPagesBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date
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
    ])
  );
  const goalsMap = new Map(
    goalsData.map((item) => [
      `${item._id.path || "Unknown"}::${item._id.hostname || "Unknown"}`,
      item,
    ])
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

export async function getHostnamesBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date
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
    revenueData.map((item) => [item._id || "Unknown", item])
  );
  const goalsMap = new Map(
    goalsData.map((item) => [item._id || "Unknown", item])
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

export async function getEntryPagesBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);

  // Step 1: Get first page view per session
  const entryPagesPipeline = [
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
      $sort: { timestamp: 1 as const },
    },
    {
      $group: {
        _id: "$sessionId",
        firstPath: { $first: "$cleanPath" },
        firstHostname: { $first: "$hostname" },
        visitorId: { $first: "$visitorId" },
      },
    },
    {
      $group: {
        _id: {
          path: "$firstPath",
          hostname: "$firstHostname",
        },
        uniqueVisitors: { $addToSet: "$visitorId" },
      },
    },
    {
      $project: {
        _id: 1,
        uniqueVisitors: { $size: "$uniqueVisitors" },
      },
    },
  ];

  const entryPagesData = await PageView.aggregate(entryPagesPipeline);

  // Step 2: Get revenue per entry page from Payment (via Session)
  // For entry pages, we need to match payments to sessions and get their first page
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
      $sort: { "pageViews.timestamp": 1 as const },
    },
    {
      $group: {
        _id: "$sessionId",
        firstPath: { $first: "$cleanPath" },
        firstHostname: { $first: "$pageViews.hostname" },
        revenue: { $sum: "$amount" },
      },
    },
    {
      $group: {
        _id: {
          path: "$firstPath",
          hostname: "$firstHostname",
        },
        revenue: { $sum: "$revenue" },
        sessionsWithPayments: { $addToSet: "$_id" },
      },
    },
  ];

  const revenueData = await Payment.aggregate(revenuePipeline);

  // Step 3: Get goal count per entry page from GoalEvent (via Session)
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
      $sort: { "pageViews.timestamp": 1 as const },
    },
    {
      $group: {
        _id: "$sessionId",
        firstPath: { $first: "$cleanPath" },
        firstHostname: { $first: "$pageViews.hostname" },
        visitorId: { $first: "$visitorId" },
      },
    },
    {
      $group: {
        _id: {
          path: "$firstPath",
          hostname: "$firstHostname",
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
    ])
  );
  const goalsMap = new Map(
    goalsData.map((item) => [
      `${item._id.path || "Unknown"}::${item._id.hostname || "Unknown"}`,
      item,
    ])
  );

  const result = entryPagesData.map((item) => {
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

export async function getExitLinksBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);

  const exitLinksPipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
        exitUrl: { $exists: true, $ne: null },
        $expr: { $ne: ["$exitUrl", ""] },
      },
    },
    {
      $addFields: {
        exitDomain: {
          $let: {
            vars: {
              withoutProtocol: {
                $replaceAll: {
                  input: {
                    $replaceAll: {
                      input: "$exitUrl",
                      find: "https://",
                      replacement: "",
                    },
                  },
                  find: "http://",
                  replacement: "",
                },
              },
            },
            in: {
              $arrayElemAt: [{ $split: ["$$withoutProtocol", "/"] }, 0],
            },
          },
        },
      },
    },
    {
      $group: {
        _id: {
          exitDomain: "$exitDomain",
          visitorId: "$visitorId",
        },
        exits: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.exitDomain",
        uniqueVisitors: { $addToSet: "$_id.visitorId" },
        totalExits: { $sum: "$exits" },
      },
    },
    {
      $project: {
        _id: 1,
        uniqueVisitors: { $size: "$uniqueVisitors" },
        totalExits: 1,
      },
    },
  ];

  const exitLinksData = await PageView.aggregate(exitLinksPipeline);

  // Step 2: Format the result with favicon URLs
  const result = exitLinksData.map((item) => {
    const domain = item._id || "";
    // Generate favicon URL using DuckDuckGo's favicon service
    const faviconUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;

    return {
      name: domain,
      uv: item.uniqueVisitors || 0,
      exits: item.totalExits || 0,
      image: faviconUrl,
    };
  });

  // Sort by unique visitors descending, then by exits descending
  result.sort((a, b) => {
    if (b.uv !== a.uv) {
      return b.uv - a.uv;
    }
    return b.exits - a.exits;
  });

  return result;
}

