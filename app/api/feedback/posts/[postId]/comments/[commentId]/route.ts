import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db";
import FeedbackComment from "@/db/models/FeedbackComment";
import FeedbackPost from "@/db/models/FeedbackPost";
import { getUserId } from "@/lib/get-session";
import { isValidObjectId } from "@/utils/validation";

export async function DELETE(
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

    if (comment.userId.toString() !== userId) {
      return NextResponse.json(
        { error: "You can only delete your own comment" },
        { status: 403 },
      );
    }

    await FeedbackComment.deleteOne({ _id: commentId, postId });
    await FeedbackPost.updateOne(
      { _id: postId },
      { $inc: { commentCount: -1 } },
    );

    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 },
    );
  }
}
