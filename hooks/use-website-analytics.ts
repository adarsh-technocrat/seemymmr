import { useState, useEffect, useMemo } from "react";
import { type DateRange } from "react-day-picker";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setSelectedPeriod,
  setSelectedGranularity,
  setSelectedSourceTab,
  setSelectedPathTab,
  setSelectedLocationTab,
  setSelectedSystemTab,
  setSelectedGoalTab,
} from "@/store/slices/uiSlice";
import { fetchWebsiteDetailsById } from "@/store/slices/websitesSlice";
import { fetchAnalytics } from "@/store/slices/analyticsSlice";
import { useAnalytics } from "@/hooks/use-analytics";
import { useRealtimeVisitors } from "@/hooks/use-realtime-visitors";
import type { ChartDataPoint } from "@/components/chart";

interface UseWebsiteAnalyticsProps {
  websiteId: string;
}

export interface WebsiteSettings {
  currency?: string;
  excludeIps?: string[];
  excludeCountries?: string[];
  excludeHostnames?: string[];
  excludePaths?: string[];
  hashPaths?: boolean;
  trackScroll?: boolean;
  trackUserIdentification?: boolean;
  timezone?: string;
  colorScheme?: string;
  nickname?: string;
  additionalDomains?: string[];
  publicDashboard?: {
    enabled: boolean;
    shareId?: string;
  };
  attackMode?: {
    enabled: boolean;
    autoActivate: boolean;
    threshold?: number;
    activatedAt?: Date;
  };
  primaryGoalId?: string;
}

