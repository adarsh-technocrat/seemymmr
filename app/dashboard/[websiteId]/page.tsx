"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { type DateRange } from "react-day-picker";
import React, { useState, use, useEffect, useMemo } from "react";
import { useRealtimeVisitors } from "@/hooks/use-realtime-visitors";
import { useAnalytics } from "@/hooks/use-analytics";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setSelectedPeriod,
  setSelectedGranularity,
  setSelectedSourceTab,
  setSelectedPathTab,
  setSelectedLocationTab,
  setSelectedSystemTab,
  setSelectedGoalTab,
  setShowMentionsOnChart,
} from "@/store/slices/uiSlice";
import { fetchWebsiteById } from "@/store/slices/websitesSlice";
import { fetchAnalytics } from "@/store/slices/analyticsSlice";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Chart } from "@/components/chart";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import NumberFlow from "@number-flow/react";
import {
  parseFormattedNumber,
  isPercentage,
  isCurrency,
} from "@/utils/number-utils";
import { isValidObjectId } from "@/utils/validation";
import { useRouter } from "next/navigation";

export default function WebsiteAnalyticsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isValidObjectId(websiteId)) {
      router.push("/dashboard");
    }
  }, [websiteId, router]);

  const ui = useAppSelector((state) => state.ui) as {
    selectedPeriod: string;
    selectedGranularity: "Hourly" | "Daily" | "Weekly" | "Monthly";
    selectedSourceTab: "Channel" | "Referrer" | "Campaign" | "Keyword";
    selectedPathTab: "Hostname" | "Page" | "Entry page" | "Exit link";
    selectedLocationTab: "Map" | "Country" | "Region" | "City";
    selectedSystemTab: "Browser" | "OS" | "Device";
    selectedGoalTab: "Goal" | "Funnel" | "Journey";
    showMentionsOnChart: boolean;
  };
  const website = useAppSelector((state) => state.websites.currentWebsite) as {
    _id: string;
    domain: string;
    name: string;
    iconUrl?: string;
  } | null;

  // Local state for dialogs
  const [mentionDialogOpen, setMentionDialogOpen] = useState(false);
  const [selectedMentionData, setSelectedMentionData] = useState<any>(null);
  const [periodOffset, setPeriodOffset] = useState(0); // Track navigation offset
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(
    {
      from: undefined,
      to: undefined,
    }
  );
  const [customDatePickerOpen, setCustomDatePickerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Available period options
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

  // Calculate the number of days for a period
  const getPeriodDays = (period: string): number => {
    switch (period) {
      case "Today":
        return 1;
      case "Yesterday":
        return 1;
      case "Last 24 hours":
        return 1;
      case "Last 7 days":
        return 7;
      case "Last 30 days":
        return 30;
      case "Last 12 months":
        return 365;
      case "Week to date":
        return 7; // Will be handled specially
      case "Month to date":
        return 30; // Will be handled specially
      case "Year to date":
        return 365; // Will be handled specially
      case "All time":
        return 0; // Special case
      default:
        return 30;
    }
  };

  // Get date range based on period and offset
  const getDateRangeForPeriod = (period: string, offset: number) => {
    let endDate = new Date();
    const periodDays = getPeriodDays(period);

    // Adjust dates based on offset
    if (
      offset !== 0 &&
      period !== "Week to date" &&
      period !== "Month to date" &&
      period !== "Year to date"
    ) {
      endDate.setDate(endDate.getDate() - offset * periodDays);
    }

    let startDate = new Date(endDate);

    switch (period) {
      case "Today":
        if (offset > 0) {
          endDate.setDate(endDate.getDate() - offset);
          startDate = new Date(endDate);
        }
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "Yesterday":
        if (offset > 0) {
          endDate.setDate(endDate.getDate() - offset - 1);
          startDate = new Date(endDate);
        } else {
          endDate.setDate(endDate.getDate() - 1);
          startDate = new Date(endDate);
        }
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "Last 24 hours":
        if (offset > 0) {
          endDate.setTime(endDate.getTime() - offset * 24 * 60 * 60 * 1000);
        }
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "Last 7 days":
        if (offset > 0) {
          endDate.setDate(endDate.getDate() - offset * 7);
        }
        startDate.setDate(endDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "Last 30 days":
        if (offset > 0) {
          endDate.setDate(endDate.getDate() - offset * 30);
        }
        startDate.setDate(endDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "Last 12 months":
        if (offset > 0) {
          endDate.setMonth(endDate.getMonth() - offset * 12);
        }
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 12);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "Week to date":
        // Start of current week (Sunday) to now
        if (offset > 0) {
          endDate.setDate(endDate.getDate() - offset * 7);
        }
        const dayOfWeek = endDate.getDay();
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "Month to date":
        // Start of current month to now
        if (offset > 0) {
          endDate.setMonth(endDate.getMonth() - offset);
        }
        startDate = new Date(endDate);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "Year to date":
        // Start of current year to now
        if (offset > 0) {
          endDate.setFullYear(endDate.getFullYear() - offset);
        }
        startDate = new Date(endDate);
        startDate.setMonth(0);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "All time":
        startDate = new Date(0); // Beginning of time
        if (offset > 0) {
          // For "All time", offset doesn't make sense, but we'll handle it
          endDate = new Date(Date.now() - offset * 365 * 24 * 60 * 60 * 1000);
        }
        break;
      default:
        if (offset > 0) {
          endDate.setDate(endDate.getDate() - offset * periodDays);
        }
        startDate.setDate(endDate.getDate() - periodDays + 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
  };

  // Handle period navigation
  const handlePreviousPeriod = () => {
    // If custom date range is selected, shift the entire range
    if (
      ui.selectedPeriod === "Custom" &&
      customDateRange?.from &&
      customDateRange?.to
    ) {
      const diffInMs =
        customDateRange.to.getTime() - customDateRange.from.getTime();
      const newFrom = new Date(customDateRange.from.getTime() - diffInMs);
      const newTo = new Date(customDateRange.to.getTime() - diffInMs);
      setCustomDateRange({ from: newFrom, to: newTo });
    } else {
      setPeriodOffset((prev) => prev + 1);
    }
  };

  const handleNextPeriod = () => {
    // If custom date range is selected, shift the entire range
    if (
      ui.selectedPeriod === "Custom" &&
      customDateRange?.from &&
      customDateRange?.to
    ) {
      const diffInMs =
        customDateRange.to.getTime() - customDateRange.from.getTime();
      const newFrom = new Date(customDateRange.from.getTime() + diffInMs);
      const newTo = new Date(customDateRange.to.getTime() + diffInMs);
      setCustomDateRange({ from: newFrom, to: newTo });
    } else {
      setPeriodOffset((prev) => Math.max(0, prev - 1));
    }
  };

  const handlePeriodSelect = (period: string) => {
    if (period === "Custom") {
      setCustomDatePickerOpen(true);
      return;
    }
    dispatch(setSelectedPeriod(period));
    setPeriodOffset(0); // Reset offset when changing period type
    setCustomDateRange({ from: undefined, to: undefined });
  };

  const handleCustomDateSelect = (range: DateRange | undefined) => {
    setCustomDateRange(range);
  };

  const handleApplyCustomDate = () => {
    if (customDateRange?.from && customDateRange?.to) {
      dispatch(setSelectedPeriod("Custom"));
      setPeriodOffset(0);
      setCustomDatePickerOpen(false);
    }
  };

  const handleClearCustomDate = () => {
    setCustomDateRange(undefined);
    dispatch(setSelectedPeriod("Last 30 days"));
    setPeriodOffset(0);
    setCustomDatePickerOpen(false);
  };

  // Helper function to format date for input field (YYYY-MM-DD)
  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper function to format date for display (e.g., "Dec 4, 2024")
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
      setCustomDateRange((prev) => ({
        from: undefined,
        to: prev?.to,
      }));
      return;
    }
    // Parse the date string and create a date at local midnight
    const [year, month, day] = dateValue.split("-").map(Number);
    const date = new Date(year, month - 1, day, 0, 0, 0, 0);
    setCustomDateRange((prev) => ({
      from: date,
      to: prev?.to,
    }));
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (!dateValue) {
      setCustomDateRange((prev) => ({
        from: prev?.from,
        to: undefined,
      }));
      return;
    }
    // Parse the date string and create a date at local end of day
    const [year, month, day] = dateValue.split("-").map(Number);
    const date = new Date(year, month - 1, day, 23, 59, 59, 999);
    setCustomDateRange((prev) => ({
      from: prev?.from,
      to: date,
    }));
  };

  // Calculate current date range with offset
  const currentDateRange = useMemo(() => {
    // If custom date range is selected, use it
    if (
      ui.selectedPeriod === "Custom" &&
      customDateRange?.from &&
      customDateRange?.to
    ) {
      return {
        startDate: customDateRange.from,
        endDate: customDateRange.to,
      };
    }
    return getDateRangeForPeriod(ui.selectedPeriod, periodOffset);
  }, [ui.selectedPeriod, periodOffset, customDateRange]);

  // Check if we can go to next period (only if offset > 0)
  const canGoNext = periodOffset > 0;

  // Use analytics hook with custom date range support (after currentDateRange is defined)
  const analytics = useAnalytics(websiteId, {
    customDateRange: currentDateRange,
    disableAutoFetch: true, // We'll handle fetching manually with offset support
  });

  // Real-time visitors hook
  const { visitorsNow: realtimeVisitorsNow, isConnected } =
    useRealtimeVisitors(websiteId);

  // Fetch website data on mount
  useEffect(() => {
    if (websiteId) {
      dispatch(fetchWebsiteById(websiteId));
    }
  }, [websiteId, dispatch]);

  // Fetch analytics when period offset changes (useAnalytics only responds to selectedPeriod)
  useEffect(() => {
    if (!websiteId) return;

    const { startDate, endDate } = currentDateRange;
    const granularity = ui.selectedGranularity.toLowerCase() as
      | "hourly"
      | "daily"
      | "weekly"
      | "monthly";

    dispatch(
      fetchAnalytics({
        websiteId,
        startDate,
        endDate,
        granularity,
      })
    );
  }, [
    websiteId,
    periodOffset,
    dispatch,
    currentDateRange,
    ui.selectedGranularity,
  ]);

  // Get chart data from Redux - use empty array if no data
  const chartData = analytics.chartData || [];

  // Get metrics from Redux or use defaults
  const metricsData = analytics.metrics
    ? {
        visitors: {
          value: analytics.metrics.visitors,
          variation: "0%",
          trend: "up" as "up" | "down",
        },
        revenue: {
          value: analytics.metrics.revenue,
          variation: "0%",
          trend: "up" as "up" | "down",
        },
        conversionRate: {
          value: analytics.metrics.conversionRate,
          variation: "0%",
          trend: "up" as "up" | "down",
        },
        revenuePerVisitor: {
          value: analytics.metrics.revenuePerVisitor,
          variation: "0%",
          trend: "up" as "up" | "down",
        },
        bounceRate: {
          value: analytics.metrics.bounceRate,
          variation: "0%",
          trend: "up" as "up" | "down",
        },
        sessionTime: {
          value: analytics.metrics.sessionTime,
          variation: "0%",
          trend: "up" as "up" | "down",
        },
        visitorsNow: { value: analytics.metrics.visitorsNow },
      }
    : {
        visitors: { value: "0", variation: "0%", trend: "up" as "up" | "down" },
        revenue: { value: "$0", variation: "0%", trend: "up" as "up" | "down" },
        conversionRate: {
          value: "0%",
          variation: "0%",
          trend: "up" as "up" | "down",
        },
        revenuePerVisitor: {
          value: "$0",
          variation: "0%",
          trend: "up" as "up" | "down",
        },
        bounceRate: {
          value: "0%",
          variation: "0%",
          trend: "up" as "up" | "down",
        },
        sessionTime: {
          value: "0m 0s",
          variation: "0%",
          trend: "up" as "up" | "down",
        },
        visitorsNow: { value: "0" },
      };

  // Get breakdown data from Redux
  const getSourceData = () => {
    if (!analytics.breakdowns) return [];
    switch (ui.selectedSourceTab) {
      case "Channel":
        return analytics.breakdowns.source.channel || [];
      case "Referrer":
        return analytics.breakdowns.source.referrer || [];
      case "Campaign":
        return analytics.breakdowns.source.campaign || [];
      case "Keyword":
        return analytics.breakdowns.source.keyword || [];
      default:
        return analytics.breakdowns.source.channel || [];
    }
  };

  const getPathData = () => {
    if (!analytics.breakdowns) return [];
    switch (ui.selectedPathTab) {
      case "Page":
        return analytics.breakdowns.path.page || [];
      case "Hostname":
        return analytics.breakdowns.path.hostname || [];
      default:
        return analytics.breakdowns.path.page || [];
    }
  };

  const getLocationData = () => {
    if (!analytics.breakdowns) return [];
    switch (ui.selectedLocationTab) {
      case "Country":
        return analytics.breakdowns.location.country || [];
      case "Region":
        return analytics.breakdowns.location.region || [];
      case "City":
        return analytics.breakdowns.location.city || [];
      default:
        return analytics.breakdowns.location.country || [];
    }
  };

  const getSystemData = () => {
    if (!analytics.breakdowns) return [];
    switch (ui.selectedSystemTab) {
      case "Browser":
        return analytics.breakdowns.system.browser || [];
      case "OS":
        return analytics.breakdowns.system.os || [];
      case "Device":
        return analytics.breakdowns.system.device || [];
      default:
        return analytics.breakdowns.system.browser || [];
    }
  };

  const sourceData = getSourceData();
  const pathData = getPathData();
  const locationData = getLocationData();
  const systemData = getSystemData();

  const COLORS = ["#8dcdff", "#7888b2", "#E16540", "#94a3b8", "#cbd5e1"];

  const visitorsNow =
    realtimeVisitorsNow > 0
      ? realtimeVisitorsNow.toString()
      : metricsData.visitorsNow.value;

  return (
    <>
      <main className="mx-auto min-h-screen max-w-6xl px-4 pb-32 md:px-8 bg-background">
        {/* Top Controls Section */}
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center mt-6">
          <div className="flex w-full flex-col items-center gap-4 sm:flex-row">
            {/* Website Selector */}
            <div className="relative inline-block shrink-0">
              <div className="join-divider border border-borderColor bg-white rounded-md overflow-hidden">
                <button className="btn join-item btn-sm h-8 inline-flex shrink-0 flex-nowrap items-center gap-2 whitespace-nowrap border-0 bg-transparent text-textPrimary hover:bg-gray-50 px-3">
                  <Image
                    src="https://icons.duckduckgo.com/ip3/uxmagic.ai.ico"
                    alt="uxmagic.ai"
                    className="size-5! rounded"
                    width={20}
                    height={20}
                    unoptimized
                  />
                  <h3 className="text-base font-normal">
                    {website?.name || "Loading..."}
                  </h3>
                </button>
                <Link
                  href={`/dashboard/${websiteId}/settings`}
                  className="btn btn-square join-item btn-sm h-8 w-8 p-0 border-0 border-l border-borderColor bg-transparent text-textPrimary hover:bg-gray-50 flex items-center justify-center"
                >
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
                    className="lucide lucide-settings size-4"
                  >
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </Link>
              </div>
            </div>

            {/* Period Selector */}
            <div className="relative">
              <div className="join-divider relative z-10 border border-borderColor bg-white rounded-md overflow-hidden">
                <button
                  onClick={handlePreviousPeriod}
                  className="btn btn-square btn-ghost join-item btn-sm h-8 w-8 p-0 border-0 bg-transparent text-textPrimary hover:bg-gray-50 flex items-center justify-center"
                  aria-label="Previous period"
                >
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
                    className="lucide lucide-chevron-left size-4"
                  >
                    <path d="m15 18-6-6 6-6"></path>
                  </svg>
                </button>
                <Popover
                  open={customDatePickerOpen}
                  onOpenChange={setCustomDatePickerOpen}
                >
                  <DropdownMenu
                    open={dropdownOpen}
                    onOpenChange={setDropdownOpen}
                  >
                    <PopoverTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <button className="btn join-item btn-sm h-8 inline-flex flex-nowrap items-center gap-2 whitespace-nowrap border-0 border-l border-borderColor bg-transparent text-textPrimary hover:bg-gray-50 px-3">
                          <h3 className="text-base font-normal">
                            {ui.selectedPeriod === "Custom" &&
                            customDateRange?.from &&
                            customDateRange?.to
                              ? `${formatDateForDisplay(
                                  customDateRange.from
                                )} → ${formatDateForDisplay(
                                  customDateRange.to
                                )}`
                              : periodOffset > 0
                              ? `${ui.selectedPeriod} (${periodOffset} ago)`
                              : ui.selectedPeriod}
                          </h3>
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
                        </button>
                      </DropdownMenuTrigger>
                    </PopoverTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {/* Current time display */}
                      <div className="px-2 py-1.5 text-xs text-muted-foreground border-b">
                        Current time:{" "}
                        {new Date().toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </div>
                      {periodOptions.map((period, index) => (
                        <React.Fragment key={period}>
                          {period === "Custom" && <DropdownMenuSeparator />}
                          {period === "Custom" ? (
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                setDropdownOpen(false);
                                // Use requestAnimationFrame to ensure dropdown closes before popover opens
                                requestAnimationFrame(() => {
                                  setTimeout(() => {
                                    setCustomDatePickerOpen(true);
                                  }, 50);
                                });
                              }}
                              className={
                                ui.selectedPeriod === period ? "bg-accent" : ""
                              }
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>Custom</span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="ml-2"
                                >
                                  <rect
                                    width="18"
                                    height="18"
                                    x="3"
                                    y="4"
                                    rx="2"
                                    ry="2"
                                  />
                                  <line x1="16" x2="16" y1="2" y2="6" />
                                  <line x1="8" x2="8" y1="2" y2="6" />
                                  <line x1="3" x2="21" y1="10" y2="10" />
                                </svg>
                              </div>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => {
                                handlePeriodSelect(period);
                                setDropdownOpen(false);
                              }}
                              className={
                                ui.selectedPeriod === period ? "bg-accent" : ""
                              }
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
                        onSelect={handleCustomDateSelect}
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
                            className="btn btn-ghost btn-sm h-9"
                          >
                            Clear
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleApplyCustomDate}
                            disabled={
                              !customDateRange?.from || !customDateRange?.to
                            }
                            className="btn btn-primary btn-sm h-9"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <button
                  onClick={handleNextPeriod}
                  disabled={!canGoNext}
                  className={`btn btn-square btn-ghost join-item btn-sm h-8 w-8 p-0 border-0 border-l border-borderColor bg-transparent flex items-center justify-center ${
                    canGoNext
                      ? "text-textPrimary hover:bg-gray-50"
                      : "text-textSecondary opacity-30 cursor-not-allowed"
                  }`}
                  aria-label="Next period"
                >
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
                    className="lucide lucide-chevron-right size-4"
                  >
                    <path d="m9 18 6-6-6-6"></path>
                  </svg>
                </button>
              </div>
            </div>

            {/* Granularity Selector */}
            <div className="hidden sm:block">
              <div className="relative h-8">
                <button className="single-item-join-divider btn btn-sm h-8 inline-flex shrink-0 flex-nowrap items-center gap-2 whitespace-nowrap border border-borderColor bg-white text-textPrimary hover:bg-gray-50 rounded-md px-3">
                  <span className="text-base font-normal">
                    {ui.selectedGranularity}
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
                </button>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              className="single-item-join-divider group btn btn-square btn-sm h-8 w-8 max-md:hidden border border-borderColor bg-white text-textPrimary hover:bg-gray-50 rounded-md p-0 flex items-center justify-center"
              title="Refresh analytics data (Cmd+R / Ctrl+R)"
              onClick={() => analytics.refetch()}
              disabled={analytics.loading}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="size-4"
              >
                <path
                  fillRule="evenodd"
                  d="M13.836 2.477a.75.75 0 0 1 .75.75v3.182a.75.75 0 0 1-.75.75h-3.182a.75.75 0 0 1 0-1.5h1.37l-.84-.841a4.5 4.5 0 0 0-7.08.932.75.75 0 0 1-1.3-.75 6 6 0 0 1 9.44-1.242l.842.84V3.227a.75.75 0 0 1 .75-.75Zm-.911 7.5A.75.75 0 0 1 13.199 10a6 6 0 0 1-9.44 1.241l-.84-.84v1.371a.75.75 0 0 1-1.5 0V8.591a.75.75 0 0 1 .75-.75H5.35a.75.75 0 0 1 0 1.5H3.98l.841.841a4.5 4.5 0 0 0 7.08-.932.75.75 0 0 1 1.025-.273Z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
          </div>
        </section>

        {/* Analytics Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Main Analytics Card - Full Width */}
          <div className="md:col-span-2">
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="flex-1">
                <section className="custom-card group">
                  {/* Metrics List */}
                  <ul className="grid grid-cols-3 flex-col overflow-x-scroll border-0 border-textPrimary/5 p-4 pb-6 max-md:gap-4 sm:flex-row md:flex lg:pb-4">
                    <li>
                      <div className="flex flex-col items-start gap-1 border-textPrimary/5 md:mr-6 md:border-r md:pr-6 select-none">
                        <div className="flex cursor-pointer items-center gap-1.5">
                          <input
                            className="checkbox size-4 rounded checkbox-secondary"
                            type="checkbox"
                            defaultChecked
                          />
                          <div className="text-textSecondary whitespace-nowrap text-xs md:text-sm">
                            Visitors
                          </div>
                        </div>
                        <div className="flex flex-col items-start">
                          <div className="whitespace-nowrap text-xl font-bold md:text-[1.65rem] md:leading-9 text-textPrimary">
                            <NumberFlow
                              value={parseFormattedNumber(
                                metricsData.visitors.value
                              )}
                              format={{ notation: "compact" }}
                            />
                          </div>
                          <div className="flex w-full flex-1 items-center gap-1 leading-none duration-150">
                            <span className="text-textSecondary text-xs opacity-80">
                              {metricsData.visitors.variation}
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                              className={`size-3 ${
                                metricsData.visitors.trend === "down"
                                  ? "text-red-500 dark:text-red-700"
                                  : "text-green-500 dark:text-green-600 rotate-180"
                              }`}
                              strokeWidth="2"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8 2a.75.75 0 0 1 .75.75v8.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.22 3.22V2.75A.75.75 0 0 1 8 2Z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="flex flex-col items-start gap-1 border-textPrimary/5 md:mr-6 md:border-r md:pr-6 select-none">
                        <div className="flex cursor-pointer items-center gap-1.5">
                          <input
                            className="checkbox size-4 rounded"
                            type="checkbox"
                            defaultChecked
                            style={
                              {
                                "--chkbg": "#e78468",
                                "--chkfg": "#ffffff",
                                borderColor: "rgb(231, 132, 104)",
                              } as React.CSSProperties
                            }
                          />
                          <div className="text-textSecondary whitespace-nowrap text-xs md:text-sm">
                            Revenue
                          </div>
                        </div>
                        <div className="flex flex-col items-start">
                          <div className="whitespace-nowrap text-xl font-bold md:text-[1.65rem] md:leading-9 text-textPrimary">
                            <NumberFlow
                              value={parseFormattedNumber(
                                metricsData.revenue.value
                              )}
                              format={{
                                style: "currency",
                                currency: "USD",
                                notation: "compact",
                                trailingZeroDisplay: "stripIfInteger",
                              }}
                            />
                          </div>
                          <div className="flex w-full flex-1 items-center gap-1 leading-none duration-150">
                            <span className="text-textSecondary text-xs opacity-80">
                              {metricsData.revenue.variation}
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                              className={`size-3 ${
                                metricsData.revenue.trend === "down"
                                  ? "text-red-500 dark:text-red-700"
                                  : "text-green-500 dark:text-green-600 rotate-180"
                              }`}
                              strokeWidth="2"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8 2a.75.75 0 0 1 .75.75v8.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.22 3.22V2.75A.75.75 0 0 1 8 2Z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="flex flex-col items-start gap-1 border-textPrimary/5 md:mr-6 md:border-r md:pr-6">
                        <div className="text-textSecondary whitespace-nowrap text-xs md:text-sm">
                          Conversion rate
                        </div>
                        <div className="flex flex-col items-start">
                          <div className="whitespace-nowrap text-xl font-bold md:text-[1.65rem] md:leading-9 text-textPrimary">
                            <NumberFlow
                              value={parseFormattedNumber(
                                metricsData.conversionRate.value
                              )}
                              format={{
                                style: "percent",
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 2,
                              }}
                            />
                          </div>
                          <div className="flex w-full flex-1 items-center gap-1 leading-none duration-150">
                            <span className="text-textSecondary text-xs opacity-80">
                              {metricsData.conversionRate.variation}
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                              className={`size-3 ${
                                metricsData.conversionRate.trend === "down"
                                  ? "text-red-500 dark:text-red-700"
                                  : "text-green-500 dark:text-green-600 rotate-180"
                              }`}
                              strokeWidth="2"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8 2a.75.75 0 0 1 .75.75v8.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.22 3.22V2.75A.75.75 0 0 1 8 2Z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="flex flex-col items-start gap-1 border-textPrimary/5 md:mr-6 md:border-r md:pr-6">
                        <div className="text-textSecondary whitespace-nowrap text-xs md:text-sm">
                          Revenue/visitor
                        </div>
                        <div className="flex flex-col items-start">
                          <div className="whitespace-nowrap text-xl font-bold md:text-[1.65rem] md:leading-9 text-textPrimary">
                            <div className="flex items-baseline gap-2">
                              <NumberFlow
                                value={parseFormattedNumber(
                                  metricsData.revenuePerVisitor.value
                                )}
                                format={{
                                  style: "currency",
                                  currency: "USD",
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex w-full flex-1 items-center gap-1 leading-none duration-150">
                            <span className="text-textSecondary text-xs opacity-80">
                              {metricsData.revenuePerVisitor.variation}
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                              className={`size-3 ${
                                metricsData.revenuePerVisitor.trend === "down"
                                  ? "text-red-500 dark:text-red-700"
                                  : "text-green-500 dark:text-green-600 rotate-180"
                              }`}
                              strokeWidth="2"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8 2a.75.75 0 0 1 .75.75v8.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.22 3.22V2.75A.75.75 0 0 1 8 2Z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="flex flex-col items-start gap-1 border-textPrimary/5 md:mr-6 md:border-r md:pr-6">
                        <div className="text-textSecondary whitespace-nowrap text-xs md:text-sm">
                          Bounce rate
                        </div>
                        <div className="flex flex-col items-start">
                          <div className="whitespace-nowrap text-xl font-bold md:text-[1.65rem] md:leading-9 text-textPrimary">
                            <NumberFlow
                              value={parseFormattedNumber(
                                metricsData.bounceRate.value
                              )}
                              format={{
                                style: "percent",
                                maximumFractionDigits: 0,
                              }}
                            />
                          </div>
                          <div className="flex w-full flex-1 items-center gap-1 leading-none duration-150">
                            <span className="text-textSecondary text-xs opacity-80">
                              {metricsData.bounceRate.variation}
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                              className={`size-3 ${
                                metricsData.bounceRate.trend === "down"
                                  ? "text-red-500 dark:text-red-700"
                                  : "text-green-500 dark:text-green-600"
                              }`}
                              strokeWidth="2"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8 2a.75.75 0 0 1 .75.75v8.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.22 3.22V2.75A.75.75 0 0 1 8 2Z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="flex flex-col items-start gap-1 border-textPrimary/5 md:mr-6 md:border-r md:pr-6">
                        <div className="text-textSecondary whitespace-nowrap text-xs md:text-sm">
                          Session time
                        </div>
                        <div className="flex flex-col items-start">
                          <div className="whitespace-nowrap text-xl font-bold md:text-[1.65rem] md:leading-9 text-textPrimary">
                            {metricsData.sessionTime.value}
                          </div>
                          <div className="flex w-full flex-1 items-center gap-1 leading-none duration-150">
                            <span className="text-textSecondary text-xs opacity-80">
                              {metricsData.sessionTime.variation}
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                              className={`size-3 ${
                                metricsData.sessionTime.trend === "down"
                                  ? "text-red-500 dark:text-red-700"
                                  : "text-green-500 dark:text-green-600 rotate-180"
                              }`}
                              strokeWidth="2"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8 2a.75.75 0 0 1 .75.75v8.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.22 3.22V2.75A.75.75 0 0 1 8 2Z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="flex flex-col items-start gap-1 border-0! select-none cursor-pointer group/metric">
                        <div className="flex items-center gap-0">
                          <div className="text-textSecondary whitespace-nowrap text-xs md:text-sm duration-100">
                            Visitors now
                          </div>
                          <span className="relative ml-1.5 inline-flex size-2">
                            <span
                              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                                isConnected ? "bg-green-500" : "bg-gray-400"
                              }`}
                            ></span>
                            <span
                              className={`relative inline-flex size-2 rounded-full ${
                                isConnected ? "bg-green-500" : "bg-gray-400"
                              }`}
                            ></span>
                          </span>
                        </div>
                        <div className="relative flex flex-col items-start overflow-hidden">
                          <div className="absolute w-full animate-dropIn transition-transform duration-100 ease-in-out">
                            <div className="whitespace-nowrap text-xl font-bold md:text-[1.65rem] md:leading-9 text-textPrimary">
                              <NumberFlow
                                value={parseInt(visitorsNow) || 0}
                                format={{ notation: "standard" }}
                              />
                            </div>
                          </div>
                          <div className="opacity-0">
                            <div className="whitespace-nowrap text-xl font-bold md:text-[1.65rem] md:leading-9 text-textPrimary">
                              <NumberFlow
                                value={parseInt(visitorsNow) || 0}
                                format={{ notation: "standard" }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>

                  {/* Chart */}
                  <div className="px-4 pb-4">
                    <Chart
                      data={chartData}
                      showMentions={ui.showMentionsOnChart}
                      onMentionClick={(data) => {
                        setSelectedMentionData(data);
                        setMentionDialogOpen(true);
                      }}
                      height="h-72 md:h-96"
                    />
                  </div>
                </section>
              </div>
            </div>
          </div>

          {/* Source Card */}
          <section className="custom-card" id="Source">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-x-2 border-b border-textPrimary/5 px-1 py-1">
                <div className="flex items-baseline gap-0">
                  <div role="tablist" className="tabs tabs-sm ml-1">
                    {(
                      ["Channel", "Referrer", "Campaign", "Keyword"] as const
                    ).map((tab) => (
                      <button
                        key={tab}
                        role="tab"
                        className={`tab h-8! px-2! font-medium duration-100 ${
                          ui.selectedSourceTab === tab
                            ? "tab-active text-textPrimary"
                            : "text-textSecondary opacity-50 hover:text-textPrimary hover:opacity-80"
                        }`}
                        onClick={() => dispatch(setSelectedSourceTab(tab))}
                      >
                        <div className="flex items-center gap-1.5">{tab}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-0">
                  <button className="group btn btn-ghost btn-xs inline-flex flex-nowrap items-center gap-0.5 px-1.5! text-xs! font-medium! border-borderColor bg-white text-textPrimary hover:bg-gray-50">
                    <span className="-mr-0.5 inline-block max-w-20! truncate">
                      All
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="size-3.5 opacity-50 duration-200 group-hover:opacity-100"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="relative h-96">
                <ResponsiveContainer width="100%" height="100%">
                  {ui.selectedSourceTab === "Channel" ? (
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sourceData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  ) : (
                    <BarChart data={sourceData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#ccc"
                        opacity={0.3}
                      />
                      <XAxis dataKey="name" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8dcdff" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Path Card */}
          <section className="custom-card" id="Path">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-x-2 border-b border-textPrimary/5 px-1 py-1">
                <div className="flex items-baseline gap-0">
                  <div role="tablist" className="tabs tabs-sm ml-1">
                    {(
                      ["Hostname", "Page", "Entry page", "Exit link"] as const
                    ).map((tab) => (
                      <button
                        key={tab}
                        role="tab"
                        className={`tab h-8! px-2! font-medium duration-100 ${
                          ui.selectedPathTab === tab
                            ? "tab-active text-textPrimary"
                            : "text-textSecondary opacity-50 hover:text-textPrimary hover:opacity-80"
                        }`}
                        onClick={() => dispatch(setSelectedPathTab(tab))}
                      >
                        <div className="flex items-center gap-1.5">{tab}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-0">
                  <button className="group btn btn-ghost btn-xs inline-flex flex-nowrap items-center gap-0.5 px-1.5! text-xs! font-medium! border-borderColor bg-white text-textPrimary hover:bg-gray-50">
                    <span className="-mr-0.5 inline-block max-w-20! truncate">
                      All
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="size-3.5 opacity-50 duration-200 group-hover:opacity-100"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="relative h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pathData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ccc"
                      opacity={0.3}
                    />
                    <XAxis type="number" stroke="#666" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#666"
                      width={100}
                    />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8dcdff" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Location Card */}
          <section className="custom-card" id="Location">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-x-2 border-b border-textPrimary/5 px-1 py-1">
                <div className="flex items-baseline gap-0">
                  <div role="tablist" className="tabs tabs-sm ml-1">
                    {(["Map", "Country", "Region", "City"] as const).map(
                      (tab) => (
                        <button
                          key={tab}
                          role="tab"
                          className={`tab h-8! px-2! font-medium duration-100 ${
                            ui.selectedLocationTab === tab
                              ? "tab-active text-textPrimary"
                              : "text-textSecondary opacity-50 hover:text-textPrimary hover:opacity-80"
                          }`}
                          onClick={() => dispatch(setSelectedLocationTab(tab))}
                        >
                          <div className="flex items-center gap-1.5">{tab}</div>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
              <div className="relative h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={locationData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ccc"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#666"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#666" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8dcdff" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* System Card */}
          <section className="custom-card" id="System">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-x-2 border-b border-textPrimary/5 px-1 py-1">
                <div className="flex items-baseline gap-0">
                  <div role="tablist" className="tabs tabs-sm ml-1">
                    {(["Browser", "OS", "Device"] as const).map((tab) => (
                      <button
                        key={tab}
                        role="tab"
                        className={`tab h-8! px-2! font-medium duration-100 ${
                          ui.selectedSystemTab === tab
                            ? "tab-active text-textPrimary"
                            : "text-textSecondary opacity-50 hover:text-textPrimary hover:opacity-80"
                        }`}
                        onClick={() => dispatch(setSelectedSystemTab(tab))}
                      >
                        <div className="flex items-center gap-1.5">{tab}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="relative h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={systemData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ccc"
                      opacity={0.3}
                    />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8dcdff" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Custom Event/Goal Card - Full Width */}
          <div className="md:col-span-2">
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
                              ui.selectedGoalTab === tab
                                ? "tab-active text-textPrimary"
                                : "text-textSecondary opacity-50 group-hover:text-textPrimary group-hover:opacity-80"
                            }`}
                            onClick={() => dispatch(setSelectedGoalTab(tab))}
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
                      <Link
                        href="/docs/custom-goals"
                        className="btn btn-primary btn-sm bg-primary hover:bg-[#d15a38] text-white"
                        target="_blank"
                      >
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
          </div>
        </div>
      </main>

      {/* Mentions Dialog */}
      <Dialog open={mentionDialogOpen} onOpenChange={setMentionDialogOpen}>
        <DialogContent className="flex h-dvh w-full max-w-md flex-col overflow-hidden bg-gray-100 p-0 md:h-[65vh] md:rounded-xl">
          <DialogHeader className="mb-2 flex items-center justify-between border-b border-gray-200 bg-white px-4 pt-4">
            <DialogTitle className="text-textSecondary text-sm font-medium uppercase tracking-wider">
              {selectedMentionData?.fullDate || selectedMentionData?.date}
            </DialogTitle>
            <button
              onClick={() => setMentionDialogOpen(false)}
              className="btn btn-circle btn-ghost btn-sm"
            >
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
                className="lucide lucide-x size-5 md:size-4"
              >
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>
          </DialogHeader>
          <div className="relative flex flex-1 flex-col overflow-hidden px-3">
            <Tabs defaultValue="mentions" className="flex flex-1 flex-col">
              <TabsList className="hidden w-full grid-cols-3 rounded-xl bg-gray-200/50 p-1 shadow-inner">
                <TabsTrigger
                  value="notes"
                  className="flex cursor-pointer select-none items-center justify-center rounded-lg px-2 py-1.5 text-sm font-medium text-textSecondary"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="mr-1.5 size-4 shrink-0 max-sm:hidden"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V6.621a1.5 1.5 0 0 0-.44-1.06L9.94 2.439A1.5 1.5 0 0 0 8.878 2H4Zm1 5.75A.75.75 0 0 1 5.75 7h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 5 7.75Zm0 3a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  Notes (0)
                </TabsTrigger>
                <TabsTrigger
                  value="mentions"
                  className="flex cursor-pointer select-none items-center justify-center rounded-lg px-2 py-1.5 text-sm font-medium text-textPrimary animate-popup bg-white shadow"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="mr-1.5 size-4 shrink-0 max-sm:hidden"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 2C4.262 2 1 4.57 1 8c0 1.86.98 3.486 2.455 4.566a3.472 3.472 0 0 1-.469 1.26.75.75 0 0 0 .713 1.14 6.961 6.961 0 0 0 3.06-1.06c.403.062.818.094 1.241.094 3.738 0 7-2.57 7-6s-3.262-6-7-6ZM5 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm7-1a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM8 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  Mentions ({selectedMentionData?.mentions?.length || 0})
                </TabsTrigger>
                <TabsTrigger
                  value="commits"
                  className="flex cursor-pointer select-none items-center justify-center rounded-lg px-2 py-1.5 text-sm font-medium text-textSecondary"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1 size-4 shrink-0 max-sm:hidden"
                  >
                    <circle cx="12" cy="12" r="3"></circle>
                    <line x1="3" x2="9" y1="12" y2="12"></line>
                    <line x1="15" x2="21" y1="12" y2="12"></line>
                  </svg>
                  Commits (0)
                </TabsTrigger>
              </TabsList>
              <div className="pointer-events-none absolute -bottom-4 left-0 right-0 z-10 h-4 bg-gradient-to-b from-gray-100 via-gray-100/80 to-transparent"></div>
              <div className="relative flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="mentions" className="p-4 pb-8 m-0 flex-1">
                    <div className="-mx-1 space-y-3 px-1">
                      {selectedMentionData?.mentions?.map(
                        (mention: any, idx: number) => (
                          <div key={idx} className="custom-card">
                            <div className="flex items-start gap-3 p-4">
                              {mention.type === "profile" ? (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shrink-0 text-white font-semibold">
                                  {mention.text?.charAt(0)?.toUpperCase() ||
                                    "?"}
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
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
                                    className="text-textSecondary"
                                  >
                                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                  </svg>
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-sm text-textPrimary leading-relaxed">
                                  {mention.text}
                                  {mention.url && (
                                    <a
                                      href={mention.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline ml-1"
                                    >
                                      {mention.url}
                                    </a>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                      {(!selectedMentionData?.mentions ||
                        selectedMentionData.mentions.length === 0) && (
                        <div className="text-center py-8 text-textSecondary">
                          No mentions for this date
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="notes" className="p-4 pb-8 m-0">
                    <div className="text-center py-8 text-textSecondary">
                      No notes for this date
                    </div>
                  </TabsContent>
                  <TabsContent value="commits" className="p-4 pb-8 m-0">
                    <div className="text-center py-8 text-textSecondary">
                      No commits for this date
                    </div>
                  </TabsContent>
                </div>
              </div>
            </Tabs>
          </div>
          <div className="shrink-0 border-t border-gray-200 bg-white px-2 py-1">
            <label className="flex cursor-pointer items-center justify-start gap-2 px-2 py-2">
              <input
                className="toggle toggle-xs"
                type="checkbox"
                checked={ui.showMentionsOnChart}
                onChange={(e) =>
                  dispatch(setShowMentionsOnChart(e.target.checked))
                }
              />
              <span className="text-xs text-textPrimary">
                Show mentions on chart
              </span>
            </label>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
