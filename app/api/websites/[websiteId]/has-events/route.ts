import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/get-session";
import { getWebsiteById } from "@/utils/database/website";
import Session from "@/db/models/Session";
import { Types } from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  try {
    const { websiteId } = await params;
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const website = await getWebsiteById(websiteId);
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    if (website.userId.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const websiteObjectId = new Types.ObjectId(websiteId);

    const sessionCount = await Session.countDocuments({
      websiteId: websiteObjectId,
    });

    const hasEvents = sessionCount > 0;
    return NextResponse.json({ hasEvents, sessionCount });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
