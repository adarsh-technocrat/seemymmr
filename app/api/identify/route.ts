import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import Session from "@/db/models/Session";

/**
 * User Identification API
 * Allows websites to identify users and link multiple sessions to the same user
 *
 * POST /api/identify
 * Body: {
 *   site: string (tracking code),
 *   userId: string,
 *   email?: string,
 *   name?: string,
 *   visitorId?: string (from cookie),
 *   sessionId?: string (from cookie)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { site, userId, email, name, visitorId, sessionId } = body;

    if (!site || !userId) {
      return NextResponse.json(
        { error: "site and userId are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Get website by tracking code
    const website = await Website.findOne({ trackingCode: site });

    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    // Check if user identification is enabled
    if (!website.settings?.trackUserIdentification) {
      return NextResponse.json(
        { error: "User identification is not enabled for this website" },
        { status: 403 }
      );
    }

    // If visitorId is provided, update all sessions for this visitor
    if (visitorId) {
      await Session.updateMany(
        {
          websiteId: website._id,
          visitorId,
        },
        {
          $set: {
            userId: userId.toString(),
          },
        }
      );
    }

    // If sessionId is provided, update that specific session
    if (sessionId) {
      await Session.updateOne(
        {
          websiteId: website._id,
          sessionId,
        },
        {
          $set: {
            visitorId: visitorId || sessionId, // Use visitorId if provided, otherwise use sessionId
            userId: userId.toString(),
          },
        }
      );
    }

    // If no visitorId or sessionId, create a new session record
    // This is useful for tracking users who haven't visited yet
    if (!visitorId && !sessionId) {
      // We can't create a session without a visitor/session ID
      // But we can store the user identification for future sessions
      // This would require a separate UserIdentification model
      // For now, we'll just return success
    }

    return NextResponse.json(
      {
        success: true,
        message: "User identified successfully",
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (error: any) {
    console.error("Error identifying user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to identify user" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  // Handle CORS preflight
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
