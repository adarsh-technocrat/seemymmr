import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import EmailNotification from "@/db/models/EmailNotification";

/**
 * GET /api/websites/[websiteId]/notifications
 * Get email notification preferences
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const { websiteId } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Verify user owns this website or is a team member
    const website = await Website.findOne({
      _id: websiteId,
      userId: session.user.id,
    });

    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    let notification = await EmailNotification.findOne({
      websiteId,
      userId: session.user.id,
    });

    // Create default if doesn't exist
    if (!notification) {
      notification = new EmailNotification({
        websiteId,
        userId: session.user.id,
        weeklySummary: false,
        trafficSpike: false,
      });
      await notification.save();
    }

    return NextResponse.json({ notification });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/websites/[websiteId]/notifications
 * Update email notification preferences
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const { websiteId } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Verify user owns this website
    const website = await Website.findOne({
      _id: websiteId,
      userId: session.user.id,
    });

    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    const body = await request.json();
    const { weeklySummary, trafficSpike } = body;

    const notification = await EmailNotification.findOneAndUpdate(
      { websiteId, userId: session.user.id },
      {
        weeklySummary: weeklySummary ?? false,
        trafficSpike: trafficSpike ?? false,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error: any) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update notifications" },
      { status: 500 }
    );
  }
}
