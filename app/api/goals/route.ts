import { NextRequest, NextResponse } from "next/server";
import { getGoalsByWebsiteId, createGoal } from "@/utils/database/goal";
import { getWebsiteById } from "@/utils/database/website";
import { getUserId } from "@/lib/get-session";

export async function GET(request: NextRequest) {
  try {
    const websiteId = request.nextUrl.searchParams.get("websiteId");

    if (!websiteId) {
      return NextResponse.json(
        { error: "websiteId is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const website = await getWebsiteById(websiteId);
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    const userId = await getUserId();
    if (!userId || website.userId.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const goals = await getGoalsByWebsiteId(websiteId);

    return NextResponse.json({ goals }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { websiteId, name, event, description } = body;

    if (!websiteId || !name || !event) {
      return NextResponse.json(
        { error: "websiteId, name, and event are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const website = await getWebsiteById(websiteId);
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    const userId = await getUserId();
    if (!userId || website.userId.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const goal = await createGoal({
      websiteId,
      name,
      event,
      description,
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    );
  }
}
