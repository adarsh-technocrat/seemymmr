import connectDB from "@/db";
import PageView from "@/db/models/PageView";
import Session from "@/db/models/Session";
import Payment from "@/db/models/Payment";
import GoalEvent from "@/db/models/GoalEvent";
import { Types } from "mongoose";
import {
  resolveChannel,
  formatReferrerName,
  getReferrerImageUrl,
} from "@/utils/tracking/channel";
import { extractUrlParams } from "@/utils/tracking/utm";
import {
  getCountryNameFromCode,
  getFlagEmoji,
  getLocationImageUrlFromCode,
} from "@/utils/tracking/geolocation";
import { getSystemImageUrl } from "@/utils/tracking/device";

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
        renewalRevenue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$refunded", false] },
                  { $eq: ["$renewal", true] },
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
        revenueNew: 1,
        renewalRevenue: 1,
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
 * Get source breakdown (channel, referrer, campaign, keyword) with detailed metrics
 */
export async function getSourceBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date,
  type: "channel" | "referrer" | "campaign" | "keyword" = "channel"
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);

  // Step 1: Get unique visitors per source type from Session
  let sessionsGroupId: any;

  if (type === "channel") {
    sessionsGroupId = {
      sourceType: { $ifNull: ["$utmMedium", "Direct"] },
      visitorId: "$visitorId",
    };
  } else if (type === "referrer") {
    sessionsGroupId = {
      sourceType: {
        $cond: {
          if: { $ne: ["$referrer", null] },
          then: {
            $let: {
              vars: {
                noHttps: {
                  $cond: {
                    if: {
                      $eq: [{ $substr: ["$referrer", 0, 8] }, "https://"],
                    },
                    then: { $substr: ["$referrer", 8, -1] },
                    else: "$referrer",
                  },
                },
              },
              in: {
                $let: {
                  vars: {
                    noHttp: {
                      $cond: {
                        if: {
                          $eq: [{ $substr: ["$$noHttps", 0, 7] }, "http://"],
                        },
                        then: { $substr: ["$$noHttps", 7, -1] },
                        else: "$$noHttps",
                      },
                    },
                  },
                  in: {
                    $arrayElemAt: [
                      {
                        $split: ["$$noHttp", "/"],
                      },
                      0,
                    ],
                  },
                },
              },
            },
          },
          else: "Direct",
        },
      },
      visitorId: "$visitorId",
    };
  } else if (type === "campaign") {
    sessionsGroupId = {
      sourceType: { $ifNull: ["$utmCampaign", "Direct"] },
      visitorId: "$visitorId",
    };
  } else {
    // keyword
    sessionsGroupId = {
      sourceType: { $ifNull: ["$utmTerm", "Direct"] },
      visitorId: "$visitorId",
    };
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
        _id: "$_id.sourceType",
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

  // Step 2: Get revenue per source type from Payment (via Session)
  let revenueGroupId: any;
  let goalsGroupId: any;

  if (type === "channel") {
    revenueGroupId = { $ifNull: ["$session.utmMedium", "Direct"] };
    goalsGroupId = { $ifNull: ["$session.utmMedium", "Direct"] };
  } else if (type === "referrer") {
    revenueGroupId = {
      $cond: {
        if: { $ne: ["$session.referrer", null] },
        then: {
          $let: {
            vars: {
              noHttps: {
                $cond: {
                  if: {
                    $eq: [{ $substr: ["$session.referrer", 0, 8] }, "https://"],
                  },
                  then: { $substr: ["$session.referrer", 8, -1] },
                  else: "$session.referrer",
                },
              },
            },
            in: {
              $let: {
                vars: {
                  noHttp: {
                    $cond: {
                      if: {
                        $eq: [{ $substr: ["$$noHttps", 0, 7] }, "http://"],
                      },
                      then: { $substr: ["$$noHttps", 7, -1] },
                      else: "$$noHttps",
                    },
                  },
                },
                in: {
                  $arrayElemAt: [
                    {
                      $split: ["$$noHttp", "/"],
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
        else: "Direct",
      },
    };
    goalsGroupId = revenueGroupId;
  } else if (type === "campaign") {
    revenueGroupId = { $ifNull: ["$session.utmCampaign", "Direct"] };
    goalsGroupId = { $ifNull: ["$session.utmCampaign", "Direct"] };
  } else {
    revenueGroupId = { $ifNull: ["$session.utmTerm", "Direct"] };
    goalsGroupId = { $ifNull: ["$session.utmTerm", "Direct"] };
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

  // Step 3: Get goal count per source type from GoalEvent (via Session)
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
    revenueData.map((item) => [item._id || "Direct", item])
  );
  const goalsMap = new Map(
    goalsData.map((item) => [item._id || "Direct", item])
  );

  const result = sessionsData.map((item) => {
    const sourceName = item._id || "Direct";
    const revenueInfo = revenueMap.get(sourceName);
    const goalsInfo = goalsMap.get(sourceName);

    const uv = item.uniqueVisitors || 0;
    const revenue = revenueInfo?.revenue || 0;
    const sessionsWithPayments = revenueInfo?.sessionsWithPayments?.length || 0;
    const conversionRate = uv > 0 ? sessionsWithPayments / uv : 0;
    const goalCount = goalsInfo?.goalCount || 0;
    const goalConversionRate =
      uv > 0 ? (goalsInfo?.uniqueVisitorsWithGoals?.length || 0) / uv : 0;

    return {
      name: sourceName,
      value: uv, // Keep value for backward compatibility, but use uv
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

/**
 * Get campaign breakdown with all UTM and param parameters
 * Groups by combination of utm_source, utm_medium, utm_campaign, utm_term, utm_content,
 * param_ref, param_source, param_via
 */
export async function getCampaignBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);

  // Step 1: Get sessions with their first pageview to extract param_ref, param_source, param_via
  const sessionsPipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        firstVisitAt: { $gte: startDate, $lte: endDate },
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
      $addFields: {
        firstPageView: {
          $arrayElemAt: [
            {
              $sortArray: {
                input: "$pageViews",
                sortBy: { timestamp: 1 },
              },
            },
            0,
          ],
        },
      },
    },
    {
      $project: {
        sessionId: "$_id",
        visitorId: 1,
        utmSource: { $ifNull: ["$utmSource", ""] },
        utmMedium: { $ifNull: ["$utmMedium", ""] },
        utmCampaign: { $ifNull: ["$utmCampaign", ""] },
        utmTerm: { $ifNull: ["$utmTerm", ""] },
        utmContent: { $ifNull: ["$utmContent", ""] },
        firstPageViewPath: "$firstPageView.path",
      },
    },
  ];

  const sessionsDataRaw = await Session.aggregate(sessionsPipeline);

  // Extract param_ref, param_source, param_via from paths in JavaScript
  const sessionsData = sessionsDataRaw.map((session) => {
    let paramRef: string = "";
    let paramSource: string = "";
    let paramVia: string = "";

    if (session.firstPageViewPath) {
      try {
        // Ensure path starts with / if it doesn't start with http
        let pathToParse = session.firstPageViewPath;
        if (!pathToParse.startsWith("http")) {
          if (!pathToParse.startsWith("/")) {
            pathToParse = `/${pathToParse}`;
          }
          pathToParse = `https://example.com${pathToParse}`;
        }
        const urlObj = new URL(pathToParse);
        paramRef =
          urlObj.searchParams.get("ref") ||
          urlObj.searchParams.get("param_ref") ||
          "";
        paramSource =
          urlObj.searchParams.get("source") ||
          urlObj.searchParams.get("param_source") ||
          "";
        paramVia =
          urlObj.searchParams.get("via") ||
          urlObj.searchParams.get("param_via") ||
          "";
      } catch (error) {
        // Invalid URL, skip
      }
    }

    return {
      ...session,
      paramRef,
      paramSource,
      paramVia,
    };
  });

  // Step 2: Group sessions by combination of all UTM and param parameters
  const campaignMap = new Map<string, any>();

  sessionsData.forEach((session) => {
    // Create a unique key from all parameters
    const key = JSON.stringify({
      utm_source: session.utmSource || "",
      utm_medium: session.utmMedium || "",
      utm_campaign: session.utmCampaign || "",
      utm_term: session.utmTerm || "",
      utm_content: session.utmContent || "",
      param_ref: session.paramRef || "",
      param_source: session.paramSource || "",
      param_via: session.paramVia || "",
    });

    if (!campaignMap.has(key)) {
      campaignMap.set(key, {
        key,
        utm_source: session.utmSource || "",
        utm_medium: session.utmMedium || "",
        utm_campaign: session.utmCampaign || "",
        utm_term: session.utmTerm || "",
        utm_content: session.utmContent || "",
        param_ref: session.paramRef || "",
        param_source: session.paramSource || "",
        param_via: session.paramVia || "",
        uniqueVisitors: new Set<string>(),
        sessionIds: new Set<string>(),
      });
    }

    const entry = campaignMap.get(key);
    entry.uniqueVisitors.add(session.visitorId);
    entry.sessionIds.add(session.sessionId);
  });

  // Step 3: Get revenue per campaign combination from Payment (via Session)
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
      $lookup: {
        from: "pageviews",
        localField: "sessionId",
        foreignField: "sessionId",
        as: "pageViews",
      },
    },
    {
      $addFields: {
        firstPageView: {
          $arrayElemAt: [
            {
              $sortArray: {
                input: "$pageViews",
                sortBy: { timestamp: 1 },
              },
            },
            0,
          ],
        },
      },
    },
    {
      $group: {
        _id: "$sessionId",
        sessionId: { $first: "$sessionId" },
        utmSource: { $first: { $ifNull: ["$session.utmSource", ""] } },
        utmMedium: { $first: { $ifNull: ["$session.utmMedium", ""] } },
        utmCampaign: { $first: { $ifNull: ["$session.utmCampaign", ""] } },
        utmTerm: { $first: { $ifNull: ["$session.utmTerm", ""] } },
        utmContent: { $first: { $ifNull: ["$session.utmContent", ""] } },
        firstPageViewPath: { $first: "$firstPageView.path" },
        revenue: { $sum: "$amount" },
        paymentCount: { $sum: 1 },
      },
    },
  ];

  const revenueData = await Payment.aggregate(revenuePipeline);

  // Step 4: Get goal count per campaign combination from GoalEvent (via Session)
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
      $lookup: {
        from: "pageviews",
        localField: "sessionId",
        foreignField: "sessionId",
        as: "pageViews",
      },
    },
    {
      $addFields: {
        firstPageView: {
          $arrayElemAt: [
            {
              $sortArray: {
                input: "$pageViews",
                sortBy: { timestamp: 1 },
              },
            },
            0,
          ],
        },
      },
    },
    {
      $group: {
        _id: "$sessionId",
        sessionId: { $first: "$sessionId" },
        visitorId: { $first: "$visitorId" },
        utmSource: { $first: { $ifNull: ["$session.utmSource", ""] } },
        utmMedium: { $first: { $ifNull: ["$session.utmMedium", ""] } },
        utmCampaign: { $first: { $ifNull: ["$session.utmCampaign", ""] } },
        utmTerm: { $first: { $ifNull: ["$session.utmTerm", ""] } },
        utmContent: { $first: { $ifNull: ["$session.utmContent", ""] } },
        firstPageViewPath: { $first: "$firstPageView.path" },
      },
    },
  ];

  const goalsData = await GoalEvent.aggregate(goalsPipeline);

  // Helper function to extract params from path
  const extractParamsFromPath = (path: string | null | undefined) => {
    if (!path) return { paramRef: "", paramSource: "", paramVia: "" };
    try {
      const pathUrl = path.startsWith("http")
        ? path
        : `https://example.com${path.startsWith("/") ? path : `/${path}`}`;
      const urlObj = new URL(pathUrl);
      return {
        paramRef:
          urlObj.searchParams.get("ref") ||
          urlObj.searchParams.get("param_ref") ||
          "",
        paramSource:
          urlObj.searchParams.get("source") ||
          urlObj.searchParams.get("param_source") ||
          "",
        paramVia:
          urlObj.searchParams.get("via") ||
          urlObj.searchParams.get("param_via") ||
          "",
      };
    } catch {
      return { paramRef: "", paramSource: "", paramVia: "" };
    }
  };

  // Step 5: Process revenue and goals data
  const revenueMap = new Map<string, any>();
  const goalsMap = new Map<string, any>();

  revenueData.forEach((item) => {
    const { paramRef, paramSource, paramVia } = extractParamsFromPath(
      item.firstPageViewPath
    );
    const key = JSON.stringify({
      utm_source: item.utmSource || "",
      utm_medium: item.utmMedium || "",
      utm_campaign: item.utmCampaign || "",
      utm_term: item.utmTerm || "",
      utm_content: item.utmContent || "",
      param_ref: paramRef,
      param_source: paramSource,
      param_via: paramVia,
    });

    if (!revenueMap.has(key)) {
      revenueMap.set(key, {
        revenue: 0,
        paymentCount: 0,
        sessionIds: new Set(),
      });
    }
    const rev = revenueMap.get(key);
    rev.revenue += item.revenue;
    rev.paymentCount += item.paymentCount;
    rev.sessionIds.add(item.sessionId);
  });

  goalsData.forEach((item) => {
    const { paramRef, paramSource, paramVia } = extractParamsFromPath(
      item.firstPageViewPath
    );
    const key = JSON.stringify({
      utm_source: item.utmSource || "",
      utm_medium: item.utmMedium || "",
      utm_campaign: item.utmCampaign || "",
      utm_term: item.utmTerm || "",
      utm_content: item.utmContent || "",
      param_ref: paramRef,
      param_source: paramSource,
      param_via: paramVia,
    });

    if (!goalsMap.has(key)) {
      goalsMap.set(key, { goalCount: 0, uniqueVisitors: new Set() });
    }
    const goal = goalsMap.get(key);
    goal.goalCount += 1;
    goal.uniqueVisitors.add(item.visitorId);
  });

  // Step 6: Combine all data into final campaign list
  const result = Array.from(campaignMap.values())
    .map((entry) => {
      const uv = entry.uniqueVisitors.size;
      const revenueInfo = revenueMap.get(entry.key);
      const goalsInfo = goalsMap.get(entry.key);

      const revenue = revenueInfo?.revenue || 0;
      const paymentCount = revenueInfo?.paymentCount || 0;
      const goalCount = goalsInfo?.goalCount || 0;

      // Determine if it's an alternative source (has any param or utm values)
      const isAlternativeSource =
        !!entry.param_ref ||
        !!entry.param_source ||
        !!entry.param_via ||
        !!entry.utm_source ||
        !!entry.utm_medium ||
        !!entry.utm_campaign ||
        !!entry.utm_term ||
        !!entry.utm_content;

      // Check if campaign meets strict criteria:
      // 1. Has ALL UTM parameters (utm_source, utm_medium, utm_campaign, utm_term, utm_content)
      // 2. OR has ref parameter
      // 3. OR has via parameter
      const hasAllUtmParams =
        !!entry.utm_source &&
        !!entry.utm_medium &&
        !!entry.utm_campaign &&
        !!entry.utm_term &&
        !!entry.utm_content;
      const hasRef = !!entry.param_ref;
      const hasVia = !!entry.param_via;

      // Only include if meets strict criteria
      const isValidCampaign = hasAllUtmParams || hasRef || hasVia;

      if (!isValidCampaign) {
        return null; // Filter out invalid campaigns
      }

      // Generate a name from the campaign parameters as a query string
      // Format: ?ref=value, ?via=value, or ?utm_source=value&utm_medium=value&...
      const params: string[] = [];

      // Build query string with all available parameters
      // Include ref if present
      if (entry.param_ref) {
        params.push(`ref=${encodeURIComponent(entry.param_ref)}`);
      }
      // Include via if present
      if (entry.param_via) {
        params.push(`via=${encodeURIComponent(entry.param_via)}`);
      }
      // Include all UTM parameters if present
      if (entry.utm_source) {
        params.push(`utm_source=${encodeURIComponent(entry.utm_source)}`);
      }
      if (entry.utm_medium) {
        params.push(`utm_medium=${encodeURIComponent(entry.utm_medium)}`);
      }
      if (entry.utm_campaign) {
        params.push(`utm_campaign=${encodeURIComponent(entry.utm_campaign)}`);
      }
      if (entry.utm_term) {
        params.push(`utm_term=${encodeURIComponent(entry.utm_term)}`);
      }
      if (entry.utm_content) {
        params.push(`utm_content=${encodeURIComponent(entry.utm_content)}`);
      }

      // Build the query string name
      const name = `?${params.join("&")}`;

      // Determine dynamic source: prioritize param_source, then utm_source, fallback to empty string
      const dynamicSource = entry.param_source || entry.utm_source || "";

      return {
        name,
        uv,
        utm_source: entry.utm_source,
        utm_medium: entry.utm_medium,
        utm_campaign: entry.utm_campaign,
        utm_term: entry.utm_term,
        utm_content: entry.utm_content,
        param_ref: entry.param_ref,
        param_source: entry.param_source,
        param_via: entry.param_via,
        isAlternativeSource,
        image: null,
        revenue,
        paymentCount,
        goalCount,
        source: dynamicSource,
      };
    })
    .filter((entry) => entry !== null) // Remove null entries (invalid campaigns)
    .map((entry) => entry!); // Type assertion since we filtered out nulls

  // Sort by UV descending
  result.sort((a, b) => b.uv - a.uv);

  return result;
}

/**
 * Get channel breakdown with nested referrers
 * Returns channels with referrers nested inside, matching the expected schema
 */
export async function getChannelBreakdownWithReferrers(
  websiteId: string,
  startDate: Date,
  endDate: Date
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);

  // Step 1: Get unique visitors per channel and referrer from Session
  const sessionsPipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        firstVisitAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $addFields: {
        referrerDomain: {
          $cond: {
            if: { $ne: ["$referrer", null] },
            then: {
              $let: {
                vars: {
                  noHttps: {
                    $cond: {
                      if: {
                        $eq: [{ $substr: ["$referrer", 0, 8] }, "https://"],
                      },
                      then: { $substr: ["$referrer", 8, -1] },
                      else: "$referrer",
                    },
                  },
                },
                in: {
                  $let: {
                    vars: {
                      noHttp: {
                        $cond: {
                          if: {
                            $eq: [{ $substr: ["$$noHttps", 0, 7] }, "http://"],
                          },
                          then: { $substr: ["$$noHttps", 7, -1] },
                          else: "$$noHttps",
                        },
                      },
                    },
                    in: {
                      $arrayElemAt: [
                        {
                          $split: ["$$noHttp", "/"],
                        },
                        0,
                      ],
                    },
                  },
                },
              },
            },
            else: "Direct/None",
          },
        },
        channel: {
          $ifNull: ["$utmMedium", "Direct"],
        },
      },
    },
    {
      $group: {
        _id: {
          channel: "$channel",
          referrerDomain: "$referrerDomain",
          referrer: "$referrer",
          utmSource: "$utmSource",
          utmMedium: "$utmMedium",
        },
        uniqueVisitors: { $addToSet: "$visitorId" },
        sessionIds: { $addToSet: "$_id" },
      },
    },
    {
      $project: {
        channel: "$_id.channel",
        referrerDomain: "$_id.referrerDomain",
        referrer: "$_id.referrer",
        utmSource: "$_id.utmSource",
        utmMedium: "$_id.utmMedium",
        uniqueVisitors: 1,
        sessionIds: 1,
        _id: 0,
      },
    },
  ];

  const sessionsData = await Session.aggregate(sessionsPipeline);

  // Step 2: Get revenue per channel and referrer from Payment (via Session)
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
      $addFields: {
        referrerDomain: {
          $cond: {
            if: { $ne: ["$session.referrer", null] },
            then: {
              $let: {
                vars: {
                  noHttps: {
                    $cond: {
                      if: {
                        $eq: [
                          { $substr: ["$session.referrer", 0, 8] },
                          "https://",
                        ],
                      },
                      then: { $substr: ["$session.referrer", 8, -1] },
                      else: "$session.referrer",
                    },
                  },
                },
                in: {
                  $let: {
                    vars: {
                      noHttp: {
                        $cond: {
                          if: {
                            $eq: [{ $substr: ["$$noHttps", 0, 7] }, "http://"],
                          },
                          then: { $substr: ["$$noHttps", 7, -1] },
                          else: "$$noHttps",
                        },
                      },
                    },
                    in: {
                      $arrayElemAt: [
                        {
                          $split: ["$$noHttp", "/"],
                        },
                        0,
                      ],
                    },
                  },
                },
              },
            },
            else: "Direct/None",
          },
        },
        channel: {
          $ifNull: ["$session.utmMedium", "Direct"],
        },
      },
    },
    {
      $group: {
        _id: {
          channel: "$channel",
          referrerDomain: "$referrerDomain",
        },
        revenue: { $sum: "$amount" },
        paymentCount: { $sum: 1 },
        sessionsWithPayments: { $addToSet: "$sessionId" },
      },
    },
  ];

  const revenueData = await Payment.aggregate(revenuePipeline);

  // Step 3: Get goal count per channel and referrer from GoalEvent (via Session)
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
      $addFields: {
        referrerDomain: {
          $cond: {
            if: { $ne: ["$session.referrer", null] },
            then: {
              $let: {
                vars: {
                  noHttps: {
                    $cond: {
                      if: {
                        $eq: [
                          { $substr: ["$session.referrer", 0, 8] },
                          "https://",
                        ],
                      },
                      then: { $substr: ["$session.referrer", 8, -1] },
                      else: "$session.referrer",
                    },
                  },
                },
                in: {
                  $let: {
                    vars: {
                      noHttp: {
                        $cond: {
                          if: {
                            $eq: [{ $substr: ["$$noHttps", 0, 7] }, "http://"],
                          },
                          then: { $substr: ["$$noHttps", 7, -1] },
                          else: "$$noHttps",
                        },
                      },
                    },
                    in: {
                      $arrayElemAt: [
                        {
                          $split: ["$$noHttp", "/"],
                        },
                        0,
                      ],
                    },
                  },
                },
              },
            },
            else: "Direct/None",
          },
        },
        channel: {
          $ifNull: ["$session.utmMedium", "Direct"],
        },
      },
    },
    {
      $group: {
        _id: {
          channel: "$channel",
          referrerDomain: "$referrerDomain",
        },
        goalCount: { $sum: 1 },
        uniqueVisitorsWithGoals: { $addToSet: "$visitorId" },
      },
    },
  ];

  const goalsData = await GoalEvent.aggregate(goalsPipeline);

  // Step 4: Combine all data and structure as channels with referrers
  const revenueMap = new Map<string, any>();
  revenueData.forEach((item) => {
    const key = `${item._id.channel || "Direct"}::${
      item._id.referrerDomain || "Direct/None"
    }`;
    revenueMap.set(key, item);
  });

  const goalsMap = new Map<string, any>();
  goalsData.forEach((item) => {
    const key = `${item._id.channel || "Direct"}::${
      item._id.referrerDomain || "Direct/None"
    }`;
    goalsMap.set(key, item);
  });

  // Group sessions data by channel, then by referrer
  const channelMap = new Map<string, any>();

  sessionsData.forEach((item) => {
    const channelName = resolveChannel(item.referrer, item.utmMedium);
    const referrerDomain = item.referrerDomain || "Direct/None";
    const key = `${item.channel || "Direct"}::${referrerDomain}`;

    const revenueInfo = revenueMap.get(key);
    const goalsInfo = goalsMap.get(key);

    const uv = item.uniqueVisitors?.length || 0;
    const revenue = revenueInfo?.revenue || 0;
    const paymentCount = revenueInfo?.paymentCount || 0;
    const sessionsWithPayments = revenueInfo?.sessionsWithPayments?.length || 0;
    const conversionRate = uv > 0 ? sessionsWithPayments / uv : 0;
    const goalCount = goalsInfo?.goalCount || 0;
    const uniqueVisitorsWithGoals =
      goalsInfo?.uniqueVisitorsWithGoals?.length || 0;
    const goalConversionRate = uv > 0 ? uniqueVisitorsWithGoals / uv : 0;

    // Extract URL parameters from referrer (we don't have path in sessions, so just use referrer)
    const urlParams = extractUrlParams(item.referrer);

    // Determine referrer name and type
    let referrerName = formatReferrerName(referrerDomain);
    let referrerType: "referrer" | "ref" = "referrer";
    let isAlternativeSource = false;
    let originalValue = referrerDomain;

    if (referrerDomain === "Direct/None" || referrerDomain === "Direct") {
      referrerName = "Direct/None";
      originalValue = "Direct/None";
    } else {
      // Check if it's an alternative source (like producthunt)
      const domainLower = referrerDomain.toLowerCase();
      if (
        domainLower.includes("producthunt") ||
        domainLower.includes("hackernews") ||
        domainLower.includes("reddit") ||
        domainLower.includes("indiehackers")
      ) {
        isAlternativeSource = true;
        referrerType = "ref";
      }
    }

    // Get referrer image
    const referrerImage = getReferrerImageUrl(referrerDomain);

    // Initialize channel if not exists
    if (!channelMap.has(channelName)) {
      channelMap.set(channelName, {
        name: channelName,
        uv: 0,
        revenue: 0,
        goalCount: 0,
        paymentCount: 0,
        conversionRate: 0,
        goalConversionRate: 0,
        image: null,
        isAlternativeSource: false,
        referrers: [],
      });
    }

    const channel = channelMap.get(channelName);

    // Add to channel totals
    channel.uv += uv;
    channel.revenue += revenue;
    channel.goalCount += goalCount;
    channel.paymentCount += paymentCount;

    // Create referrer object
    const referrerObj: any = {
      name: referrerName,
      channel: channelName,
      uv,
      image: referrerImage,
      isAlternativeSource,
      referrerType,
      originalValue,
      hasPaidMedium: false,
      paidMediumHint: null,
      revenue,
      paymentCount,
      conversionRate,
      goalCount,
      goalConversionRate,
    };

    // Add optional URL parameters if they exist
    if (urlParams.param_ref) referrerObj.param_ref = urlParams.param_ref;
    if (urlParams.param_via) referrerObj.param_via = urlParams.param_via;
    if (urlParams.utm_source) referrerObj.utm_source = urlParams.utm_source;
    if (urlParams.utm_medium) referrerObj.utm_medium = urlParams.utm_medium;

    // Also add utm_source and utm_medium from session if available
    if (item.utmSource) referrerObj.utm_source = item.utmSource;
    if (item.utmMedium) referrerObj.utm_medium = item.utmMedium;

    channel.referrers.push(referrerObj);
  });

  // Calculate channel-level metrics
  const channels = Array.from(channelMap.values()).map((channel) => {
    const totalUv = channel.uv;
    const totalSessionsWithPayments = channel.referrers.reduce(
      (sum: number, ref: any) => sum + (ref.paymentCount || 0),
      0
    );
    const totalUniqueVisitorsWithGoals = channel.referrers.reduce(
      (sum: number, ref: any) => sum + (ref.goalCount || 0),
      0
    );

    channel.conversionRate =
      totalUv > 0 ? totalSessionsWithPayments / totalUv : 0;
    channel.goalConversionRate =
      totalUv > 0 ? totalUniqueVisitorsWithGoals / totalUv : 0;

    // Get channel image (use first referrer's image or default)
    if (channel.referrers.length > 0 && channel.referrers[0].image) {
      channel.image = channel.referrers[0].image;
    }

    // Sort referrers by UV descending
    channel.referrers.sort((a: any, b: any) => b.uv - a.uv);

    return channel;
  });

  // Sort channels by UV descending
  channels.sort((a, b) => b.uv - a.uv);

  return channels;
}

