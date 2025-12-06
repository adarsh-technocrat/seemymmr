import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import TeamMember from "@/db/models/TeamMember";
import User from "@/db/models/User";

/**
 * GET /api/websites/[websiteId]/team
 * Get team members for a website
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

    // Get website first to check access and get owner info
    const website = await Website.findById(websiteId);
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    // Verify user owns this website or is a team member
    const isOwner = website.userId.toString() === session.user.id;
    const isTeamMember = await TeamMember.findOne({
      websiteId,
      userId: session.user.id,
      status: "accepted",
    });

    if (!isOwner && !isTeamMember) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const teamMembers = await TeamMember.find({ websiteId })
      .populate("userId", "email name avatarUrl")
      .populate("invitedBy", "email name")
      .sort({ createdAt: -1 });

    // Get owner information
    const owner = await User.findById(website.userId).select(
      "email name avatarUrl"
    );

    return NextResponse.json({
      teamMembers,
      owner: owner
        ? {
            _id: owner._id.toString(),
            email: owner.email,
            name: owner.name,
            avatarUrl: owner.avatarUrl,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/websites/[websiteId]/team
 * Invite a team member
 */
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

    const body = await request.json();
    const { email, role = "viewer" } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { error: "User not found. They need to sign up first." },
        { status: 404 }
      );
    }

    // Check if already a team member
    const existing = await TeamMember.findOne({
      websiteId,
      userId: user._id,
    });

    if (existing) {
      return NextResponse.json(
        { error: "User is already a team member" },
        { status: 400 }
      );
    }

    // Create team member invitation
    const teamMember = new TeamMember({
      websiteId,
      userId: user._id,
      invitedBy: session.user.id,
      role,
      status: "pending",
    });

    await teamMember.save();

    // TODO: Send invitation email

    return NextResponse.json({
      success: true,
      teamMember: await TeamMember.findById(teamMember._id)
        .populate("userId", "email name avatarUrl")
        .populate("invitedBy", "email name"),
      message: "Team member invited successfully",
    });
  } catch (error: any) {
    console.error("Error inviting team member:", error);
    return NextResponse.json(
      { error: error.message || "Failed to invite team member" },
      { status: 500 }
    );
  }
}
