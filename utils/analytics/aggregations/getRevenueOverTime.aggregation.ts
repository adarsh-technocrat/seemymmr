import connectDB from "@/db";
import Payment from "@/db/models/Payment";
import { Types } from "mongoose";
import type { Granularity } from "../types";
import { getDateTruncUnit } from "../utils";
import { TimeZone } from "timezones-list";

export async function getRevenueOverTime(
  websiteId: string,
  startDate: Date,
  endDate: Date,
  granularity: Granularity = "daily",
  timezone?: TimeZone["tzCode"],
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
