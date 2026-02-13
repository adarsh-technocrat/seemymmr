"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FeedbackListShimmer } from "@/components/ui/card-shimmer";
import { cn } from "@/lib/utils";

type Sort = "hot" | "top" | "recent";

interface Author {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface FeedbackPostItem {
  _id: string;
  title: string;
  description: string;
  upvoteCount: number;
  commentCount: number;
  createdAt: string;
  author: Author | null;
  upvoted: boolean;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function HotIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M8.074.945A4.993 4.993 0 0 0 6 5v.032c.004.6.114 1.176.311 1.709.16.428-.204.91-.61.7a5.023 5.023 0 0 1-1.868-1.677c-.202-.304-.648-.363-.848-.058a6 6 0 1 0 8.017-1.901l-.004-.007a4.98 4.98 0 0 1-2.18-2.574c-.116-.31-.477-.472-.744-.28Zm.78 6.178a3.001 3.001 0 1 1-3.473 4.341c-.205-.365.215-.694.62-.59a4.008 4.008 0 0 0 1.873.03c.288-.065.413-.386.321-.666A3.997 3.997 0 0 1 8 8.999c0-.585.126-1.14.351-1.641a.42.42 0 0 1 .503-.235Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function TopIcon({ className }: { className?: string }) {
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

function RecentIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
    >
      <path d="M5.75 7.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM5 10.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0ZM10.25 7.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM7.25 8.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0ZM8 9.5A.75.75 0 1 0 8 11a.75.75 0 0 0 0-1.5Z" />
      <path
        fillRule="evenodd"
        d="M4.75 1a.75.75 0 0 0-.75.75V3a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2V1.75a.75.75 0 0 0-1.5 0V3h-5V1.75A.75.75 0 0 0 4.75 1ZM3.5 7a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v4.5a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V7Z"
        clipRule="evenodd"
      />
    </svg>
  );
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

function CommentIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
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

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M4.22 11.78a.75.75 0 0 1 0-1.06L9.44 5.5H5.75a.75.75 0 0 1 0-1.5h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0V6.56l-5.22 5.22a.75.75 0 0 1-1.06 0Z"
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
        width={20}
        height={20}
        className="h-5 w-5 rounded-full object-cover shrink-0"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-100 text-[10px] font-medium text-stone-600 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-400">
      {initial}
    </span>
  );
}