/**
 * Get referrers breakdown as a flat list with detailed metrics
 * Includes referrers from domains, param_ref, param_via, and utm_source
 */
export async function getReferrersBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);

  // Step 1: Get sessions with their first pageview to extract param_ref/param_via from path
  const sessionsPipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        firstVisitAt: { $gte: startDate, $lte: endDate },
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
      $addFields: {
        firstPageView: {
          $arrayElemAt: [
            {
              $sortArray: {
                input: "$pageViews",
                sortBy: { timestamp: 1 },
              },
            },
            0,
          ],
        },
      },
    },
    {
      $addFields: {
        referrerDomain: {
          $cond: {
            if: { $ne: ["$referrer", null] },
            then: {
              $let: {
                vars: {
                  noHttps: {
                    $cond: {
                      if: {
                        $eq: [{ $substr: ["$referrer", 0, 8] }, "https://"],
                      },
                      then: { $substr: ["$referrer", 8, -1] },
                      else: "$referrer",
                    },
                  },
                },
                in: {
                  $let: {
                    vars: {
                      noHttp: {
                        $cond: {
                          if: {
                            $eq: [{ $substr: ["$$noHttps", 0, 7] }, "http://"],
                          },
                          then: { $substr: ["$$noHttps", 7, -1] },
                          else: "$$noHttps",
                        },
                      },
                    },
                    in: {
                      $arrayElemAt: [
                        {
                          $split: ["$$noHttp", "/"],
                        },
                        0,
                      ],
                    },
                  },
                },
              },
            },
            else: "Direct/None",
          },
        },
        channel: {
          $ifNull: ["$utmMedium", "Direct"],
        },
      },
    },
    {
      $project: {
        sessionId: "$_id",
        visitorId: 1,
        referrer: 1,
        referrerDomain: 1,
        channel: 1,
        utmSource: 1,
        utmMedium: 1,
        firstPageViewPath: "$firstPageView.path",
      },
    },
  ];

  const sessionsDataRaw = await Session.aggregate(sessionsPipeline);

  // Extract param_ref and param_via from paths in JavaScript (simpler than MongoDB aggregation)
  const sessionsData = sessionsDataRaw.map((session) => {
    let pathParamRef: string | null = null;
    let pathParamVia: string | null = null;

    if (session.firstPageViewPath) {
      try {
        let pathToParse = session.firstPageViewPath;
        if (!pathToParse.startsWith("http")) {
          // If path doesn't start with /, add it
          if (!pathToParse.startsWith("/")) {
            pathToParse = `/${pathToParse}`;
          }
          pathToParse = `https://example.com${pathToParse}`;
        }
        const urlObj = new URL(pathToParse);
        pathParamRef =
          urlObj.searchParams.get("ref") ||
          urlObj.searchParams.get("param_ref") ||
          null;
        pathParamVia =
          urlObj.searchParams.get("via") ||
          urlObj.searchParams.get("param_via") ||
          null;
      } catch (error) {
        // Invalid URL, skip - but log for debugging
        console.warn(
          `[getReferrersBreakdown] Failed to parse path: ${session.firstPageViewPath}`,
          error
        );
      }
    }

    return {
      ...session,
      pathParamRef,
      pathParamVia,
    };
  });

  // Step 2: Build referrer entries from sessions
  // Each session can contribute to multiple referrer entries:
  // 1. Referrer domain (if exists and not IP)
  // 2. param_ref (if exists)
  // 3. param_via (if exists)
  // 4. utm_source (if no referrer domain)
  const referrerMap = new Map<string, any>();

  sessionsData.forEach((session) => {
    const channelName = resolveChannel(session.referrer, session.utmMedium);
    const referrerDomain = session.referrerDomain || "Direct/None";

    // Helper to check if domain is an IP address
    const isIPAddress = (domain: string): boolean => {
      if (!domain || domain === "Direct/None" || domain === "Direct") {
        return false;
      }
      // Simple IP check (IPv4)
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      return ipRegex.test(domain);
    };

    // 1. Add referrer domain entry (if not IP address)
    if (!isIPAddress(referrerDomain)) {
      const domainKey = `domain::${channelName}::${referrerDomain}`;
      if (!referrerMap.has(domainKey)) {
        referrerMap.set(domainKey, {
          key: domainKey,
          channel: channelName,
          referrerType: "referrer" as const,
          originalValue: referrerDomain,
          name: formatReferrerName(referrerDomain),
          image: getReferrerImageUrl(referrerDomain),
          isAlternativeSource: false,
          uniqueVisitors: new Set<string>(),
          sessionIds: new Set<string>(),
          utmSource: session.utmSource,
          utmMedium: session.utmMedium,
          paramRef: null,
          paramVia: null,
        });
      }
      const entry = referrerMap.get(domainKey);
      entry.uniqueVisitors.add(session.visitorId);
      entry.sessionIds.add(session.sessionId);
      if (session.utmSource && !entry.utmSource)
        entry.utmSource = session.utmSource;
      if (session.utmMedium && !entry.utmMedium)
        entry.utmMedium = session.utmMedium;
    }

    // 2. Add param_ref entry (if exists)
    if (session.pathParamRef) {
      const refKey = `param_ref::${channelName}::${session.pathParamRef}`;
      if (!referrerMap.has(refKey)) {
        referrerMap.set(refKey, {
          key: refKey,
          channel: channelName,
          referrerType: "ref" as const,
          originalValue: session.pathParamRef,
          name: session.pathParamRef,
          image: null,
          isAlternativeSource: true,
          uniqueVisitors: new Set<string>(),
          sessionIds: new Set<string>(),
          utmSource: session.utmSource,
          utmMedium: session.utmMedium,
          paramRef: session.pathParamRef,
          paramVia: null,
        });
      }
      const entry = referrerMap.get(refKey);
      entry.uniqueVisitors.add(session.visitorId);
      entry.sessionIds.add(session.sessionId);
      if (session.utmSource && !entry.utmSource)
        entry.utmSource = session.utmSource;
      if (session.utmMedium && !entry.utmMedium)
        entry.utmMedium = session.utmMedium;
    }

    // 3. Add param_via entry (if exists)
    if (session.pathParamVia) {
      const viaKey = `param_via::${channelName}::${session.pathParamVia}`;
      if (!referrerMap.has(viaKey)) {
        // Format via value - if it looks like a domain, format it nicely
        let viaName = session.pathParamVia;
        // Check if it looks like a domain (contains .)
        if (viaName.includes(".") && !viaName.includes(" ")) {
          // Try to format it like a referrer domain
          viaName = formatReferrerName(viaName);
          // Also try to get an image if it's domain-like (use original value for image lookup)
          const viaImage = getReferrerImageUrl(session.pathParamVia);
          referrerMap.set(viaKey, {
            key: viaKey,
            channel: channelName,
            referrerType: "via" as const,
            originalValue: session.pathParamVia,
            name: viaName,
            image: viaImage,
            isAlternativeSource: true,
            uniqueVisitors: new Set<string>(),
            sessionIds: new Set<string>(),
            utmSource: session.utmSource,
            utmMedium: session.utmMedium,
            paramRef: null,
            paramVia: session.pathParamVia,
          });
        } else {
          // Regular via value (not domain-like)
          referrerMap.set(viaKey, {
            key: viaKey,
            channel: channelName,
            referrerType: "via" as const,
            originalValue: session.pathParamVia,
            name: session.pathParamVia,
            image: null,
            isAlternativeSource: true,
            uniqueVisitors: new Set<string>(),
            sessionIds: new Set<string>(),
            utmSource: session.utmSource,
            utmMedium: session.utmMedium,
            paramRef: null,
            paramVia: session.pathParamVia,
          });
        }
      }
      const entry = referrerMap.get(viaKey);
      entry.uniqueVisitors.add(session.visitorId);
      entry.sessionIds.add(session.sessionId);
      if (session.utmSource && !entry.utmSource)
        entry.utmSource = session.utmSource;
      if (session.utmMedium && !entry.utmMedium)
        entry.utmMedium = session.utmMedium;
    }

    // 4. Add utm_source entry (if no referrer domain or domain is Direct/None)
    if (
      session.utmSource &&
      (referrerDomain === "Direct/None" ||
        referrerDomain === "Direct" ||
        isIPAddress(referrerDomain))
    ) {
      const utmKey = `utm_source::${channelName}::${session.utmSource}`;
      if (!referrerMap.has(utmKey)) {
        // Format utm_source name (e.g., "ig" -> "Instagram", "fb" -> "Facebook")
        let utmName = session.utmSource;
        const utmLower = session.utmSource.toLowerCase();
        if (utmLower === "ig" || utmLower === "instagram")
          utmName = "Instagram";
        else if (utmLower === "fb" || utmLower === "facebook")
          utmName = "Facebook";
        else if (utmLower === "x" || utmLower === "twitter") utmName = "X";
        else if (utmLower === "yt" || utmLower === "youtube")
          utmName = "YouTube";
        else {
          // Capitalize first letter
          utmName =
            session.utmSource.charAt(0).toUpperCase() +
            session.utmSource.slice(1);
        }

        referrerMap.set(utmKey, {
          key: utmKey,
          channel: channelName,
          referrerType: "utm_source" as const,
          originalValue: session.utmSource,
          name: utmName,
          image: null,
          isAlternativeSource: true,
          uniqueVisitors: new Set<string>(),
          sessionIds: new Set<string>(),
          utmSource: session.utmSource,
          utmMedium: session.utmMedium,
          paramRef: null,
          paramVia: null,
        });
      }
      const entry = referrerMap.get(utmKey);
      entry.uniqueVisitors.add(session.visitorId);
      entry.sessionIds.add(session.sessionId);
      if (session.utmMedium && !entry.utmMedium)
        entry.utmMedium = session.utmMedium;
    }
  });

  // Step 3: Get revenue per referrer from Payment (via Session)
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
      $lookup: {
        from: "pageviews",
        localField: "sessionId",
        foreignField: "sessionId",
        as: "pageViews",
      },
    },
    {
      $addFields: {
        firstPageView: {
          $arrayElemAt: [
            {
              $sortArray: {
                input: "$pageViews",
                sortBy: { timestamp: 1 },
              },
            },
            0,
          ],
        },
        referrerDomain: {
          $cond: {
            if: { $ne: ["$session.referrer", null] },
            then: {
              $let: {
                vars: {
                  noHttps: {
                    $cond: {
                      if: {
                        $eq: [
                          { $substr: ["$session.referrer", 0, 8] },
                          "https://",
                        ],
                      },
                      then: { $substr: ["$session.referrer", 8, -1] },
                      else: "$session.referrer",
                    },
                  },
                },
                in: {
                  $let: {
                    vars: {
                      noHttp: {
                        $cond: {
                          if: {
                            $eq: [{ $substr: ["$$noHttps", 0, 7] }, "http://"],
                          },
                          then: { $substr: ["$$noHttps", 7, -1] },
                          else: "$$noHttps",
                        },
                      },
                    },
                    in: {
                      $arrayElemAt: [
                        {
                          $split: ["$$noHttp", "/"],
                        },
                        0,
                      ],
                    },
                  },
                },
              },
            },
            else: "Direct/None",
          },
        },
        channel: {
          $ifNull: ["$session.utmMedium", "Direct"],
        },
      },
    },
    {
      $group: {
        _id: "$sessionId",
        sessionId: { $first: "$sessionId" },
        referrer: { $first: "$session.referrer" },
        referrerDomain: { $first: "$referrerDomain" },
        channel: { $first: "$channel" },
        utmSource: { $first: "$session.utmSource" },
        utmMedium: { $first: "$session.utmMedium" },
        firstPageViewPath: { $first: "$firstPageView.path" },
        revenue: { $sum: "$amount" },
        paymentCount: { $sum: 1 },
      },
    },
  ];

  const revenueData = await Payment.aggregate(revenuePipeline);

  // Step 4: Get goal count per referrer from GoalEvent (via Session)
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
      $lookup: {
        from: "pageviews",
        localField: "sessionId",
        foreignField: "sessionId",
        as: "pageViews",
      },
    },
    {
      $addFields: {
        firstPageView: {
          $arrayElemAt: [
            {
              $sortArray: {
                input: "$pageViews",
                sortBy: { timestamp: 1 },
              },
            },
            0,
          ],
        },
        referrerDomain: {
          $cond: {
            if: { $ne: ["$session.referrer", null] },
            then: {
              $let: {
                vars: {
                  noHttps: {
                    $cond: {
                      if: {
                        $eq: [
                          { $substr: ["$session.referrer", 0, 8] },
                          "https://",
                        ],
                      },
                      then: { $substr: ["$session.referrer", 8, -1] },
                      else: "$session.referrer",
                    },
                  },
                },
                in: {
                  $let: {
                    vars: {
                      noHttp: {
                        $cond: {
                          if: {
                            $eq: [{ $substr: ["$$noHttps", 0, 7] }, "http://"],
                          },
                          then: { $substr: ["$$noHttps", 7, -1] },
                          else: "$$noHttps",
                        },
                      },
                    },
                    in: {
                      $arrayElemAt: [
                        {
                          $split: ["$$noHttp", "/"],
                        },
                        0,
                      ],
                    },
                  },
                },
              },
            },
            else: "Direct/None",
          },
        },
        channel: {
          $ifNull: ["$session.utmMedium", "Direct"],
        },
      },
    },
    {
      $group: {
        _id: "$sessionId",
        sessionId: { $first: "$sessionId" },
        visitorId: { $first: "$visitorId" },
        referrer: { $first: "$session.referrer" },
        referrerDomain: { $first: "$referrerDomain" },
        channel: { $first: "$channel" },
        utmSource: { $first: "$session.utmSource" },
        utmMedium: { $first: "$session.utmMedium" },
        firstPageViewPath: { $first: "$firstPageView.path" },
      },
    },
  ];

  const goalsData = await GoalEvent.aggregate(goalsPipeline);

  // Step 5: Process revenue and goals data to match referrer entries
  const revenueMap = new Map<string, any>();
  const goalsMap = new Map<string, any>();

  // Helper function to extract param_ref and param_via from path
  const extractParamsFromPath = (path: string | null | undefined) => {
    if (!path) return { paramRef: null, paramVia: null };
    try {
      const url = new URL(
        path.startsWith("http") ? path : `https://example.com${path}`
      );
      const paramRef =
        url.searchParams.get("ref") || url.searchParams.get("param_ref");
      const paramVia =
        url.searchParams.get("via") || url.searchParams.get("param_via");
      return { paramRef, paramVia };
    } catch {
      return { paramRef: null, paramVia: null };
    }
  };

  // Helper to check if domain is an IP address
  const isIPAddress = (domain: string): boolean => {
    if (!domain || domain === "Direct/None" || domain === "Direct") {
      return false;
    }
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipRegex.test(domain);
  };

  revenueData.forEach((item) => {
    const channelName = resolveChannel(item.referrer, item.utmMedium);
    const referrerDomain = item.referrerDomain || "Direct/None";
    const { paramRef, paramVia } = extractParamsFromPath(
      item.firstPageViewPath
    );

    // Add revenue to domain entry
    if (!isIPAddress(referrerDomain)) {
      const domainKey = `domain::${channelName}::${referrerDomain}`;
      if (!revenueMap.has(domainKey)) {
        revenueMap.set(domainKey, {
          revenue: 0,
          paymentCount: 0,
          sessionIds: new Set(),
        });
      }
      const rev = revenueMap.get(domainKey);
      rev.revenue += item.revenue;
      rev.paymentCount += item.paymentCount;
      rev.sessionIds.add(item.sessionId);
    }

    // Add revenue to param_ref entry
    if (paramRef) {
      const refKey = `param_ref::${channelName}::${paramRef}`;
      if (!revenueMap.has(refKey)) {
        revenueMap.set(refKey, {
          revenue: 0,
          paymentCount: 0,
          sessionIds: new Set(),
        });
      }
      const rev = revenueMap.get(refKey);
      rev.revenue += item.revenue;
      rev.paymentCount += item.paymentCount;
      rev.sessionIds.add(item.sessionId);
    }

    // Add revenue to param_via entry
    if (paramVia) {
      const viaKey = `param_via::${channelName}::${paramVia}`;
      if (!revenueMap.has(viaKey)) {
        revenueMap.set(viaKey, {
          revenue: 0,
          paymentCount: 0,
          sessionIds: new Set(),
        });
      }
      const rev = revenueMap.get(viaKey);
      rev.revenue += item.revenue;
      rev.paymentCount += item.paymentCount;
      rev.sessionIds.add(item.sessionId);
    }

    // Add revenue to utm_source entry
    if (
      item.utmSource &&
      (referrerDomain === "Direct/None" ||
        referrerDomain === "Direct" ||
        isIPAddress(referrerDomain))
    ) {
      const utmKey = `utm_source::${channelName}::${item.utmSource}`;
      if (!revenueMap.has(utmKey)) {
        revenueMap.set(utmKey, {
          revenue: 0,
          paymentCount: 0,
          sessionIds: new Set(),
        });
      }
      const rev = revenueMap.get(utmKey);
      rev.revenue += item.revenue;
      rev.paymentCount += item.paymentCount;
      rev.sessionIds.add(item.sessionId);
    }
  });

  goalsData.forEach((item) => {
    const channelName = resolveChannel(item.referrer, item.utmMedium);
    const referrerDomain = item.referrerDomain || "Direct/None";
    const { paramRef, paramVia } = extractParamsFromPath(
      item.firstPageViewPath
    );

    // Add goals to domain entry
    if (!isIPAddress(referrerDomain)) {
      const domainKey = `domain::${channelName}::${referrerDomain}`;
      if (!goalsMap.has(domainKey)) {
        goalsMap.set(domainKey, { goalCount: 0, uniqueVisitors: new Set() });
      }
      const goal = goalsMap.get(domainKey);
      goal.goalCount += 1;
      goal.uniqueVisitors.add(item.visitorId);
    }

    // Add goals to param_ref entry
    if (paramRef) {
      const refKey = `param_ref::${channelName}::${paramRef}`;
      if (!goalsMap.has(refKey)) {
        goalsMap.set(refKey, { goalCount: 0, uniqueVisitors: new Set() });
      }
      const goal = goalsMap.get(refKey);
      goal.goalCount += 1;
      goal.uniqueVisitors.add(item.visitorId);
    }

    // Add goals to param_via entry
    if (paramVia) {
      const viaKey = `param_via::${channelName}::${paramVia}`;
      if (!goalsMap.has(viaKey)) {
        goalsMap.set(viaKey, { goalCount: 0, uniqueVisitors: new Set() });
      }
      const goal = goalsMap.get(viaKey);
      goal.goalCount += 1;
      goal.uniqueVisitors.add(item.visitorId);
    }

    // Add goals to utm_source entry
    if (
      item.utmSource &&
      (referrerDomain === "Direct/None" ||
        referrerDomain === "Direct" ||
        isIPAddress(referrerDomain))
    ) {
      const utmKey = `utm_source::${channelName}::${item.utmSource}`;
      if (!goalsMap.has(utmKey)) {
        goalsMap.set(utmKey, { goalCount: 0, uniqueVisitors: new Set() });
      }
      const goal = goalsMap.get(utmKey);
      goal.goalCount += 1;
      goal.uniqueVisitors.add(item.visitorId);
    }
  });

  // Step 6: Combine all data into final referrer list
  const result = Array.from(referrerMap.values()).map((entry) => {
    const uv = entry.uniqueVisitors.size;
    const revenueInfo = revenueMap.get(entry.key);
    const goalsInfo = goalsMap.get(entry.key);

    const revenue = revenueInfo?.revenue || 0;
    const paymentCount = revenueInfo?.paymentCount || 0;
    const sessionsWithPayments = revenueInfo?.sessionIds?.size || 0;
    const conversionRate = uv > 0 ? sessionsWithPayments / uv : 0;
    const goalCount = goalsInfo?.goalCount || 0;
    const uniqueVisitorsWithGoals = goalsInfo?.uniqueVisitors?.size || 0;
    const goalConversionRate = uv > 0 ? uniqueVisitorsWithGoals / uv : 0;

    const referrerObj: any = {
      name: entry.name,
      channel: entry.channel,
      uv,
      image: entry.image,
      isAlternativeSource: entry.isAlternativeSource,
      referrerType: entry.referrerType,
      originalValue: entry.originalValue,
      hasPaidMedium: false,
      paidMediumHint: null,
      revenue,
      paymentCount,
      conversionRate,
      goalCount,
      goalConversionRate,
    };

    // Add optional parameters
    if (entry.paramRef) referrerObj.param_ref = entry.paramRef;
    if (entry.paramVia) referrerObj.param_via = entry.paramVia;
    if (entry.utmSource) referrerObj.utm_source = entry.utmSource;
    if (entry.utmMedium) referrerObj.utm_medium = entry.utmMedium;

    return referrerObj;
  });

  // Sort by UV descending
  result.sort((a, b) => b.uv - a.uv);

  return result;
}

