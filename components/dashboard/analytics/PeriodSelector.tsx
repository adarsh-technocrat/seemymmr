"use client";

import React, { useState } from "react";
import { type DateRange } from "react-day-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CalendarIcon,
} from "@/components/icons";

interface PeriodSelectorProps {
  selectedPeriod: string;
  periodOffset: number;
  customDateRange: DateRange | undefined;
  onPeriodChange: (period: string) => void;
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
  onCustomDateRangeChange: (range: DateRange | undefined) => void;
  canGoNext: boolean;
}

const periodOptions = [
  "Today",
  "Yesterday",
  "Last 24 hours",
  "Last 7 days",
  "Last 30 days",
  "Last 12 months",
  "Week to date",
  "Month to date",
  "Year to date",
  "All time",
  "Custom",
];

export function PeriodSelector({
  selectedPeriod,
  periodOffset,
  customDateRange,
  onPeriodChange,
  onPreviousPeriod,
  onNextPeriod,
  onCustomDateRangeChange,
  canGoNext,
}: PeriodSelectorProps) {
  const [customDatePickerOpen, setCustomDatePickerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (date: Date | undefined): string => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (!dateValue) {
      onCustomDateRangeChange({
        from: undefined,
        to: customDateRange?.to,
      });
      return;
    }
    const [year, month, day] = dateValue.split("-").map(Number);
    const date = new Date(year, month - 1, day, 0, 0, 0, 0);
    onCustomDateRangeChange({
      from: date,
      to: customDateRange?.to,
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (!dateValue) {
      onCustomDateRangeChange({
        from: customDateRange?.from,
        to: undefined,
      });
      return;
    }
    const [year, month, day] = dateValue.split("-").map(Number);
    const date = new Date(year, month - 1, day, 23, 59, 59, 999);
    onCustomDateRangeChange({
      from: customDateRange?.from,
      to: date,
    });
  };

  const handlePeriodSelect = (period: string) => {
    if (period === "Custom") {
      setCustomDatePickerOpen(true);
      return;
    }
    onPeriodChange(period);
  };

  const handleApplyCustomDate = () => {
    if (customDateRange?.from && customDateRange?.to) {
      onPeriodChange("Custom");
      setCustomDatePickerOpen(false);
    }
  };

  const handleClearCustomDate = () => {
    onCustomDateRangeChange(undefined);
    onPeriodChange("Last 30 days");
    setCustomDatePickerOpen(false);
  };

  return (
    <div className="relative">
      <div className="join-divider relative z-10 border border-borderColor bg-white rounded-md overflow-hidden">
        <Button
          onClick={onPreviousPeriod}
          variant="ghost"
          size="icon"
          className="join-item h-8 w-8 p-0 border-0 bg-transparent text-textPrimary hover:bg-gray-50"
          aria-label="Previous period"
        >
          <ChevronLeftIcon className="size-4" />
        </Button>
        <Popover
          open={customDatePickerOpen}
          onOpenChange={setCustomDatePickerOpen}
        >
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <PopoverTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="join-item h-8 inline-flex flex-nowrap items-center gap-2 whitespace-nowrap border-0 border-l border-borderColor bg-transparent text-textPrimary hover:bg-gray-50 px-3"
                >
                  <h3 className="text-base font-normal">
                    {selectedPeriod === "Custom" &&
                    customDateRange?.from &&
                    customDateRange?.to
                      ? `${formatDateForDisplay(
                          customDateRange.from
                        )} → ${formatDateForDisplay(customDateRange.to)}`
                      : periodOffset > 0
                      ? `${selectedPeriod} (${periodOffset} ago)`
                      : selectedPeriod}
                  </h3>
                  <ChevronDownIcon className="size-3.5 shrink-0 opacity-30 duration-200" />
                </Button>
              </DropdownMenuTrigger>
            </PopoverTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <div className="px-2 py-1.5 text-xs text-muted-foreground border-b">
                Current time:{" "}
                {new Date().toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
              {periodOptions.map((period) => (
                <React.Fragment key={period}>
                  {period === "Custom" && <DropdownMenuSeparator />}
                  {period === "Custom" ? (
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setDropdownOpen(false);
                        requestAnimationFrame(() => {
                          setTimeout(() => {
                            setCustomDatePickerOpen(true);
                          }, 50);
                        });
                      }}
                      className={selectedPeriod === period ? "bg-accent" : ""}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>Custom</span>
                        <CalendarIcon className="ml-2" size={16} />
                      </div>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => {
                        handlePeriodSelect(period);
                        setDropdownOpen(false);
                      }}
                      className={selectedPeriod === period ? "bg-accent" : ""}
                    >
                      {period}
                    </DropdownMenuItem>
                  )}
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <PopoverContent
            className="w-auto p-0"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="w-full rounded-lg bg-base-100 p-4 shadow-xl ring-1 ring-base-content ring-opacity-5">
              <Calendar
                mode="range"
                selected={customDateRange}
                onSelect={onCustomDateRangeChange}
                numberOfMonths={2}
                defaultMonth={customDateRange?.from || new Date()}
                className="w-full"
              />
              <div className="mt-4 flex items-end justify-between lg:items-center">
                <div className="flex flex-col items-center gap-3 text-sm lg:flex-row lg:gap-10">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">Start</span>
                    <Input
                      type="date"
                      placeholder="YYYY-MM-DD"
                      value={formatDateForInput(customDateRange?.from)}
                      onChange={handleStartDateChange}
                      className="input input-sm w-32 border-base-content/10 placeholder:opacity-60 h-9"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">End</span>
                    <Input
                      type="date"
                      placeholder="YYYY-MM-DD"
                      value={formatDateForInput(customDateRange?.to)}
                      onChange={handleEndDateChange}
                      className="input input-sm w-32 border-base-content/10 placeholder:opacity-60 h-9"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1 lg:gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCustomDate}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApplyCustomDate}
                    disabled={!customDateRange?.from || !customDateRange?.to}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Button
          onClick={onNextPeriod}
          disabled={!canGoNext}
          variant="ghost"
          size="icon"
          className={`join-item h-8 w-8 p-0 border-0 border-l border-borderColor bg-transparent flex items-center justify-center ${
            canGoNext
              ? "text-textPrimary hover:bg-gray-50"
              : "text-textSecondary opacity-30 cursor-not-allowed"
          }`}
          aria-label="Next period"
        >
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
