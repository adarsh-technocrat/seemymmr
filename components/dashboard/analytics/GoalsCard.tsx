"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface GoalsCardProps {
  selectedTab: "Goal" | "Funnel" | "Journey";
  onTabChange: (tab: "Goal" | "Funnel" | "Journey") => void;
}

export function GoalsCard({ selectedTab, onTabChange }: GoalsCardProps) {
  return (
    <section className="custom-card" id="CustomEvent">
      <div>
        <div className="flex items-center justify-between gap-4 border-b border-textPrimary/5 px-1 py-1">
          <div className="flex items-center gap-0">
            <div className="relative">
              <div role="tablist" className="tabs tabs-sm ml-1">
                {(["Goal", "Funnel", "Journey"] as const).map((tab) => (
                  <button
                    key={tab}
                    role="tab"
                    className={`group tab relative h-8! gap-1 px-2! font-medium duration-100 ${
                      selectedTab === tab
                        ? "tab-active text-textPrimary"
                        : "text-textSecondary opacity-50 group-hover:text-textPrimary group-hover:opacity-80"
                    }`}
                    onClick={() => onTabChange(tab)}
                  >
                    <span>{tab}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Link
            href="/docs/custom-goals"
            target="_blank"
            className="text-textSecondary group mx-2 hidden items-center gap-0.5 px-2 py-1 text-xs opacity-80 duration-100 hover:text-primary hover:opacity-100 md:inline-flex"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="size-3"
            >
              <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z"></path>
            </svg>
            <span className="">Add goals</span>
          </Link>
        </div>
        <div className="relative h-96">
          <div className="relative flex h-full flex-col items-center justify-center gap-6">
            <div className="relative z-10 space-y-4 rounded-lg bg-white/20 px-4 py-2 text-center font-medium text-textPrimary backdrop-blur">
              <p className="font-semibold">
                Track what visitors do on your site
              </p>
              <Button
                size="sm"
                className="bg-primary hover:bg-[#d15a38] text-white"
                asChild
              >
                <Link href="/docs/custom-goals" target="_blank">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-4"
                  >
                    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"></path>
                  </svg>
                  Add goals
                </Link>
              </Button>
              <p className="text-textSecondary mx-auto max-w-[18rem] pt-4 text-center text-sm font-normal">
                Revenue-related goals are automatically tracked with{" "}
                <Link
                  href="/docs/revenue-attribution-guide"
                  className="link hover:text-primary"
                  target="_blank"
                >
                  revenue attribution
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
