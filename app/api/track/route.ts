import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import Session from "@/db/models/Session";
import PageView from "@/db/models/PageView";
import {
  generateVisitorId,
  generateSessionId,
  getVisitorIdFromCookie,
  getSessionIdFromCookie,
  createVisitorIdCookie,
  createSessionIdCookie,
} from "@/utils/tracking/visitor";
import { parseUserAgent } from "@/utils/tracking/device";
import {
  getLocationFromIP,
  getIPFromHeaders,
} from "@/utils/tracking/geolocation";
import { parseUTMParams, extractReferrerDomain } from "@/utils/tracking/utm";
import { shouldExcludeVisit } from "@/utils/tracking/validation";
import { getWebsiteByTrackingCode } from "@/utils/database/website";
import {
  checkTrafficSpike,
  applyAttackModeProtections,
} from "@/utils/security/attack-mode";

// 1x1 transparent pixel
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function OPTIONS(request: NextRequest) {
  // Handle CORS preflight
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function GET(request: NextRequest) {
  return handleTrack(request, "GET");
}

export async function POST(request: NextRequest) {
  return handleTrack(request, "POST");
}

async function handleTrack(request: NextRequest, method: "GET" | "POST") {
  try {
    await connectDB();

    // Get tracking code from query params or body
    const trackingCode =
      request.nextUrl.searchParams.get("site") ||
      (method === "POST" ? (await request.json()).site : null);

    if (!trackingCode) {
      return new NextResponse(PIXEL, {
        status: 200,
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    // Find website by tracking code (with additional domain support)
    // Get hostname early for domain validation
    let hostnameForValidation =
      request.nextUrl.searchParams.get("hostname") || "unknown";
    if (method === "POST") {
      try {
        const body = await request.json();
        hostnameForValidation = body.hostname || hostnameForValidation;
      } catch (e) {
        // Ignore JSON parse errors
      }
    }
    const website = await getWebsiteByTrackingCode(
      trackingCode,
      hostnameForValidation
    );
    if (!website) {
      return new NextResponse(PIXEL, {
        status: 200,
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    // Get request data
    const headers = request.headers;
    const cookieHeader = headers.get("cookie");
    const userAgent = headers.get("user-agent");
    const referrer = headers.get("referer") || headers.get("referrer");
    const ip = getIPFromHeaders(headers);

    // Parse request body for POST requests first (to get visitorId/sessionId if available)
    let path = request.nextUrl.searchParams.get("path") || "/";
    let title = request.nextUrl.searchParams.get("title") || undefined;
    let hostname = hostnameForValidation; // Use the hostname we already extracted
    let bodyVisitorId: string | null = null;
    let bodySessionId: string | null = null;

    if (method === "POST") {
      try {
        const body = await request.json();
        path = body.path || path;
        title = body.title || title;
        hostname = body.hostname || hostname;
        bodyVisitorId = body.visitorId || null;
        bodySessionId = body.sessionId || null;
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    // Get or generate visitor ID (prefer cookie, fallback to POST body, then generate)
    let visitorId = getVisitorIdFromCookie(cookieHeader);
    if (!visitorId && bodyVisitorId) {
      visitorId = bodyVisitorId;
    }
    if (!visitorId) {
      visitorId = generateVisitorId();
    }

    // Get or generate session ID (prefer cookie, fallback to POST body, then generate)
    let sessionId = getSessionIdFromCookie(cookieHeader);
    if (!sessionId && bodySessionId) {
      sessionId = bodySessionId;
    }
    // Determine if this is a new session (no sessionId found from cookie or body)
    const isNewSession = !sessionId;
    if (!sessionId) {
      sessionId = generateSessionId();
    }

    // Sanitize and validate inputs
    // Limit path length to prevent DoS
    if (path.length > 2048) {
      path = path.substring(0, 2048);
    }
    // Remove null bytes and dangerous characters
    path = path.replace(/\0/g, "").replace(/[\x00-\x1F\x7F]/g, "");

    // Limit title length
    if (title && title.length > 500) {
      title = title.substring(0, 500);
    }
    if (title) {
      title = title.replace(/\0/g, "").replace(/[\x00-\x1F\x7F]/g, "");
    }

    // Parse UTM parameters from referrer or URL
    const referrerUrl = referrer || request.nextUrl.href;
    const utmParams = parseUTMParams(referrerUrl);
    const referrerDomain = extractReferrerDomain(referrer);

    // Get device info
    const deviceInfo = parseUserAgent(userAgent);

    // Get location (async, but we'll use default for now)
    const location = await getLocationFromIP(ip);

    // Check attack mode protections
    // Check for traffic spike and activate attack mode if needed
    await checkTrafficSpike(website._id.toString());

    // Apply attack mode protections
    const protection = await applyAttackModeProtections(
      website._id.toString(),
      ip
    );

    if (!protection.allowed) {
      return new NextResponse(PIXEL, {
        status: 200,
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    // Check exclusion rules
    if (shouldExcludeVisit(website, ip, location.country, hostname, path)) {
      return new NextResponse(PIXEL, {
        status: 200,
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    // Hash path if enabled
    if (website.settings?.hashPaths) {
      // Simple hash implementation (in production, use crypto.createHash)
      path = `#${Buffer.from(path).toString("base64").slice(0, 10)}`;
    }

    const now = new Date();

    // Create or update session
    let session = await Session.findOne({
      websiteId: website._id,
      sessionId,
    });

    if (isNewSession || !session) {
      // Create new session
      session = new Session({
        websiteId: website._id,
        sessionId,
        visitorId,
        firstVisitAt: now,
        referrer,
        referrerDomain,
        ...utmParams,
        ...deviceInfo,
        ...location,
        pageViews: 1,
        duration: 0,
        bounce: true,
        lastSeenAt: now,
      });
      await session.save();
    } else {
      // Update existing session
      session.pageViews += 1;
      session.bounce = false; // Multiple page views = not a bounce
      session.lastSeenAt = now;
      await session.save();
    }

    // Create page view
    const pageView = new PageView({
      websiteId: website._id,
      sessionId,
      visitorId,
      path,
      hostname,
      title,
      referrer,
      referrerPath: referrer ? new URL(referrer).pathname : undefined,
      ...utmParams,
      ...deviceInfo,
      ...location,
      timestamp: now,
    });
    await pageView.save();

    // Prepare response with cookies and security headers
    const response = new NextResponse(PIXEL, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate, private",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "no-referrer",
        // CORS headers for cross-origin tracking
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        "Set-Cookie": [
          createVisitorIdCookie(visitorId),
          createSessionIdCookie(sessionId),
        ].join(", "),
      },
    });

    return response;
  } catch (error) {
    console.error("Tracking error:", error);
    // Return pixel even on error to not break client sites
    return new NextResponse(PIXEL, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }
}
