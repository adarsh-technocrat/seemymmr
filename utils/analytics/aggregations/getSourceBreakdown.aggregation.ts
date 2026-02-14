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

export async function getSourceBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date,
  type: "channel" | "referrer" | "campaign" | "keyword" = "channel",
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);

  // Step 1: Get unique visitors per source type from Session
  let sessionsGroupId: any;

  if (type === "channel") {
    sessionsGroupId = {
      sourceType: { $ifNull: ["$utmMedium", "direct"] },
      referrer: "$referrer",
      utmMedium: "$utmMedium",
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
          else: "direct",
        },
      },
      visitorId: "$visitorId",
    };
  } else if (type === "campaign") {
    sessionsGroupId = {
      sourceType: { $ifNull: ["$utmCampaign", "direct"] },
      visitorId: "$visitorId",
    };
  } else {
    // keyword
    sessionsGroupId = {
      sourceType: { $ifNull: ["$utmTerm", "direct"] },
      visitorId: "$visitorId",
    };
  }

  // Build sessions pipeline based on type
  let sessionsPipeline: any[];

  if (type === "channel") {
    sessionsPipeline = [
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
                              $eq: [
                                { $substr: ["$$noHttps", 0, 7] },
                                "http://",
                              ],
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
        },
      },
      {
        $group: {
          _id: {
            referrer: "$referrer",
            utmMedium: "$utmMedium",
            referrerDomain: "$referrerDomain",
            utmSource: "$utmSource",
            visitorId: "$visitorId",
          },
          sessionIds: { $addToSet: "$_id" },
        },
      },
      {
        $group: {
          _id: {
            referrer: "$_id.referrer",
            utmMedium: "$_id.utmMedium",
            referrerDomain: "$_id.referrerDomain",
            utmSource: "$_id.utmSource",
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
  } else {
    sessionsPipeline = [
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
  }

  const sessionsData = await Session.aggregate(sessionsPipeline);

  // Step 2: Get revenue per source type from Payment (via Session)
  let revenueGroupId: any;
  let goalsGroupId: any;

  if (type === "channel") {
    // For channels, we'll resolve in JavaScript, so group by a temporary key
    // We'll include referrer and utmMedium to resolve later
    revenueGroupId = {
      tempKey: { $ifNull: ["$session.utmMedium", "direct"] },
      referrer: "$session.referrer",
      utmMedium: "$session.utmMedium",
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
    };
    goalsGroupId = {
      tempKey: { $ifNull: ["$session.utmMedium", "direct"] },
      referrer: "$session.referrer",
      utmMedium: "$session.utmMedium",
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
    };
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
        else: "direct",
      },
    };
    goalsGroupId = revenueGroupId;
  } else if (type === "campaign") {
    revenueGroupId = { $ifNull: ["$session.utmCampaign", "direct"] };
    goalsGroupId = { $ifNull: ["$session.utmCampaign", "direct"] };
  } else {
    revenueGroupId = { $ifNull: ["$session.utmTerm", "direct"] };
    goalsGroupId = { $ifNull: ["$session.utmTerm", "direct"] };
  }

  const revenueGroupStage: any = {
    _id: revenueGroupId,
    revenue: { $sum: "$amount" },
    sessionsWithPayments: { $addToSet: "$sessionId" },
  };

  if (type === "channel") {
    revenueGroupStage.referrer = { $first: "$session.referrer" };
    revenueGroupStage.utmMedium = { $first: "$session.utmMedium" };
    revenueGroupStage.referrerDomain = { $first: "$_id.referrerDomain" };
    revenueGroupStage.utmSource = { $first: "$session.utmSource" };
    revenueGroupStage.paymentCount = { $sum: 1 };
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
      $group: revenueGroupStage,
    },
  ];

  const revenueData = await Payment.aggregate(revenuePipeline);

  // Step 3: Get goal count per source type from GoalEvent (via Session)
  const goalsGroupStage: any = {
    _id: goalsGroupId,
    goalCount: { $sum: 1 },
    uniqueVisitorsWithGoals: { $addToSet: "$visitorId" },
  };

  if (type === "channel") {
    goalsGroupStage.referrer = { $first: "$session.referrer" };
    goalsGroupStage.utmMedium = { $first: "$session.utmMedium" };
    goalsGroupStage.referrerDomain = { $first: "$_id.referrerDomain" };
    goalsGroupStage.utmSource = { $first: "$session.utmSource" };
  }

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
      $group: goalsGroupStage,
    },
  ];

  const goalsData = await GoalEvent.aggregate(goalsPipeline);

  // Step 4: Combine all data
  // For channel type, resolve channels properly and build referrers
  if (type === "channel") {
    // Build revenue map by channel and referrer
    const revenueMap = new Map<string, any>();
    revenueData.forEach((item) => {
      const resolvedChannel = resolveChannel(
        item.referrer || null,
        item.utmMedium || null,
      );
      const referrerDomain = item.referrerDomain || "direct";
      const key = `${resolvedChannel}::${referrerDomain}`;

      if (!revenueMap.has(key)) {
        revenueMap.set(key, {
          revenue: 0,
          paymentCount: 0,
          sessionsWithPayments: new Set(),
        });
      }
      const rev = revenueMap.get(key);
      rev.revenue += item.revenue || 0;
      rev.paymentCount += item.paymentCount || 0;
      if (item.sessionsWithPayments) {
        item.sessionsWithPayments.forEach((sid: string) =>
          rev.sessionsWithPayments.add(sid),
        );
      }
    });

    // Build goals map by channel and referrer
    const goalsMap = new Map<string, any>();
    goalsData.forEach((item) => {
      const resolvedChannel = resolveChannel(
        item.referrer || null,
        item.utmMedium || null,
      );
      const referrerDomain = item.referrerDomain || "direct";
      const key = `${resolvedChannel}::${referrerDomain}`;

      if (!goalsMap.has(key)) {
        goalsMap.set(key, {
          goalCount: 0,
          uniqueVisitorsWithGoals: new Set(),
        });
      }
      const goal = goalsMap.get(key);
      goal.goalCount += item.goalCount || 0;
      if (item.uniqueVisitorsWithGoals) {
        item.uniqueVisitorsWithGoals.forEach((vid: string) =>
          goal.uniqueVisitorsWithGoals.add(vid),
        );
      }
    });

    // Group sessions by channel and referrer, then build referrers
    const channelMap = new Map<string, any>();

    sessionsData.forEach((item) => {
      const resolvedChannel = resolveChannel(
        item._id.referrer || null,
        item._id.utmMedium || null,
      );
      const referrerDomain = item._id.referrerDomain || "direct";
      const key = `${resolvedChannel}::${referrerDomain}`;

      const revenueInfo = revenueMap.get(key);
      const goalsInfo = goalsMap.get(key);

      const uv = item.uniqueVisitors || 0;
      const revenue = revenueInfo?.revenue || 0;
      const paymentCount = revenueInfo?.paymentCount || 0;
      const sessionsWithPayments = revenueInfo?.sessionsWithPayments?.size || 0;
      const conversionRate = uv > 0 ? sessionsWithPayments / uv : 0;
      const goalCount = goalsInfo?.goalCount || 0;
      const uniqueVisitorsWithGoals =
        goalsInfo?.uniqueVisitorsWithGoals?.size || 0;
      const goalConversionRate = uv > 0 ? uniqueVisitorsWithGoals / uv : 0;

      // Extract URL parameters from referrer
      const urlParams = extractUrlParams(item._id.referrer);

      // Determine referrer name and type
      let referrerName = formatReferrerName(referrerDomain);
      let referrerType: "referrer" | "ref" | "via" | "utm_source" = "referrer";
      let isAlternativeSource = false;
      let originalValue = referrerDomain;

      if (referrerDomain === "direct") {
        referrerName = "Direct/None";
        originalValue = "direct";
      } else {
        // Check if it's an alternative source
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
      if (!channelMap.has(resolvedChannel)) {
        channelMap.set(resolvedChannel, {
          name: resolvedChannel,
          uv: 0,
          revenue: 0,
          goalCount: 0,
          paymentCount: 0,
          conversionRate: 0,
          goalConversionRate: 0,
          referrers: [],
        });
      }

      const channel = channelMap.get(resolvedChannel);

      // Add to channel totals
      channel.uv += uv;
      channel.revenue += revenue;
      channel.goalCount += goalCount;
      channel.paymentCount += paymentCount;

      // Determine hasPaidMedium and paidMediumHint
      const utmMedium = item._id.utmMedium || urlParams.utm_medium;
      let hasPaidMedium = false;
      let paidMediumHint: string | null = null;

      if (utmMedium) {
        const mediumLower = utmMedium.toLowerCase();
        if (
          mediumLower === "paid" ||
          mediumLower === "cpc" ||
          mediumLower === "ppc" ||
          mediumLower === "ad" ||
          mediumLower === "ads" ||
          mediumLower === "sponsored" ||
          mediumLower === "display"
        ) {
          hasPaidMedium = true;
          paidMediumHint = mediumLower === "cpc" ? "cpc" : "paid";
        }
      }

      // Create referrer object
      const referrerObj: any = {
        name: referrerName,
        channel: resolvedChannel,
        uv,
        image: referrerImage,
        isAlternativeSource,
        referrerType,
        originalValue,
        hasPaidMedium,
        paidMediumHint,
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
      if (item._id.utmSource) referrerObj.utm_source = item._id.utmSource;
      if (item._id.utmMedium) referrerObj.utm_medium = item._id.utmMedium;

      channel.referrers.push(referrerObj);
    });

    // Calculate channel-level metrics and format result
    const result = Array.from(channelMap.values()).map((channel) => {
      const totalUv = channel.uv;
      const totalSessionsWithPayments = channel.referrers.reduce(
        (sum: number, ref: any) => sum + (ref.paymentCount || 0),
        0,
      );
      const totalUniqueVisitorsWithGoals = channel.referrers.reduce(
        (sum: number, ref: any) => sum + (ref.goalCount || 0),
        0,
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

      return {
        name: channel.name,
        uv: channel.uv,
        revenue: channel.revenue,
        conversionRate: channel.conversionRate,
        goalCount: channel.goalCount,
        goalConversionRate: channel.goalConversionRate,
        referrers: channel.referrers,
      };
    });

    // Sort channels by UV descending
    result.sort((a, b) => b.uv - a.uv);

    return result;
  }

  // For non-channel types, use original logic
  const revenueMap = new Map(
    revenueData.map((item) => [item._id || "direct", item]),
  );
  const goalsMap = new Map(
    goalsData.map((item) => [item._id || "direct", item]),
  );

  const result = sessionsData.map((item) => {
    const sourceName = item._id?.sourceType || item._id || "direct";
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
