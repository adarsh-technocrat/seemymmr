"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FeedbackDetailShimmer } from "@/components/ui/card-shimmer";
import { cn } from "@/lib/utils";

interface Author {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface Post {
  _id: string;
  title: string;
  description: string;
  upvoteCount: number;
  commentCount: number;
  createdAt: string;
  author: Author | null;
  upvoted: boolean;
}

interface Comment {
  _id: string;
  body: string;
  upvoteCount: number;
  upvoted?: boolean;
  createdAt: string;
  author: Author | null;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function UpvoteIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}

function HeartIcon({
  className,
  filled = false,
}: {
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M12.5 9.75A2.75 2.75 0 0 0 9.75 7H4.56l2.22 2.22a.75.75 0 1 1-1.06 1.06l-3.5-3.5a.75.75 0 0 1 0-1.06l3.5-3.5a.75.75 0 0 1 1.06 1.06L4.56 5.5h5.19a4.25 4.25 0 0 1 0 8.5h-1a.75.75 0 0 1 0-1.5h1a2.75 2.75 0 0 0 2.75-2.75Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PowerUserStarIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M8 1.75a.75.75 0 0 1 .692.462l1.41 3.393 3.664.293a.75.75 0 0 1 .428 1.317l-2.791 2.39.853 3.575a.75.75 0 0 1-1.12.814L7.998 12.08l-3.135 1.915a.75.75 0 0 1-1.12-.814l.852-3.574-2.79-2.39a.75.75 0 0 1 .427-1.318l3.663-.293 1.41-3.393A.75.75 0 0 1 8 1.75Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const initial = name.charAt(0).toUpperCase();
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        width={24}
        height={24}
        className="h-6 w-6 rounded-full object-cover shrink-0"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-100 text-xs font-medium text-stone-600 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-400">
      {initial}
    </span>
  );
}

export default function FeedbackPostPage() {
  const params = useParams();
  const postId = params?.postId as string;
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [upvotingCommentId, setUpvotingCommentId] = useState<string | null>(
    null,
  );
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null,
  );

  const fetchPost = async () => {
    if (!postId) return;
    try {
      const res = await fetch(`/api/feedback/posts/${postId}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
      } else {
        setPost(null);
      }
    } catch {
      setPost(null);
    }
  };

  const fetchComments = async () => {
    if (!postId) return;
    try {
      const res = await fetch(`/api/feedback/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
        setCurrentUserId(data.currentUserId ?? null);
      } else {
        setComments([]);
      }
    } catch {
      setComments([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPost(), fetchComments()]).finally(() =>
      setLoading(false),
    );
  }, [postId]);

  const handleUpvote = async () => {
    if (!postId || !post) return;
    try {
      const res = await fetch(`/api/feedback/posts/${postId}/upvote`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setPost((prev) =>
          prev
            ? {
                ...prev,
                upvoteCount: data.upvoteCount,
                upvoted: data.upvoted,
              }
            : null,
        );
      }
    } catch {
      // ignore
    }
  };

