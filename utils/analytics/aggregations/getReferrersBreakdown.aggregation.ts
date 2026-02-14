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

export async function getReferrersBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date,
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
            else: "direct",
          },
        },
        channel: {
          $ifNull: ["$utmMedium", "direct"],
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
    const referrerDomain = session.referrerDomain || "direct";

    // Helper to check if domain is an IP address
    const isIPAddress = (domain: string): boolean => {
      if (!domain || domain === "direct") {
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

    // 4. Add utm_source entry (if no referrer domain or domain is direct)
    if (
      session.utmSource &&
      (referrerDomain === "direct" || isIPAddress(referrerDomain))
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
            else: "direct",
          },
        },
        channel: {
          $ifNull: ["$session.utmMedium", "direct"],
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
            else: "direct",
          },
        },
        channel: {
          $ifNull: ["$session.utmMedium", "direct"],
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
        path.startsWith("http") ? path : `https://example.com${path}`,
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
    if (!domain || domain === "direct") {
      return false;
    }
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipRegex.test(domain);
  };

  revenueData.forEach((item) => {
    const channelName = resolveChannel(item.referrer, item.utmMedium);
    const referrerDomain = item.referrerDomain || "direct";
    const { paramRef, paramVia } = extractParamsFromPath(
      item.firstPageViewPath,
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
      (referrerDomain === "direct" || isIPAddress(referrerDomain))
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
    const referrerDomain = item.referrerDomain || "direct";
    const { paramRef, paramVia } = extractParamsFromPath(
      item.firstPageViewPath,
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
      (referrerDomain === "direct" || isIPAddress(referrerDomain))
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
