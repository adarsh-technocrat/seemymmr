import connectDB from "@/db";
import PageView from "@/db/models/PageView";
import { Types } from "mongoose";
import type { Granularity } from "../types";
import { getDateTruncUnit } from "../utils";

export async function getVisitorsOverTime(
  websiteId: string,
  startDate: Date,
  endDate: Date,
  granularity: Granularity = "daily",
  timezone?: string,
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);
  const unit = getDateTruncUnit(granularity);
  const dateTrunc: { date: string; unit: string; timezone?: string } = {
    date: "$timestamp",
    unit,
  };
  if (timezone) dateTrunc.timezone = timezone;

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
          $dateTrunc: dateTrunc,
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
