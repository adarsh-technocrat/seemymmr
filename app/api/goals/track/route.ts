import { NextRequest, NextResponse } from "next/server";
import { trackGoalEvent } from "@/utils/database/goal";
import { getWebsiteByTrackingCode } from "@/utils/database/website";

/**
 * Track a goal event
 * This endpoint is called by the tracking script
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const trackingCode = searchParams.get("site");
    const event = searchParams.get("event");
    const value = searchParams.get("value");

    if (!trackingCode || !event) {
      return new NextResponse(null, { status: 204 });
    }

    // Get website by tracking code
    const website = await getWebsiteByTrackingCode(trackingCode);

    if (!website) {
      return new NextResponse(null, { status: 204 });
    }

    // Get visitor/session from cookies
    const cookieHeader = request.headers.get("cookie");
    const visitorId =
      cookieHeader
        ?.split(";")
        .find((c) => c.trim().startsWith("_pm_vid="))
        ?.split("=")[1] || undefined;
    const sessionId =
      cookieHeader
        ?.split(";")
        .find((c) => c.trim().startsWith("_pm_sid="))
        ?.split("=")[1] || undefined;

    // Track the goal event
    await trackGoalEvent({
      websiteId: website._id.toString(),
      event,
      sessionId,
      visitorId,
      path: searchParams.get("path") || "/",
      value: value ? parseFloat(value) : undefined,
    });

    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "X-Content-Type-Options": "nosniff",
      },
    }); // Don't break client sites
  }
}

export async function OPTIONS(request: NextRequest) {
  // Handle CORS preflight
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
