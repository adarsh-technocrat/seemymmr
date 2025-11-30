import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/utils/api/auth";
import connectDB from "@/db";
import Session from "@/db/models/Session";
import PageView from "@/db/models/PageView";

/**
 * GET /api/v1/visitor
 * Get visitor data using API key authentication
 * Based on DataFast API: https://datafa.st/docs/api-introduction
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate using API key
    const auth = await authenticateApiRequest(request);

    if (!auth) {
      return NextResponse.json(
        {
          status: "error",
          error: {
            code: 401,
            message: "Unauthorized. Invalid or missing API key.",
          },
        },
        { status: 401 }
      );
    }

    const { websiteId } = auth;
    const searchParams = request.nextUrl.searchParams;
    const visitorId = searchParams.get("visitorId");

    if (!visitorId) {
      return NextResponse.json(
        {
          status: "error",
          error: {
            code: 400,
            message: "visitorId parameter is required",
          },
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Get visitor sessions
    const sessions = await Session.find({
      websiteId,
      visitorId,
    })
      .sort({ firstVisitAt: -1 })
      .limit(100);

    // Get visitor page views
    const pageViews = await PageView.find({
      websiteId,
      visitorId,
    })
      .sort({ timestamp: -1 })
      .limit(1000);

    return NextResponse.json({
      status: "success",
      data: {
        visitorId,
        sessionCount: sessions.length,
        pageViewCount: pageViews.length,
        firstVisit: sessions[sessions.length - 1]?.firstVisitAt,
        lastVisit: sessions[0]?.lastSeenAt,
        sessions: sessions.map((s) => ({
          sessionId: s.sessionId,
          firstVisitAt: s.firstVisitAt,
          lastSeenAt: s.lastSeenAt,
          pageViews: s.pageViews,
          duration: s.duration,
          device: s.device,
          browser: s.browser,
          os: s.os,
          country: s.country,
        })),
        pageViews: pageViews.map((pv) => ({
          path: pv.path,
          title: pv.title,
          timestamp: pv.timestamp,
          referrer: pv.referrer,
        })),
      },
    });
  } catch (error: any) {
    console.error("Error fetching visitor data:", error);
    return NextResponse.json(
      {
        status: "error",
        error: {
          code: 500,
          message: error.message || "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}
