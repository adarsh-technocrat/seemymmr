import connectDB from "@/db";
import GoalEvent from "@/db/models/GoalEvent";
import { Types } from "mongoose";
import type { Granularity } from "../types";
import { getDateTruncUnit } from "../utils";

export async function getGoalsOverTime(
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
