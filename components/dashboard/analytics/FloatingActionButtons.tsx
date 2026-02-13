"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

const buttonClass = cn(
  "group inline-flex size-10 cursor-pointer items-center justify-center rounded-xl",
  "bg-gray-900 text-white shadow-xl",
  "ring-1 ring-gray-900/10 duration-100 hover:ring-gray-900/20",
  "dark:bg-gray-800 dark:ring-gray-200/30 dark:hover:ring-gray-200/50",
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-ring",
);

const iconClass =
  "size-[22px] stroke-white transition-all duration-200 group-hover:size-6 dark:stroke-gray-200";

interface FloatingActionButtonsProps {
  onOpenMap?: () => void;
  onOpenInsights?: () => void;
  onOpenAlerts?: () => void;
  feedbackUrl?: string;
}

export function FloatingActionButtons({
  onOpenMap,
  onOpenInsights,
  onOpenAlerts,
  feedbackUrl = "/feedback",
}: FloatingActionButtonsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        onOpenMap?.();
      } else if (event.key === "i" || event.key === "I") {
        event.preventDefault();
        onOpenInsights?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenMap, onOpenInsights]);

  return (
    <TooltipProvider>
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2">
        {/* Real-time Map */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={onOpenMap} className={buttonClass}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className={cn(
                  iconClass,
                  "group-hover:stroke-blue-300 group-hover:drop-shadow-[0_0_8px_#93c5fd]",
                )}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
                />
              </svg>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex gap-1 items-center text-sm">
              <span className="font-medium">Open Real-time Map</span>
              <Kbd className="text-xs">M</Kbd>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Insights */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={onOpenInsights} className={buttonClass}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className={cn(
                  iconClass,
                  "group-hover:stroke-yellow-300 group-hover:drop-shadow-[0_0_8px_#fde047]",
                )}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
                />
              </svg>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex gap-1 items-center text-sm">
              <span className="font-medium">Open Insights</span>
              <Kbd className="text-xs">I</Kbd>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Alerts */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={onOpenAlerts} className={buttonClass}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className={cn(
                  iconClass,
                  "group-hover:stroke-orange-300 group-hover:drop-shadow-[0_0_8px_#fdba74]",
                )}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                />
              </svg>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex gap-1 items-center text-sm">
              <span className="font-medium">Open Alerts</span>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Suggest a feature */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={feedbackUrl}
              className={buttonClass}
              aria-label="Suggest a feature"
              {...(feedbackUrl.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className={cn(
                  iconClass,
                  "group-hover:stroke-green-300 group-hover:drop-shadow-[0_0_8px_#86efac]",
                )}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z"
                />
              </svg>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex gap-1 items-center text-sm">
              <span className="font-medium">Suggest a feature</span>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
