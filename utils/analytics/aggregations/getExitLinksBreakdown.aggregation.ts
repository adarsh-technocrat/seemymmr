import connectDB from "@/db";
import PageView from "@/db/models/PageView";
import Session from "@/db/models/Session";
import Payment from "@/db/models/Payment";
import GoalEvent from "@/db/models/GoalEvent";
import { Types } from "mongoose";
import type { Granularity } from "../types";
import { getDateTruncUnit } from "../utils";

export async function getExitLinksBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date,
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
