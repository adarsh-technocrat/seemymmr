import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db";
import FeedbackComment from "@/db/models/FeedbackComment";
import { getUserId } from "@/lib/get-session";
import { isValidObjectId } from "@/utils/validation";
import { Types } from "mongoose";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string; commentId: string }> },
) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId, commentId } = await params;
    if (!isValidObjectId(postId) || !isValidObjectId(commentId)) {
      return NextResponse.json(
        { error: "Invalid post or comment ID" },
        { status: 400 },
      );
    }

    await connectDB();
    const comment = await FeedbackComment.findOne({
      _id: commentId,
      postId,
    });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const uid = new Types.ObjectId(userId);
    const raw = (comment.upvotedBy as Types.ObjectId[]) || [];
    const upvotedBy = raw.map((id) =>
      id instanceof Types.ObjectId ? id : new Types.ObjectId(String(id)),
    );
    const index = upvotedBy.findIndex((id) => id.toString() === uid.toString());

    if (index >= 0) {
      upvotedBy.splice(index, 1);
      comment.upvoteCount = Math.max(0, (comment.upvoteCount ?? 0) - 1);
    } else {
      upvotedBy.push(uid);
      comment.upvoteCount = (comment.upvoteCount ?? 0) + 1;
    }
    comment.upvotedBy = [...upvotedBy];
    await comment.save();

    return NextResponse.json(
      { upvoteCount: comment.upvoteCount, upvoted: index < 0 },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update comment upvote" },
      { status: 500 },
    );
  }
}
