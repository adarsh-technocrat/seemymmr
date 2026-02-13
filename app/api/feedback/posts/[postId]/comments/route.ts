import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db";
import FeedbackComment from "@/db/models/FeedbackComment";
import FeedbackPost from "@/db/models/FeedbackPost";
import User from "@/db/models/User";
import { getSession, getUserId } from "@/lib/get-session";
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

    const userId = await getUserId(request);
    await connectDB();
    const comments = await FeedbackComment.find({ postId })
      .populate("userId", "name avatarUrl")
      .sort({ createdAt: 1 })
      .lean();

    const list = comments.map((c) => {
      const author = c.userId as {
        _id: unknown;
        name?: string;
        avatarUrl?: string;
      } | null;
      const upvoted =
        !!userId &&
        Array.isArray(c.upvotedBy) &&
        c.upvotedBy.some(
          (id: { toString: () => string }) => id.toString() === userId,
        );
      return {
        _id: c._id,
        body: c.body,
        upvoteCount: c.upvoteCount,
        upvoted,
        createdAt: c.createdAt,
        author: author
          ? {
              id: author._id,
              name: author.name ?? "Anonymous",
              avatarUrl: author.avatarUrl,
            }
          : null,
      };
    });

    return NextResponse.json(
      { comments: list, currentUserId: userId ?? null },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    if (!isValidObjectId(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const body = await request.json();
    const { body: commentBody } = body;
    if (
      !commentBody ||
      typeof commentBody !== "string" ||
      !commentBody.trim()
    ) {
      return NextResponse.json(
        { error: "Comment body is required" },
        { status: 400 },
      );
    }

    await connectDB();
    const post = await FeedbackPost.findById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const comment = await FeedbackComment.create({
      postId,
      userId: session.user.id,
      body: commentBody.trim(),
      upvoteCount: 0,
      upvotedBy: [],
    });

    await FeedbackPost.updateOne(
      { _id: postId },
      { $inc: { commentCount: 1 } },
    );

    const author = await User.findById(session.user.id)
      .select("name avatarUrl")
      .lean();
    const doc = comment.toObject ? comment.toObject() : comment;

    return NextResponse.json(
      {
        comment: {
          _id: doc._id,
          body: doc.body,
          upvoteCount: doc.upvoteCount,
          createdAt: doc.createdAt,
          author: author
            ? { id: author._id, name: author.name, avatarUrl: author.avatarUrl }
            : null,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 },
    );
  }
}
