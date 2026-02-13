import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db";
import FeedbackPost from "@/db/models/FeedbackPost";
import { getUserId } from "@/lib/get-session";
import { isValidObjectId } from "@/utils/validation";
import { Types } from "mongoose";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    if (!isValidObjectId(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    await connectDB();
    const post = await FeedbackPost.findById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const uid = new Types.ObjectId(userId);
    const upvotedBy = (post.upvotedBy as Types.ObjectId[]) || [];
    const index = upvotedBy.findIndex((id) => id.equals(uid));

    if (index >= 0) {
      upvotedBy.splice(index, 1);
      post.upvoteCount = Math.max(0, (post.upvoteCount ?? 0) - 1);
    } else {
      upvotedBy.push(uid);
      post.upvoteCount = (post.upvoteCount ?? 0) + 1;
    }
    post.upvotedBy = upvotedBy;
    await post.save();

    return NextResponse.json(
      { upvoteCount: post.upvoteCount, upvoted: index < 0 },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update upvote" },
      { status: 500 },
    );
  }
}
