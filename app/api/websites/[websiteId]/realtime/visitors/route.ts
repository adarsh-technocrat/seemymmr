import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import connectDB from "@/db";
import Session from "@/db/models/Session";
import PageView from "@/db/models/PageView";
import Payment from "@/db/models/Payment";
import { Types } from "mongoose";
import { validateRealtimeAccess } from "@/utils/api/realtime-auth";

interface VisitorLocation {
  visitorId: string;
  sessionId: string;
  userId?: string; // If user identification is enabled
  country: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  device: string;
  browser: string;
  os: string;
  referrer?: string;
  referrerDomain?: string;
  currentPath?: string;
  lastSeenAt: string;
  pageViews: number;
  duration: number;
  conversionScore?: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  try {
    const { websiteId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const shareId = searchParams.get("shareId");
    const session = await getSession();

    // Unified authentication: supports both shareId (public) and session (authenticated)
    const accessResult = await validateRealtimeAccess(
      websiteId,
      shareId,
      session,
    );

    if (!accessResult.valid) {
      const statusCode =
        accessResult.error === "Unauthorized"
          ? 401
          : accessResult.error === "Website not found"
            ? 404
            : 403;
      return NextResponse.json(
        { error: accessResult.error || "Access denied" },
        { status: statusCode },
      );
    }

    // Get active sessions (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const websiteObjectId = new Types.ObjectId(websiteId);

    const activeSessions = await Session.find({
      websiteId: websiteObjectId,
      lastSeenAt: { $gte: fiveMinutesAgo },
    })
      .sort({ lastSeenAt: -1 })
      .limit(100);

    // Get latest page view for each session to get current path
    const sessionIds = activeSessions.map((s) => s.sessionId);
    const latestPageViews = await PageView.aggregate([
      {
        $match: {
          websiteId: websiteObjectId,
          sessionId: { $in: sessionIds },
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: "$sessionId",
          path: { $first: "$path" },
          timestamp: { $first: "$timestamp" },
        },
      },
    ]);

    const pathMap = new Map(latestPageViews.map((pv) => [pv._id, pv.path]));

    // Group sessions by visitor (prefer userId if available, otherwise visitorId)
    // This ensures one entry per visitor, showing their most recent session
    const visitorMap = new Map<string, (typeof activeSessions)[0]>();

    activeSessions.forEach((session) => {
      // Use userId for grouping if available (for identified users),
      // otherwise use visitorId (for anonymous visitors)
      const groupKey = session.userId || session.visitorId;
      const existing = visitorMap.get(groupKey);

      // Keep the most recent session for each visitor
      if (!existing || session.lastSeenAt > existing.lastSeenAt) {
        visitorMap.set(groupKey, session);
      }
    });

    // Format visitor data (one per visitor)
    const visitors: VisitorLocation[] = Array.from(visitorMap.values()).map(
      (session) => {
        // Generate a simple conversion score based on page views and duration
        const conversionScore = Math.min(
          100,
          Math.round(
            (session.pageViews * 10 + Math.min(session.duration / 60, 30) * 2) /
              2,
          ),
        );

        let currentPath = pathMap.get(session.sessionId) || "/";

        // Remove query parameters from path
        if (currentPath.includes("?")) {
          currentPath = currentPath.split("?")[0];
        }

        // Log for debugging

        return {
          visitorId: session.visitorId,
          sessionId: session.sessionId,
          userId: session.userId,
          country: session.country,
          region: session.region,
          city: session.city,
          latitude: session.latitude,
          longitude: session.longitude,
          device: session.device,
          browser: session.browser,
          os: session.os,
          referrer: session.referrer,
          referrerDomain: session.referrerDomain,
          currentPath,
          lastSeenAt: session.lastSeenAt.toISOString(),
          pageViews: session.pageViews,
          duration: session.duration,
          conversionScore,
        };
      },
    );

    // Get recent page views (last 5 minutes) for activity feed
    const recentPageViews = await PageView.find({
      websiteId: websiteObjectId,
      timestamp: { $gte: fiveMinutesAgo },
    })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    // Get session info for page views
    const pageViewSessionIds = [
      ...new Set(recentPageViews.map((pv) => pv.sessionId)),
    ];
    const pageViewSessions = await Session.find({
      sessionId: { $in: pageViewSessionIds },
    }).lean();

    const sessionMap = new Map(pageViewSessions.map((s) => [s.sessionId, s]));

    const pageViewEvents = recentPageViews.map((pv) => {
      const session = sessionMap.get(pv.sessionId);
      let path = pv.path;
      if (path.includes("?")) {
        path = path.split("?")[0];
      }
      return {
        id: pv._id.toString(),
        type: "pageview" as const,
        visitorId: pv.visitorId,
        sessionId: pv.sessionId,
        userId: session?.userId,
        country: pv.country,
        region: pv.region,
        city: pv.city,
        path,
        timestamp: pv.timestamp.toISOString(),
      };
    });

    // Get recent payment events (last 5 minutes, not refunded)
    const recentPayments = await Payment.find({
      websiteId: websiteObjectId,
      timestamp: { $gte: fiveMinutesAgo },
      refunded: false,
    })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    const paymentEvents = recentPayments.map((payment) => ({
      id: payment._id.toString(),
      type: "payment" as const,
      visitorId: payment.visitorId,
      sessionId: payment.sessionId,
      customerEmail: payment.customerEmail,
      amount: payment.amount,
      currency: payment.currency,
      timestamp: payment.timestamp.toISOString(),
    }));

    return NextResponse.json({ visitors, paymentEvents, pageViewEvents });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch visitors" },
      { status: 500 },
    );
  }
}
