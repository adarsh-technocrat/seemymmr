"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface GranularitySelectorProps {
  selectedGranularity: "Hourly" | "Daily" | "Weekly" | "Monthly";
  availableGranularities: Array<"Hourly" | "Daily" | "Weekly" | "Monthly">;
  onGranularityChange: (
    granularity: "Hourly" | "Daily" | "Weekly" | "Monthly",
  ) => void;
}

export function GranularitySelector({
  selectedGranularity,
  availableGranularities,
  onGranularityChange,
}: GranularitySelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="hidden sm:block">
      <div className="relative h-8">
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 inline-flex shrink-0 flex-nowrap items-center gap-2 whitespace-nowrap border border-borderColor bg-white text-textPrimary hover:bg-gray-50 rounded-md px-3"
            >
              <span className="text-base font-normal">
                {selectedGranularity}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-chevron-down size-3.5 shrink-0 opacity-30 duration-200"
              >
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {availableGranularities.map((granularity) => (
              <DropdownMenuItem
                key={granularity}
                onClick={() => {
                  onGranularityChange(granularity);
                  setDropdownOpen(false);
                }}
                className={
                  selectedGranularity === granularity ? "bg-accent" : ""
                }
              >
                {granularity}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
