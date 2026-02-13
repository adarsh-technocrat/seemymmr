import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db";
import FeedbackPost from "@/db/models/FeedbackPost";
import { getUserId } from "@/lib/get-session";
import { isValidObjectId } from "@/utils/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await params;
    if (!isValidObjectId(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    await connectDB();
    const post = await FeedbackPost.findById(postId)
      .populate("userId", "name avatarUrl email")
      .lean();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const userId = await getUserId(request);
    const author = post.userId as {
      _id: unknown;
      name?: string;
      avatarUrl?: string;
    } | null;

    const out = {
      _id: post._id,
      title: post.title,
      description: post.description,
      upvoteCount: post.upvoteCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt,
      author: author
        ? {
            id: author._id,
            name: author.name ?? "Anonymous",
            avatarUrl: author.avatarUrl,
          }
        : null,
      upvoted:
        Array.isArray(post.upvotedBy) && userId
          ? post.upvotedBy.some(
              (id: { toString: () => string }) => id.toString() === userId,
            )
          : false,
    };

    return NextResponse.json({ post: out }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch feedback post" },
      { status: 500 },
    );
  }
}
