import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db";
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
import { parseUserAgent, type DeviceInfo } from "@/utils/tracking/device";
import {
  getLocationFromIP,
  getIPFromHeaders,
  type LocationInfo,
} from "@/utils/tracking/geolocation";
import { shouldExcludeVisit } from "@/utils/tracking/validation";
import { getWebsiteByTrackingCode } from "@/utils/database/website";
import {
  checkTrafficSpike,
  applyAttackModeProtections,
} from "@/utils/security/attack-mode";
import type { IWebsite } from "@/db/models/Website";
import type { ISession } from "@/db/models/Session";
import type { IPageView } from "@/db/models/PageView";

const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

type TrackingEventType =
  | "pageview"
  | "exit_link"
  | "scroll"
  | "click"
  | "custom";

interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

interface FinalUtmParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

interface ExitLinkExtraData {
  exitUrl?: string;
  exitLinkText?: string;
}

interface TrackingRequestBody {
  hostname?: string;
  path?: string;
  title?: string;
  visitorId?: string;
  sessionId?: string;
  type?: TrackingEventType;
  referrer?: string;
  utmParams?: UtmParams;
  extraData?: ExitLinkExtraData | Record<string, unknown>;
}

export async function OPTIONS(request: NextRequest) {
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
    let requestBody: TrackingRequestBody | null = null;
    if (method === "POST") {
      try {
        const body = await request.json();
        requestBody = body as TrackingRequestBody;
      } catch (e) {
        requestBody = null;
      }
    }

    const trackingCode = request.nextUrl.searchParams.get("site");

    if (!trackingCode) {
      return new NextResponse(PIXEL, {
        status: 200,
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    const hostnameForValidation: string = requestBody?.hostname || "unknown";

    const website: IWebsite | null = await getWebsiteByTrackingCode(
      trackingCode,
      hostnameForValidation,
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

    const headers: Headers = request.headers;
    const cookieHeader: string | null = headers.get("cookie");
    const userAgent: string | null = headers.get("user-agent");
    const ip: string = getIPFromHeaders(headers);

    let path: string =
      request.nextUrl.searchParams.get("path") || requestBody?.path || "/";
    let title: string | undefined =
      request.nextUrl.searchParams.get("title") ||
      requestBody?.title ||
      undefined;
    const hostname: string = hostnameForValidation;
    const bodyVisitorId: string | null = requestBody?.visitorId || null;
    const bodySessionId: string | null = requestBody?.sessionId || null;
    const eventType: TrackingEventType | undefined = requestBody?.type;
    const extraData: ExitLinkExtraData | Record<string, unknown> =
      requestBody?.extraData || {};

    const clientReferrer: string | null = requestBody?.referrer || null;
    const utmParams: UtmParams = requestBody?.utmParams || {};

    let visitorId: string = getVisitorIdFromCookie(cookieHeader) || "";
    if (!visitorId && bodyVisitorId) {
      visitorId = bodyVisitorId;
    }
    if (!visitorId) {
      visitorId = generateVisitorId();
    }

    let sessionId: string = getSessionIdFromCookie(cookieHeader) || "";
    if (!sessionId && bodySessionId) {
      sessionId = bodySessionId;
    }
    const isNewSession: boolean = !sessionId;
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

    const referrer: string | null = clientReferrer || null;

    let referrerDomain: string | null = null;
    if (referrer) {
      try {
        const referrerUrl = new URL(referrer);
        referrerDomain = referrerUrl.hostname;
      } catch {
        referrerDomain = referrer.includes("://")
          ? referrer.split("://")[1]?.split("/")[0] || null
          : referrer;
      }
    }

    let finalUtmParams: FinalUtmParams = {};
    if (utmParams?.utm_source) {
      finalUtmParams = {
        utmSource: utmParams.utm_source,
        utmMedium: utmParams.utm_medium || "unknown",
        utmCampaign: utmParams.utm_campaign || undefined,
        utmTerm: utmParams.utm_term || undefined,
        utmContent: utmParams.utm_content || undefined,
      };
    }

    const deviceInfo: DeviceInfo = parseUserAgent(userAgent);

    const location: LocationInfo = await getLocationFromIP(ip);

    await checkTrafficSpike(website._id.toString());

    // Apply attack mode protections
    const protection: { allowed: boolean; reason?: string } =
      await applyAttackModeProtections(website._id.toString(), ip);

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

    const now: Date = new Date();

    // Create or update session
    let session: ISession | null = await Session.findOne({
      websiteId: website._id,
      sessionId,
    });

    if (isNewSession || !session) {
      // Before creating a new session, check if there's an active session for this visitor
      // This prevents duplicate sessions when cookies are lost but visitor is still active
      const fiveMinutesAgo: Date = new Date(now.getTime() - 5 * 60 * 1000);
      const existingActiveSession: ISession | null = await Session.findOne({
        websiteId: website._id,
        visitorId,
        lastSeenAt: { $gte: fiveMinutesAgo },
      }).sort({ lastSeenAt: -1 });

      if (existingActiveSession) {
        // Reuse existing active session - keep its sessionId, just update it
        // Update the sessionId cookie to match the existing session
        sessionId = existingActiveSession.sessionId;
        existingActiveSession.pageViews += 1;
        existingActiveSession.bounce = false;
        existingActiveSession.lastSeenAt = now;
        existingActiveSession.duration = Math.floor(
          (now.getTime() - existingActiveSession.firstVisitAt.getTime()) / 1000,
        );
        await existingActiveSession.save();
        session = existingActiveSession;
      } else {
        // Create new session
        session = new Session({
          websiteId: website._id,
          sessionId,
          visitorId,
          firstVisitAt: now,
          referrer: referrer,
          referrerDomain: referrerDomain,
          ...finalUtmParams,
          ...deviceInfo,
          ...location,
          pageViews: 1,
          duration: 0,
          bounce: true,
          lastSeenAt: now,
        });
        await session.save();
      }
    } else {
      // Update existing session
      session.pageViews += 1;
      session.bounce = false; // Multiple page views = not a bounce
      session.lastSeenAt = now;
      // Calculate session duration in seconds
      session.duration = Math.floor(
        (now.getTime() - session.firstVisitAt.getTime()) / 1000,
      );
      await session.save();
    }

    // Create page view
    const pageView: IPageView = new PageView({
      websiteId: website._id,
      sessionId,
      visitorId,
      path,
      hostname,
      title,
      referrer: referrer,
      referrerPath: referrer
        ? (() => {
            try {
              return new URL(referrer).pathname;
            } catch {
              return undefined;
            }
          })()
        : undefined,
      ...finalUtmParams,
      ...deviceInfo,
      ...location,
      exitUrl:
        eventType === "exit_link" && "exitUrl" in extraData
          ? extraData.exitUrl
          : undefined,
      exitLinkText:
        eventType === "exit_link" && "exitLinkText" in extraData
          ? extraData.exitLinkText
          : undefined,
      timestamp: now,
    });
    await pageView.save();

    const protocol: string =
      request.headers.get("x-forwarded-proto") ||
      request.nextUrl.protocol.slice(0, -1);
    const isSecure: boolean = protocol === "https";

    const response: NextResponse = new NextResponse(PIXEL, {
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
      },
    });
    response.headers.append(
      "Set-Cookie",
      createVisitorIdCookie(visitorId, isSecure),
    );
    response.headers.append(
      "Set-Cookie",
      createSessionIdCookie(sessionId, isSecure),
    );

    return response;
  } catch (error) {
    return new NextResponse(PIXEL, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }
}
