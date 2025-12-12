"use client";

import { useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

interface FloatingActionButtonsProps {
  onOpenMap?: () => void;
  onOpenInsights?: () => void;
}

export function FloatingActionButtons({
  onOpenMap,
  onOpenInsights,
}: FloatingActionButtonsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea
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
        {/* Real-time Map Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onOpenMap}
              className={cn(
                "group inline-flex size-10 cursor-pointer items-center justify-center rounded-xl",
                "bg-gray-900 text-white shadow-xl",
                "ring-1 ring-gray-900/10 duration-100 hover:ring-gray-900/20",
                "dark:bg-gray-800 dark:ring-gray-200/30 dark:hover:ring-gray-200/50"
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-[22px] stroke-white transition-all duration-200 group-hover:size-6 group-hover:stroke-blue-300 group-hover:drop-shadow-[0_0_8px_#93c5fd] dark:stroke-gray-200"
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

        {/* Insights Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onOpenInsights}
              className={cn(
                "group inline-flex size-10 cursor-pointer items-center justify-center rounded-xl",
                "bg-gray-900 text-white shadow-xl",
                "ring-1 ring-gray-900/10 duration-100 hover:ring-gray-900/20",
                "dark:bg-gray-800 dark:ring-gray-200/30 dark:hover:ring-gray-200/50"
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-[22px] stroke-white transition-all duration-200 group-hover:size-6 group-hover:stroke-yellow-300 group-hover:drop-shadow-[0_0_8px_#fde047] dark:stroke-gray-200"
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
      </div>
    </TooltipProvider>
  );
}