  const handleCommentUpvote = async (commentId: string) => {
    if (upvotingCommentId) return;
    setUpvotingCommentId(commentId);
    try {
      const res = await fetch(
        `/api/feedback/posts/${postId}/comments/${commentId}/upvote`,
        { method: "POST" },
      );
      if (res.ok) {
        const data = await res.json();
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? {
                  ...c,
                  upvoteCount: data.upvoteCount,
                  upvoted: data.upvoted,
                }
              : c,
          ),
        );
      }
    } catch {
      // ignore
    } finally {
      setUpvotingCommentId(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (deletingCommentId || !window.confirm("Delete this comment?")) return;
    setDeletingCommentId(commentId);
    try {
      const res = await fetch(
        `/api/feedback/posts/${postId}/comments/${commentId}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        setPost((prev) =>
          prev
            ? { ...prev, commentCount: Math.max(0, prev.commentCount - 1) }
            : null,
        );
      }
    } catch {
      // ignore
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);
    if (!commentBody.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/feedback/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentBody.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCommentError(data.error ?? "Failed to post comment");
        return;
      }
      setCommentBody("");
      setComments((prev) => [...prev, { ...data.comment, upvoted: false }]);
      setPost((prev) =>
        prev ? { ...prev, commentCount: prev.commentCount + 1 } : null,
      );
    } catch {
      setCommentError("Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const headerLinkClass =
    "inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-stone-800 transition-colors hover:opacity-70";

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 antialiased">
        <header className="sticky top-0 z-50 h-14 items-center border-b border-stone-200/50 bg-stone-50/80 backdrop-blur-lg">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 lg:px-6">
            <Link href="/feedback" className={headerLinkClass}>
              <BackIcon className="h-4 w-4" />
              All posts
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8 lg:px-6">
          <div className="flex flex-col gap-12 md:flex-row md:items-start">
            <FeedbackDetailShimmer />
            <div className="min-w-0 flex-1 space-y-8">
              <Skeleton className="h-24 w-full rounded-lg bg-stone-200" />
              <div className="space-y-6">
                <Skeleton className="h-16 w-full rounded-lg bg-stone-200" />
                <Skeleton className="h-16 w-full rounded-lg bg-stone-200" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-stone-50 antialiased">
        <header className="sticky top-0 z-50 h-14 items-center border-b border-stone-200/50 bg-stone-50/80 backdrop-blur-lg">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 lg:px-6">
            <Link href="/feedback" className={headerLinkClass}>
              <BackIcon className="h-4 w-4" />
              All posts
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8 lg:px-6">
          <p className="text-stone-500">Post not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 antialiased">
      <header className="sticky top-0 z-50 h-14 items-center border-b border-stone-200/50 bg-stone-50/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 lg:px-6">
          <Link href="/feedback" className={headerLinkClass}>
            <BackIcon className="h-4 w-4" />
            All posts
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-8 lg:px-6">
        <div className="flex flex-col gap-12 md:flex-row md:items-start">
          <div className="flex w-full shrink-0 gap-6 md:sticky md:top-20 md:max-w-[28rem] md:w-[28rem] md:flex-row">
            <button
              type="button"
              onClick={handleUpvote}
              title="Upvote post"
              className={cn(
                "group flex shrink-0 flex-col items-center justify-center gap-0 rounded-lg border border-stone-200 bg-white px-4 py-2 text-lg text-stone-800 transition-colors hover:border-stone-300",
                post.upvoted &&
                  "border-accent-500 bg-accent-50 text-accent-600",
              )}
            >
              <UpvoteIcon className="h-5 w-5 ease-in-out duration-150 group-hover:-translate-y-0.5" />
              <span className="tabular-nums">{post.upvoteCount}</span>
            </button>
            <section className="min-w-0 flex-1">
              <h1 className="mb-3 text-xl font-bold text-stone-900">
                {post.title}
              </h1>
              <div className="mb-5 whitespace-pre-line leading-normal text-stone-700">
                {post.description || "No description."}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
                <div className="flex items-center gap-2">
                  <Avatar
                    name={post.author?.name ?? "?"}
                    avatarUrl={post.author?.avatarUrl}
                  />
                  <div className="max-w-[100px] truncate text-stone-600">
                    {post.author?.name ?? "Anonymous"}
                  </div>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-amber-500/10 px-2 py-1 text-[0.7rem] font-medium text-amber-700 ring-1 ring-inset ring-amber-500/20">
                    <PowerUserStarIcon className="size-3.5 fill-amber-600" />
                    Power User
                  </span>
                </div>
                <span className="opacity-80">•</span>
                <div className="whitespace-nowrap">
                  {formatDate(post.createdAt)}
                </div>
              </div>
            </section>
          </div>

          <div className="min-w-0 flex-1 space-y-8">
            <section>
              <form onSubmit={handleCommentSubmit} className="space-y-4">
                <textarea
                  required
                  placeholder="Leave a comment"
                  className="min-h-[48px] w-full rounded border border-stone-200 px-3 py-2 text-stone-800 placeholder-stone-400 focus:border-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-800"
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  rows={3}
                />
                {commentError && (
                  <p className="text-sm text-danger-500">{commentError}</p>
                )}
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingComment || !commentBody.trim()}
                  className="rounded border border-stone-800 bg-stone-800 font-medium text-white hover:bg-stone-700"
                >
                  {submittingComment ? "Posting…" : "Post comment"}
                </Button>
              </form>
            </section>

            <section>
              <div className="space-y-8">
                {comments.length === 0 ? (
                  <p className="text-sm text-stone-500">No comments yet.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c._id}>
                      <p className="mb-2 overflow-hidden text-ellipsis whitespace-pre-line leading-snug text-stone-800">
                        {c.body}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={c.author?.name ?? "?"}
                            avatarUrl={c.author?.avatarUrl}
                          />
                          <div className="max-w-[150px] truncate text-stone-600">
                            {c.author?.name ?? "Anonymous"}
                          </div>
                        </div>
                        <span className="opacity-80">•</span>
                        <div className="whitespace-nowrap">
                          {formatDate(c.createdAt)}
                        </div>
                        <span className="opacity-80">•</span>
                        <button
                          type="button"
                          onClick={() => handleCommentUpvote(c._id)}
                          disabled={upvotingCommentId === c._id}
                          className={cn(
                            "group flex items-center gap-1 duration-100 hover:text-danger-500 disabled:opacity-50",
                            c.upvoted && "text-danger-500",
                          )}
                          title="Upvote reply"
                        >
                          <HeartIcon
                            filled={!!c.upvoted}
                            className="size-4 duration-100 group-hover:text-danger-500"
                          />
                          <span>{c.upvoteCount}</span>
                        </button>
                        {currentUserId &&
                          String(c.author?.id) === String(currentUserId) && (
                            <>
                              <span className="opacity-80">•</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(c._id)}
                                disabled={deletingCommentId === c._id}
                                className="min-w-0 cursor-pointer text-sm text-stone-600 underline decoration-stone-400 hover:text-stone-800 hover:decoration-stone-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete your comment"
                              >
                                {deletingCommentId === c._id
                                  ? "Deleting…"
                                  : "Delete"}
                              </button>
                            </>
                          )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
