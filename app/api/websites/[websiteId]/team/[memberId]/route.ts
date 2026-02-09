import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import TeamMember from "@/db/models/TeamMember";

/**
 * PUT /api/websites/[websiteId]/team/[memberId]
 * Update team member role or accept/decline invitation
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string; memberId: string }> }
) {
  try {
    const { websiteId, memberId } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { role, status } = body;

    // Verify user owns this website
    const website = await Website.findOne({
      _id: websiteId,
      userId: session.user.id,
    });

    const teamMember = await TeamMember.findOne({
      _id: memberId,
      websiteId,
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    // If accepting/declining invitation, user must be the invitee
    if (status && teamMember.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // If updating role, user must be website owner
    if (role && !website) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update team member
    if (role) teamMember.role = role;
    if (status) {
      teamMember.status = status;
      if (status === "accepted") {
        teamMember.acceptedAt = new Date();
      }
    }

    await teamMember.save();

    return NextResponse.json({
      success: true,
      teamMember: await TeamMember.findById(teamMember._id)
        .populate("userId", "email name avatarUrl")
        .populate("invitedBy", "email name"),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update team member" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/websites/[websiteId]/team/[memberId]
 * Remove a team member
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string; memberId: string }> }
) {
  try {
    const { websiteId, memberId } = await params;
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

    // Delete team member
    const teamMember = await TeamMember.findOneAndDelete({
      _id: memberId,
      websiteId,
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Team member removed" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to remove team member" },
      { status: 500 }
    );
  }
}
