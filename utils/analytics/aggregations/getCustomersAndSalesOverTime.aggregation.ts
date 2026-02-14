import connectDB from "@/db";
import Payment from "@/db/models/Payment";
import { Types } from "mongoose";
import type { Granularity } from "../types";
import { getDateTruncUnit } from "../utils";

export async function getCustomersAndSalesOverTime(
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
        refunded: false,
      },
    },
    {
      $group: {
        _id: {
          $dateTrunc: dateTrunc,
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