/**
 * Get pages breakdown with detailed metrics
 */
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

/**
 * Get hostnames breakdown with detailed metrics
 */
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

/**
 * Get entry pages breakdown (first page per session) with detailed metrics
 */
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

export async function getLocationBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date,
  type: "country" | "region" | "city" = "country"
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);

  let sessionsGroupId: any;

  if (type === "country") {
    sessionsGroupId = { systemType: "$country", visitorId: "$visitorId" };
  } else if (type === "region") {
    sessionsGroupId = {
      systemType: "$region",
      country: "$country",
      visitorId: "$visitorId",
    };
  } else {
    sessionsGroupId = {
      systemType: "$city",
      country: "$country",
      visitorId: "$visitorId",
    };
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
        _id: {
          systemType: "$_id.systemType",
          country:
            type === "country"
              ? "$_id.systemType"
              : { $ifNull: ["$_id.country", ""] },
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

  const sessionsData = await Session.aggregate(sessionsPipeline);

  // Step 2: Get revenue per location type from Payment (via Session)
  let revenueGroupId: any;
  let goalsGroupId: any;

  if (type === "country") {
    revenueGroupId = "$session.country";
    goalsGroupId = "$session.country";
  } else if (type === "region") {
    revenueGroupId = "$session.region";
    goalsGroupId = "$session.region";
  } else {
    revenueGroupId = "$session.city";
    goalsGroupId = "$session.city";
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

  // Step 3: Get goal count per location type from GoalEvent (via Session)
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
    revenueData.map((item) => [item._id || "Unknown", item])
  );
  const goalsMap = new Map(
    goalsData.map((item) => [item._id || "Unknown", item])
  );

  const result = sessionsData.map((item) => {
    const locationId = item._id || {};
    const locationCode =
      typeof locationId === "string"
        ? locationId
        : locationId.systemType || "Unknown";
    const countryCode =
      typeof locationId === "string" ? locationId : locationId.country || "";

    const revenueInfo = revenueMap.get(locationCode);
    const goalsInfo = goalsMap.get(locationCode);

    const uv = item.uniqueVisitors || 0;
    const revenue = revenueInfo?.revenue || 0;
    const sessionsWithPayments = revenueInfo?.sessionsWithPayments?.length || 0;
    // Conversion rate: sessions with payments / unique visitors
    const conversionRate = uv > 0 ? sessionsWithPayments / uv : 0;
    const goalCount = goalsInfo?.goalCount || 0;
    // Goal conversion rate: unique visitors with goals / unique visitors
    const goalConversionRate =
      uv > 0 ? (goalsInfo?.uniqueVisitorsWithGoals?.length || 0) / uv : 0;

    // For countries, convert code to full name and get flag emoji
    // For regions and cities, use the country code to get the flag
    let displayName = locationCode;
    let flag = "";
    let flagCountryCode = countryCode;

    if (type === "country") {
      displayName = getCountryNameFromCode(locationCode);
      flagCountryCode = locationCode;
      flag = getFlagEmoji(locationCode);
    } else if (countryCode) {
      // For regions and cities, show the country flag
      flag = getFlagEmoji(countryCode);
    }

    return {
      name: displayName,
      uv,
      flag: flag || undefined,
      image:
        type === "country"
          ? getLocationImageUrlFromCode(locationCode, type)
          : flagCountryCode
          ? getLocationImageUrlFromCode(flagCountryCode, "country")
          : "",
      revenue,
      conversionRate,
      goalCount,
      goalConversionRate,
      countryCode:
        type === "country" ? locationCode : flagCountryCode || undefined,
    };
  });

  result.sort((a, b) => b.uv - a.uv);

  return result;
}

/**
 * Get system breakdown (browser, OS, device) with revenue, conversion rate, and goals
 */
export async function getSystemBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date,
  type: "browser" | "os" | "device" = "browser"
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
    revenueData.map((item) => [item._id || "Unknown", item])
  );
  const goalsMap = new Map(
    goalsData.map((item) => [item._id || "Unknown", item])
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

  const avgDuration =
    totalSessions > 0
      ? sessions.reduce((sum, s) => {
          let duration = s.duration;

          if (duration === 0 && s.firstVisitAt && s.lastSeenAt) {
            duration = Math.floor(
              (s.lastSeenAt.getTime() - s.firstVisitAt.getTime()) / 1000
            );
          }
          return sum + duration;
        }, 0) / totalSessions
      : 0;

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

/**
 * Get customers and sales over time
 * Returns unique customers and total sales count per time period
 */
export async function getCustomersAndSalesOverTime(
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
        refunded: false,
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
        customerIds: { $addToSet: "$customerId" },
        sales: { $sum: 1 },
      },
    },
    {
      $project: {
        date: "$_id",
        customers: {
          $size: {
            $filter: {
              input: "$customerIds",
              as: "customerId",
              cond: { $ne: ["$$customerId", null] },
            },
          },
        },
        sales: 1,
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
 * Get goal events over time
 */
export async function getGoalsOverTime(
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
        goalCount: { $sum: 1 },
      },
    },
    {
      $project: {
        date: "$_id",
        goalCount: 1,
        _id: 0,
      },
    },
    {
      $sort: { date: 1 as const },
    },
  ];

  return await GoalEvent.aggregate(pipeline);
}
