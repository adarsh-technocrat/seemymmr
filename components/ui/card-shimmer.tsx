import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface CardShimmerProps {
  className?: string;
  /** Number of description lines to show (default 2) */
  descriptionLines?: number;
  /** Show upvote block on the right (default true for list card layout) */
  showUpvote?: boolean;
}

/**
 * Shimmer/skeleton placeholder for a feedback-style card.
 * Matches the layout: title, description lines, meta row, optional upvote block.
 */
export function CardShimmer({
  className,
  descriptionLines = 2,
  showUpvote = true,
}: CardShimmerProps) {
  return (
    <div
      className={cn(
        "custom-card flex items-start justify-between gap-4 rounded-lg border border-stone-200 p-6",
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4 rounded-md bg-stone-200" />
        {Array.from({ length: descriptionLines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              "h-4 rounded-md bg-stone-200",
              i === descriptionLines - 1 ? "w-4/5" : "w-full",
            )}
          />
        ))}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Skeleton className="h-4 w-8 rounded-md bg-stone-200" />
          <Skeleton className="h-4 w-20 rounded-md bg-stone-200" />
          <Skeleton className="h-4 w-24 rounded-md bg-stone-200" />
        </div>
      </div>
      {showUpvote && (
        <div className="flex shrink-0 flex-col items-center gap-1">
          <Skeleton className="h-5 w-5 rounded-md bg-stone-200" />
          <Skeleton className="h-5 w-6 rounded-md bg-stone-200" />
        </div>
      )}
    </div>
  );
}

const FEEDBACK_LIST_SHIMMER_COUNT = 4;

/**
 * Renders multiple card shimmers for the feedback list loading state.
 */
export function FeedbackListShimmer() {
  return (
    <div className="w-full space-y-6">
      {Array.from({ length: FEEDBACK_LIST_SHIMMER_COUNT }).map((_, i) => (
        <CardShimmer key={i} showUpvote />
      ))}
    </div>
  );
}

/**
 * Shimmer for the feedback post detail left column (upvote + title + description + meta).
 */
export function FeedbackDetailShimmer() {
  return (
    <div className="flex w-full shrink-0 gap-6 md:max-w-[28rem] md:w-[28rem] md:flex-row">
      <Skeleton className="h-[72px] w-14 shrink-0 rounded-lg bg-stone-200" />
      <div className="min-w-0 flex-1 space-y-3">
        <Skeleton className="h-7 w-4/5 rounded-md bg-stone-200" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded-md bg-stone-200" />
          <Skeleton className="h-4 w-full rounded-md bg-stone-200" />
          <Skeleton className="h-4 w-2/3 rounded-md bg-stone-200" />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-6 w-6 rounded-full bg-stone-200" />
          <Skeleton className="h-4 w-28 rounded-md bg-stone-200" />
          <Skeleton className="h-4 w-24 rounded-md bg-stone-200" />
        </div>
      </div>
    </div>
  );
}
