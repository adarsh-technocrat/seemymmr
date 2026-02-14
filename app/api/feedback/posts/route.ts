import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db";
import FeedbackPost from "@/db/models/FeedbackPost";
import User from "@/db/models/User";
import { getUserId, getSession } from "@/lib/get-session";
import { Types } from "mongoose";

const SORT_VALUES = ["hot", "top", "recent"] as const;

export async function GET(request: NextRequest) {
  try {
    const [_, userId] = await Promise.all([connectDB(), getUserId(request)]);
    const sort = (request.nextUrl.searchParams.get("sort") ||
      "hot") as (typeof SORT_VALUES)[number];
    if (!SORT_VALUES.includes(sort)) {
      return NextResponse.json({ error: "Invalid sort" }, { status: 400 });
    }

    let query = FeedbackPost.find().populate("userId", "name avatarUrl email");

    switch (sort) {
      case "top":
        query = query.sort({ upvoteCount: -1, createdAt: -1 });
        break;
      case "recent":
        query = query.sort({ createdAt: -1 });
        break;
      case "hot":
      default:
        query = query.sort({ upvoteCount: -1, createdAt: -1 });
        break;
    }

    const posts = await query.lean();

    const list = posts.map((p) => {
      const author = p.userId as {
        _id: Types.ObjectId;
        name?: string;
        avatarUrl?: string;
      } | null;
      return {
        _id: p._id,
        title: p.title,
        description: p.description,
        upvoteCount: p.upvoteCount,
        commentCount: p.commentCount,
        createdAt: p.createdAt,
        author: author
          ? {
              id: author._id,
              name: author.name ?? "Anonymous",
              avatarUrl: author.avatarUrl,
            }
          : null,
        upvoted:
          Array.isArray(p.upvotedBy) && userId
            ? p.upvotedBy.some(
                (id: { toString: () => string }) => id.toString() === userId,
              )
            : false,
      };
    });

    return NextResponse.json({ posts: list }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch feedback posts" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description } = body;
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const post = await FeedbackPost.create({
      title: title.trim(),
      description: typeof description === "string" ? description.trim() : "",
      userId: session.user.id,
      upvoteCount: 0,
      upvotedBy: [],
      commentCount: 0,
    });

    const author = await User.findById(session.user.id)
      .select("name avatarUrl")
      .lean();
    const doc = post.toObject ? post.toObject() : post;

    return NextResponse.json(
      {
        post: {
          _id: doc._id,
          title: doc.title,
          description: doc.description,
          upvoteCount: doc.upvoteCount,
          commentCount: doc.commentCount,
          createdAt: doc.createdAt,
          author: author
            ? { id: author._id, name: author.name, avatarUrl: author.avatarUrl }
            : null,
          upvoted: false,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create feedback post" },
      { status: 500 },
    );
  }
}
