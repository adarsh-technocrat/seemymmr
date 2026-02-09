import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/utils/api/auth";
import { trackGoalEvent } from "@/utils/database/goal";

/**
 * POST /api/v1/goal
 * Create a custom goal event using API key authentication
 * Based on Postmetric API: https://postmetric.com/docs/api-introduction
 */
export async function POST(request: NextRequest) {
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
    const body = await request.json();

    const { event, value, visitorId, sessionId, path } = body;

    if (!event) {
      return NextResponse.json(
        {
          status: "error",
          error: {
            code: 400,
            message: "event parameter is required",
          },
        },
        { status: 400 }
      );
    }

    // Track the goal event
    await trackGoalEvent({
      websiteId,
      event,
      value,
      visitorId,
      sessionId,
      path: path || "/",
    });

    return NextResponse.json({
      status: "success",
      data: {
        message: "Goal event tracked successfully",
      },
    });
  } catch (error: any) {
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
