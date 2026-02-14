import connectDB from "@/db";
import Session from "@/db/models/Session";
import { Types } from "mongoose";
import {
  formatReferrerName,
  getReferrerImageUrl,
} from "@/utils/tracking/channel";

export async function getChannelBreakdownWithReferrers(
  websiteId: string,
  startDate: Date,
  endDate: Date,
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);
  const pipeline = [
    // Stage 1: Match the specific website
    {
      $match: {
        websiteId: websiteObjectId,
        firstVisitAt: { $gte: startDate, $lte: endDate },
      },
    },

    // Stage 2: Add computed fields for channel resolution
    {
      $addFields: {
        // Normalize referrer for channel detection
        referrerLower: {
          $toLower: { $ifNull: ["$referrer", "direct"] },
        },
        utmMediumLower: {
          $toLower: { $ifNull: ["$utmMedium", ""] },
        },

        // Determine if it's direct traffic
        isDirect: {
          $or: [
            { $eq: ["$referrer", null] },
            { $eq: ["$referrer", ""] },
            { $eq: [{ $toLower: { $ifNull: ["$referrer", ""] } }, "direct"] },
          ],
        },

        // Extract referrer domain
        referrerDomain: {
          $cond: {
            if: {
              $or: [{ $eq: ["$referrer", null] }, { $eq: ["$referrer", ""] }],
            },
            then: "direct",
            else: {
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
          },
        },
      },
    },

    // Stage 3: Determine channel using conditional logic
    {
      $addFields: {
        channel: {
          $switch: {
            branches: [
              // Direct traffic
              {
                case: "$isDirect",
                then: "Direct",
              },

              // Paid traffic
              {
                case: {
                  $in: [
                    "$utmMediumLower",
                    ["paid", "cpc", "ppc", "ad", "ads", "sponsored", "display"],
                  ],
                },
                then: {
                  $cond: {
                    if: {
                      $or: [
                        {
                          $regexMatch: {
                            input: "$referrerLower",
                            regex: "facebook",
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$referrerLower",
                            regex: "instagram",
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$referrerLower",
                            regex: "twitter",
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$referrerLower",
                            regex: "^x\\.",
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$referrerLower",
                            regex: "linkedin",
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$referrerLower",
                            regex: "tiktok",
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$referrerLower",
                            regex: "pinterest",
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$referrerLower",
                            regex: "snapchat",
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$referrerLower",
                            regex: "youtube",
                          },
                        },
                      ],
                    },
                    then: "Paid social",
                    else: "Display",
                  },
                },
              },

              // Newsletter
              {
                case: {
                  $or: [
                    {
                      $in: ["$utmMediumLower", ["newsletter", "email"]],
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "beehiiv",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "substack",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "mailchimp",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "convertkit",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "ghost",
                      },
                    },
                  ],
                },
                then: "Newsletter",
              },

              // A.I.
              {
                case: {
                  $or: [
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "chatgpt",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "openai",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "perplexity",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "gemini",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "claude",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "anthropic",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "bard",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "copilot",
                      },
                    },
                  ],
                },
                then: "A.I.",
              },

              // Organic search
              {
                case: {
                  $or: [
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "google",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "bing",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "duckduckgo",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "brave",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "yandex",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "kagi",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "ecosia",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "baidu",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "yahoo",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "ask\\.com",
                      },
                    },
                  ],
                },
                then: "Organic search",
              },

              // Organic social
              {
                case: {
                  $or: [
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "twitter",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "^x\\.",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "facebook",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "instagram",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "linkedin",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "reddit",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "youtube",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "medium",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "producthunt",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "tiktok",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "pinterest",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "snapchat",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "telegram",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "discord",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "slack",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "whatsapp",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "hackernews",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "news\\.ycombinator",
                      },
                    },
                  ],
                },
                then: "Organic social",
              },

              // Affiliate (via/ref links or short referrers without dots)
              {
                case: {
                  $or: [
                    {
                      $in: ["$utmMediumLower", ["affiliate", "referral"]],
                    },
                    {
                      $and: [
                        {
                          $lt: [
                            { $strLenCP: { $ifNull: ["$referrerLower", ""] } },
                            30,
                          ],
                        },
                        {
                          $not: {
                            $regexMatch: {
                              input: { $ifNull: ["$referrerLower", ""] },
                              regex: "\\.",
                            },
                          },
                        },
                      ],
                    },
                  ],
                },
                then: "Affiliate",
              },
            ],
            default: "Referral",
          },
        },
      },
    },

    // Stage 4: Normalize referrer name for grouping
    {
      $addFields: {
        referrerName: {
          $cond: {
            if: "$isDirect",
            then: "Direct/None",
            else: {
              $switch: {
                branches: [
                  {
                    case: {
                      $or: [
                        {
                          $regexMatch: {
                            input: "$referrerLower",
                            regex: "^x\\.",
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$referrerLower",
                            regex: "twitter",
                          },
                        },
                      ],
                    },
                    then: "X",
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "google",
                      },
                    },
                    then: "Google",
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "youtube",
                      },
                    },
                    then: "YouTube",
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "facebook",
                      },
                    },
                    then: "Facebook",
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "instagram",
                      },
                    },
                    then: "Instagram",
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "linkedin",
                      },
                    },
                    then: "LinkedIn",
                  },
                ],
                default: "$referrerDomain",
              },
            },
          },
        },
      },
    },

    // Stage 5: Lookup payments for each session
    {
      $lookup: {
        from: "payments",
        let: { sessionId: "$sessionId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$sessionId", "$$sessionId"] },
                  { $eq: ["$refunded", false] },
                  {
                    $gte: ["$timestamp", startDate],
                  },
                  {
                    $lte: ["$timestamp", endDate],
                  },
                ],
              },
            },
          },
        ],
        as: "payments",
      },
    },

    // Stage 6: Lookup goal events for each session
    {
      $lookup: {
        from: "goalevents",
        let: { sessionId: "$sessionId", visitorId: "$visitorId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$sessionId", "$$sessionId"] },
                  {
                    $gte: ["$timestamp", startDate],
                  },
                  {
                    $lte: ["$timestamp", endDate],
                  },
                ],
              },
            },
          },
        ],
        as: "goalEvents",
      },
    },

    // Stage 7: Calculate payment and goal metrics per session
    {
      $addFields: {
        sessionRevenue: {
          $sum: {
            $map: {
              input: "$payments",
              as: "payment",
              in: { $divide: ["$$payment.amount", 100] }, // Convert cents to dollars
            },
          },
        },
        sessionPaymentCount: { $size: "$payments" },
        sessionGoalCount: { $size: "$goalEvents" },
        uniqueVisitorsWithGoals: {
          $size: {
            $setUnion: [
              {
                $map: {
                  input: "$goalEvents",
                  as: "goal",
                  in: "$$goal.visitorId",
                },
              },
              [],
            ],
          },
        },
      },
    },

    // Stage 8: Group by channel and referrer
    {
      $group: {
        _id: {
          channel: "$channel",
          referrer: "$referrerName",
        },
        uv: { $sum: 1 },
        revenue: { $sum: "$sessionRevenue" },
        paymentCount: { $sum: "$sessionPaymentCount" },
        goalCount: { $sum: "$sessionGoalCount" },
        uniqueVisitorsWithGoals: {
          $addToSet: {
            $cond: {
              if: { $gt: ["$sessionGoalCount", 0] },
              then: "$visitorId",
              else: "$$REMOVE",
            },
          },
        },
        sessionsWithPayments: {
          $addToSet: {
            $cond: {
              if: { $gt: ["$sessionPaymentCount", 0] },
              then: "$sessionId",
              else: "$$REMOVE",
            },
          },
        },
        // Store additional data for referrer details
        utmSource: { $first: "$utmSource" },
        utmMedium: { $first: "$utmMedium" },
        referrerDomain: { $first: "$referrerDomain" },
        referrer: { $first: "$referrer" },
      },
    },

    // Stage 9: Calculate conversion rates and flatten sets
    {
      $addFields: {
        uniqueVisitorsWithGoalsCount: {
          $size: {
            $filter: {
              input: "$uniqueVisitorsWithGoals",
              as: "visitor",
              cond: { $ne: ["$$visitor", null] },
            },
          },
        },
        sessionsWithPaymentsCount: {
          $size: {
            $filter: {
              input: "$sessionsWithPayments",
              as: "session",
              cond: { $ne: ["$$session", null] },
            },
          },
        },
      },
    },

    // Stage 10: Calculate conversion rates
    {
      $addFields: {
        conversionRate: {
          $cond: {
            if: { $gt: ["$uv", 0] },
            then: { $divide: ["$sessionsWithPaymentsCount", "$uv"] },
            else: 0,
          },
        },
        goalConversionRate: {
          $cond: {
            if: { $gt: ["$uv", 0] },
            then: {
              $divide: ["$uniqueVisitorsWithGoalsCount", "$uv"],
            },
            else: 0,
          },
        },
      },
    },

    // Stage 11: Group referrers under channels
    {
      $group: {
        _id: "$_id.channel",
        referrers: {
          $push: {
            name: "$_id.referrer",
            channel: "$_id.channel",
            uv: "$uv",
            revenue: "$revenue",
            paymentCount: "$paymentCount",
            conversionRate: "$conversionRate",
            goalCount: "$goalCount",
            goalConversionRate: "$goalConversionRate",
            utmSource: "$utmSource",
            utmMedium: "$utmMedium",
            referrerDomain: "$referrerDomain",
            referrer: "$referrer",
          },
        },
        totalUv: { $sum: "$uv" },
        totalRevenue: { $sum: "$revenue" },
        totalPaymentCount: { $sum: "$paymentCount" },
        totalGoalCount: { $sum: "$goalCount" },
      },
    },

    // Stage 12: Calculate channel-level metrics
    {
      $addFields: {
        conversionRate: {
          $cond: {
            if: { $gt: ["$totalUv", 0] },
            then: { $divide: ["$totalPaymentCount", "$totalUv"] },
            else: 0,
          },
        },
        goalConversionRate: {
          $cond: {
            if: { $gt: ["$totalUv", 0] },
            then: { $divide: ["$totalGoalCount", "$totalUv"] },
            else: 0,
          },
        },
      },
    },

    // Stage 13: Sort referrers within each channel by UV
    {
      $addFields: {
        referrers: {
          $sortArray: {
            input: "$referrers",
            sortBy: { uv: -1 },
          },
        },
      },
    },

    // Stage 14: Format output
    {
      $project: {
        _id: 0,
        name: "$_id",
        uv: "$totalUv",
        revenue: "$totalRevenue",
        goalCount: "$totalGoalCount",
        paymentCount: "$totalPaymentCount",
        conversionRate: 1,
        goalConversionRate: 1,
        referrers: 1,
      },
    },

    // Stage 15: Sort channels by UV
    {
      $sort: { uv: -1 as const },
    },
  ];

  const result = await Session.aggregate(pipeline);

  // Post-process to add formatting, images, and handle referrer names
  const channels = result.map((channel) => {
    // Format referrer names and add images
    const referrers = channel.referrers.map((ref: any) => {
      const referrerDomain = ref.referrerDomain || ref.referrer || "direct";
      const formattedName =
        ref.name === "Direct/None"
          ? "Direct/None"
          : formatReferrerName(referrerDomain);
      const image = getReferrerImageUrl(referrerDomain);

      return {
        name: formattedName,
        channel: ref.channel,
        uv: ref.uv,
        revenue: ref.revenue,
        paymentCount: ref.paymentCount,
        conversionRate: ref.conversionRate,
        goalCount: ref.goalCount,
        goalConversionRate: ref.goalConversionRate,
        image: image,
        isAlternativeSource: false,
        referrerType: "referrer" as const,
        originalValue: referrerDomain,
        hasPaidMedium: false,
        paidMediumHint: null,
        ...(ref.utmSource && { utm_source: ref.utmSource }),
        ...(ref.utmMedium && { utm_medium: ref.utmMedium }),
      };
    });

    // Get channel image from first referrer if available
    const channelImage =
      referrers.length > 0 && referrers[0].image ? referrers[0].image : null;

    return {
      name: channel.name,
      uv: channel.uv,
      revenue: channel.revenue,
      goalCount: channel.goalCount,
      paymentCount: channel.paymentCount,
      conversionRate: channel.conversionRate,
      goalConversionRate: channel.goalConversionRate,
      image: channelImage,
      isAlternativeSource: false,
      referrers: referrers,
    };
  });

  return channels;
}