export function useWebsiteAnalytics({ websiteId }: UseWebsiteAnalyticsProps) {
  const dispatch = useAppDispatch();
  const [periodOffset, setPeriodOffset] = useState(0);
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(
    {
      from: undefined,
      to: undefined,
    }
  );
  const [mentionDialogOpen, setMentionDialogOpen] = useState(false);
  const [selectedMentionData, setSelectedMentionData] =
    useState<ChartDataPoint | null>(null);

  const ui = useAppSelector((state) => state.ui) as {
    selectedPeriod: string;
    selectedGranularity: "Hourly" | "Daily" | "Weekly" | "Monthly";
    selectedSourceTab: "Channel" | "Referrer" | "Campaign" | "Keyword";
    selectedPathTab: "Hostname" | "Page" | "Entry page" | "Exit link";
    selectedLocationTab: "Map" | "Country" | "Region" | "City";
    selectedSystemTab: "Browser" | "OS" | "Device";
    selectedGoalTab: "Goal" | "Funnel" | "Journey";
    showMentionsOnChart: boolean;
    showRevenueOnChart: boolean;
  };

  const website = useAppSelector((state) => state.websites.currentWebsite) as {
    _id: string;
    domain: string;
    name: string;
    iconUrl?: string;
    settings?: WebsiteSettings;
  } | null;

  // Calculate the number of days for a period
  const getPeriodDays = (period: string): number => {
    switch (period) {
      case "Today":
      case "Yesterday":
      case "Last 24 hours":
        return 1;
      case "Last 7 days":
        return 7;
      case "Last 30 days":
        return 30;
      case "Last 12 months":
        return 365;
      case "Week to date":
        return 7;
      case "Month to date":
        return 30;
      case "Year to date":
        return 365;
      case "All time":
        return 0;
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
        if (offset > 0) {
          endDate.setDate(endDate.getDate() - offset * 7);
        }
        const dayOfWeek = endDate.getDay();
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "Month to date":
        if (offset > 0) {
          endDate.setMonth(endDate.getMonth() - offset);
        }
        startDate = new Date(endDate);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "Year to date":
        if (offset > 0) {
          endDate.setFullYear(endDate.getFullYear() - offset);
        }
        startDate = new Date(endDate);
        startDate.setMonth(0);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "All time":
        startDate = new Date(0);
        if (offset > 0) {
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

  // Calculate current date range with offset
  const currentDateRange = useMemo(() => {
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

  // Get available granularity options based on selected period
  const getAvailableGranularities = (): Array<
    "Hourly" | "Daily" | "Weekly" | "Monthly"
  > => {
    const period = ui.selectedPeriod;
    const daysDiff = currentDateRange
      ? Math.ceil(
          (currentDateRange.endDate.getTime() -
            currentDateRange.startDate.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    if (
      period === "Today" ||
      period === "Yesterday" ||
      period === "Last 24 hours"
    ) {
      return ["Hourly"];
    }

    if (daysDiff <= 2) {
      return ["Hourly", "Daily"];
    }

    if (
      period === "Last 7 days" ||
      period === "Week to date" ||
      (daysDiff > 2 && daysDiff <= 7)
    ) {
      return ["Daily", "Weekly"];
    }

    if (
      period === "Last 30 days" ||
      period === "Month to date" ||
      (daysDiff > 7 && daysDiff <= 90)
    ) {
      return ["Daily", "Weekly", "Monthly"];
    }

    if (period === "All time") {
      return ["Weekly", "Monthly"];
    }

    if (
      period === "Last 12 months" ||
      period === "Year to date" ||
      daysDiff > 90
    ) {
      return ["Weekly", "Monthly"];
    }

    return ["Daily", "Weekly", "Monthly"];
  };

  const availableGranularities = useMemo(
    () => getAvailableGranularities(),
    [ui.selectedPeriod, currentDateRange]
  );

  // Use analytics hook
  const analytics = useAnalytics(websiteId, {
    customDateRange: currentDateRange,
    disableAutoFetch: true,
  });

  // Real-time visitors hook
  const { visitorsNow: realtimeVisitorsNow, isConnected } =
    useRealtimeVisitors(websiteId);

  // Fetch website data on mount
  useEffect(() => {
    if (websiteId) {
      dispatch(fetchWebsiteDetailsById(websiteId));
    }
  }, [websiteId, dispatch]);

  // Fetch analytics when period offset changes
  useEffect(() => {
    if (!websiteId) return;

    // Use the selected granularity (user can choose Weekly or Monthly for "All time")
    const granularity = ui.selectedGranularity.toLowerCase() as
      | "hourly"
      | "daily"
      | "weekly"
      | "monthly";

    // If we have a custom date range (from offset or custom selection), use it
    // Otherwise, use the period directly
    let apiCustomDateRange: { from: Date; to: Date } | undefined;
    let period = ui.selectedPeriod;

    if (
      ui.selectedPeriod === "Custom" &&
      customDateRange?.from &&
      customDateRange?.to
    ) {
      // Custom date range is already set
      apiCustomDateRange = {
        from: customDateRange.from,
        to: customDateRange.to,
      };
    } else if (periodOffset !== 0) {
      // Use offset to calculate custom date range
      const { startDate, endDate } = currentDateRange;
      apiCustomDateRange = { from: startDate, to: endDate };
    }

    dispatch(
      fetchAnalytics({
        websiteId,
        period,
        granularity,
        customDateRange: apiCustomDateRange,
      })
    );
  }, [
    websiteId,
    periodOffset,
    dispatch,
    currentDateRange,
    ui.selectedGranularity,
    ui.selectedPeriod,
    customDateRange,
  ]);

  // Auto-adjust granularity if current selection is not available
  // This must run before the fetch effect to prevent duplicate calls
  useEffect(() => {
    if (
      availableGranularities.length > 0 &&
      !availableGranularities.includes(ui.selectedGranularity)
    ) {
      // Use the first available granularity (for "All time" it will be "Weekly")
      dispatch(setSelectedGranularity(availableGranularities[0]));
    }
  }, [
    availableGranularities,
    ui.selectedGranularity,
    ui.selectedPeriod,
    dispatch,
  ]);

  // Period navigation handlers
  const handlePreviousPeriod = () => {
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
    dispatch(setSelectedPeriod(period));
    setPeriodOffset(0);
    if (period !== "Custom") {
      setCustomDateRange({ from: undefined, to: undefined });
    }
    // Granularity will be auto-adjusted by the useEffect if needed
  };

  const canGoNext = periodOffset > 0;

  // Get breakdown data
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

  // Transform metrics data
  const metricsData = useMemo(() => {
    if (!analytics.metrics) {
      return {
        visitors: { value: "0", variation: "0%", trend: "up" as const },
        revenue: { value: "$0", variation: "0%", trend: "up" as const },
        conversionRate: { value: "0%", variation: "0%", trend: "up" as const },
        revenuePerVisitor: {
          value: "$0",
          variation: "0%",
          trend: "up" as const,
        },
        bounceRate: { value: "0%", variation: "0%", trend: "up" as const },
        sessionTime: {
          value: "0m 0s",
          variation: "0%",
          trend: "up" as const,
        },
        visitorsNow: { value: "0" },
      };
    }

    return {
      visitors: {
        value: analytics.metrics.visitors,
        variation: "0%",
        trend: "up" as const,
      },
      revenue: {
        value: analytics.metrics.revenue,
        variation: "0%",
        trend: "up" as const,
      },
      conversionRate: {
        value: analytics.metrics.conversionRate,
        variation: "0%",
        trend: "up" as const,
      },
      revenuePerVisitor: {
        value: analytics.metrics.revenuePerVisitor,
        variation: "0%",
        trend: "up" as const,
      },
      bounceRate: {
        value: analytics.metrics.bounceRate,
        variation: "0%",
        trend: "up" as const,
      },
      sessionTime: {
        value: analytics.metrics.sessionTime,
        variation: "0%",
        trend: "up" as const,
      },
      visitorsNow: { value: analytics.metrics.visitorsNow },
    };
  }, [analytics.metrics]);

  const chartData = analytics.chartData || [];
  const sourceData = getSourceData();
  const pathData = getPathData();
  const locationData = getLocationData();
  const systemData = getSystemData();

  const visitorsNow =
    realtimeVisitorsNow > 0
      ? realtimeVisitorsNow.toString()
      : metricsData.visitorsNow.value;

  return {
    // State
    ui,
    website,
    periodOffset,
    customDateRange,
    mentionDialogOpen,
    selectedMentionData,
    canGoNext,
    availableGranularities,
    currentDateRange,

    // Data
    analytics,
    chartData,
    metricsData,
    revenueBreakdown: analytics.revenueBreakdown,
    sourceData,
    pathData,
    locationData,
    systemData,
    visitorsNow,
    isConnected,

    // Handlers
    handlePreviousPeriod,
    handleNextPeriod,
    handlePeriodSelect,
    setCustomDateRange,
    setMentionDialogOpen,
    setSelectedMentionData,

    // Tab handlers
    setSelectedSourceTab: (tab: string) =>
      dispatch(setSelectedSourceTab(tab as typeof ui.selectedSourceTab)),
    setSelectedPathTab: (tab: string) =>
      dispatch(setSelectedPathTab(tab as typeof ui.selectedPathTab)),
    setSelectedLocationTab: (tab: string) =>
      dispatch(setSelectedLocationTab(tab as typeof ui.selectedLocationTab)),
    setSelectedSystemTab: (tab: string) =>
      dispatch(setSelectedSystemTab(tab as typeof ui.selectedSystemTab)),
    setSelectedGoalTab: (tab: string) =>
      dispatch(setSelectedGoalTab(tab as typeof ui.selectedGoalTab)),
    setSelectedGranularity: (granularity: typeof ui.selectedGranularity) =>
      dispatch(setSelectedGranularity(granularity)),
  };
}