export default function FeedbackPage() {
  const [sort, setSort] = useState<Sort>("hot");
  const [posts, setPosts] = useState<FeedbackPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/feedback/posts?sort=${sort}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts ?? []);
      } else {
        setPosts([]);
      }
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [sort]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Failed to submit");
        return;
      }
      setTitle("");
      setDescription("");
      setPosts((prev) => [data.post, ...prev]);
    } catch {
      setSubmitError("Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/feedback/posts/${postId}/upvote`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId
              ? { ...p, upvoteCount: data.upvoteCount, upvoted: data.upvoted }
              : p,
          ),
        );
      }
    } catch {
      // ignore
    }
  };

  const tabClass = (s: Sort) =>
    cn(
      "flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium transition-colors",
      sort === s
        ? "border-stone-800 bg-stone-800 text-white"
        : "bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-800",
    );

  return (
    <div className="min-h-screen bg-stone-50 antialiased">
      <header className="sticky top-0 z-50 h-14 items-center border-b border-stone-200/50 bg-stone-50/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <Link
            href="/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-stone-800 transition-colors hover:opacity-70"
          >
            <Image
              src="/icon.svg"
              alt=""
              width={24}
              height={24}
              className="h-6 w-6 shrink-0 rounded-md"
            />
            <span className="font-bold tracking-tight text-stone-800">
              Postmetric
            </span>
            <ExternalLinkIcon className="h-4 w-4 shrink-0" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-4 lg:px-6">
        <section className="mb-2 hidden justify-end md:flex">
          <div role="tablist" className="grid grid-cols-3 gap-1">
            <button
              role="tab"
              aria-selected={sort === "hot"}
              className={tabClass("hot")}
              onClick={() => setSort("hot")}
            >
              <HotIcon className="h-4 w-4 shrink-0" />
              Hot
            </button>
            <button
              role="tab"
              aria-selected={sort === "top"}
              className={tabClass("top")}
              onClick={() => setSort("top")}
            >
              <TopIcon className="h-4 w-4 shrink-0" />
              Top
            </button>
            <button
              role="tab"
              aria-selected={sort === "recent"}
              className={tabClass("recent")}
              onClick={() => setSort("recent")}
            >
              <RecentIcon className="h-4 w-4 shrink-0" />
              Recent
            </button>
          </div>
        </section>

        <section className="flex flex-col items-start gap-12 md:flex-row">
          <div className="w-full md:sticky md:top-20 md:max-w-sm">
            <form
              onSubmit={handleSubmit}
              className="custom-card w-full space-y-4 rounded-lg border border-stone-200 p-6 lg:p-8"
            >
              <h2 className="text-lg font-bold text-stone-900">
                Suggest a feature
              </h2>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">
                  Short, descriptive title
                </label>
                <input
                  required
                  type="text"
                  autoComplete="off"
                  placeholder="Funnels"
                  className="w-full rounded border border-stone-200 px-3 py-2 text-sm placeholder-stone-400 focus:border-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-800"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">
                  Description
                </label>
                <textarea
                  autoComplete="off"
                  placeholder="I want to see a visual funnel to track the number of users who have completed each step in the funnel."
                  className="min-h-[175px] w-full rounded border border-stone-200 px-3 py-2 text-stone-800 placeholder-stone-400 focus:border-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-800"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              {submitError && (
                <p className="text-sm text-danger-500">{submitError}</p>
              )}
              <Button
                type="submit"
                className="w-full rounded border border-stone-800 bg-stone-800 font-semibold text-white transition-colors hover:bg-stone-700"
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Suggest feature"}
              </Button>
            </form>
            <p className="mt-2 text-center text-xs text-stone-500">
              🪲 Found a bug? Send an email to{" "}
              <a
                href="mailto:support@postmetric.io?subject=PostMetric Bug Report"
                className="text-stone-600 underline transition-colors hover:text-stone-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                support@postmetric.io
              </a>
            </p>
          </div>

          <section className="w-full md:hidden -mb-10">
            <div role="tablist" className="grid grid-cols-3 gap-1">
              <button
                role="tab"
                aria-selected={sort === "hot"}
                className={tabClass("hot")}
                onClick={() => setSort("hot")}
              >
                <HotIcon className="h-4 w-4 shrink-0" />
                Hot
              </button>
              <button
                role="tab"
                aria-selected={sort === "top"}
                className={tabClass("top")}
                onClick={() => setSort("top")}
              >
                <TopIcon className="h-4 w-4 shrink-0" />
                Top
              </button>
              <button
                role="tab"
                aria-selected={sort === "recent"}
                className={tabClass("recent")}
                onClick={() => setSort("recent")}
              >
                <RecentIcon className="h-4 w-4 shrink-0" />
                Recent
              </button>
            </div>
          </section>

          <div className="w-full space-y-6">
            {loading ? (
              <FeedbackListShimmer />
            ) : posts.length === 0 ? (
              <p className="text-stone-500">
                No suggestions yet. Be the first to suggest a feature.
              </p>
            ) : (
              posts.map((post) => (
                <Link
                  key={post._id}
                  href={`/feedback/${post._id}`}
                  title="Go to post"
                  className="custom-card custom-card-hover flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-stone-200 p-6 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-start gap-2 font-semibold text-stone-800">
                      {post.title}
                    </div>
                    <div className="mb-2 leading-relaxed text-stone-600">
                      {post.description || "No description"}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 text-sm text-stone-500">
                      <div className="flex items-center gap-1.5">
                        <CommentIcon className="h-5 w-5 shrink-0 text-stone-500" />
                        {post.commentCount}
                      </div>
                      <span className="opacity-80">•</span>
                      <div className="flex items-center gap-1.5">
                        <Avatar
                          name={post.author?.name ?? "?"}
                          avatarUrl={post.author?.avatarUrl}
                        />
                        <div className="flex items-center gap-2 text-sm">
                          <div className="max-w-[100px] truncate text-stone-600">
                            {post.author?.name ?? "Anonymous"}
                          </div>
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-amber-500/10 px-2 py-1 text-[0.7rem] font-medium text-amber-700 ring-1 ring-inset ring-amber-500/20">
                            <PowerUserStarIcon className="size-3.5 fill-amber-600" />
                            Power User
                          </span>
                        </div>
                      </div>
                      <span className="opacity-80">•</span>
                      <div className="whitespace-nowrap text-sm">
                        {formatDate(post.createdAt)}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleUpvote(e, post._id)}
                    title="Upvote post"
                    className={cn(
                      "group flex shrink-0 flex-col items-center justify-center gap-0 rounded-lg border border-stone-200 bg-white px-4 py-2 text-center text-lg text-stone-800 transition-colors hover:border-stone-300",
                      post.upvoted &&
                        "border-accent-500 bg-accent-50 text-accent-600",
                    )}
                  >
                    <UpvoteIcon className="h-5 w-5 ease-in-out duration-150 group-hover:-translate-y-0.5" />
                    <span className="tabular-nums">{post.upvoteCount}</span>
                  </button>
                </Link>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
