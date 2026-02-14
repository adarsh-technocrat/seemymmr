import connectDB from "@/db";
import Session from "@/db/models/Session";
import Payment from "@/db/models/Payment";
import GoalEvent from "@/db/models/GoalEvent";
import PageView from "@/db/models/PageView";
import { Types } from "mongoose";
import {
  resolveChannel,
  formatReferrerName,
  getReferrerImageUrl,
} from "@/utils/tracking/channel";
import { extractUrlParams } from "@/utils/tracking/utm";
import type { Granularity } from "../types";
import { getDateTruncUnit } from "../utils";

export async function getCampaignBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date,
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
      item.firstPageViewPath,
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
      item.firstPageViewPath,
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
