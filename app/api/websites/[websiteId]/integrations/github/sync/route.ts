import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import { syncGitHubCommits } from "@/utils/integrations/github";

export async function POST(
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

    // Check if GitHub integration is enabled
    if (!website.integrations?.github?.enabled) {
      return NextResponse.json(
        { error: "GitHub integration is not enabled" },
        { status: 400 }
      );
    }

    const repositories = website.integrations.github.repositories || [];

    if (repositories.length === 0) {
      return NextResponse.json(
        { error: "No repositories configured" },
        { status: 400 }
      );
    }

    // Sync commits
    const count = await syncGitHubCommits(websiteId, repositories);

    return NextResponse.json({
      success: true,
      synced: count,
      message: `Synced ${count} new commits`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to sync GitHub commits" },
      { status: 500 }
    );
  }
}
