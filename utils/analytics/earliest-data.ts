import connectDB from "@/db";
import PageView from "@/db/models/PageView";
import Payment from "@/db/models/Payment";
import { Types } from "mongoose";

/**
 * Get the earliest data point (payment or pageview) for a website.
 * Used for "All time" period to determine start date.
 */
export async function getEarliestDataPoint(
  websiteId: string,
): Promise<Date | null> {
  await connectDB();
  const websiteObjectId = new Types.ObjectId(websiteId);

  const earliestPayment = await Payment.findOne({
    websiteId: websiteObjectId,
  })
    .sort({ timestamp: 1 })
    .select("timestamp")
    .lean();

  const earliestPageView = await PageView.findOne({
    websiteId: websiteObjectId,
  })
    .sort({ timestamp: 1 })
    .select("timestamp")
    .lean();

  const dates: Date[] = [];
  if (earliestPayment?.timestamp) {
    dates.push(new Date(earliestPayment.timestamp));
  }
  if (earliestPageView?.timestamp) {
    dates.push(new Date(earliestPageView.timestamp));
  }

  if (dates.length === 0) {
    return null;
  }

  return new Date(Math.min(...dates.map((d) => d.getTime())));
}
