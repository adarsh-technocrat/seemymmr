import { useState, useEffect, useMemo, useRef } from "react";
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
import {
  fetchAnalytics,
  fetchBreakdown,
  type BreakdownKey,
} from "@/store/slices/analyticsSlice";
import { toApiPeriod } from "@/lib/constants/periods";
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
    },
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
    showVisitorsOnChart: boolean;
  };

  const website = useAppSelector((state) => state.websites.currentWebsite) as {
    _id: string;
    domain: string;
    name: string;
    iconUrl?: string;
    settings?: WebsiteSettings;
  } | null;

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

  const getDateRangeForPeriod = (period: string, offset: number) => {
    let endDate = new Date();
    const periodDays = getPeriodDays(period);

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

  const getAvailableGranularities = (): Array<
    "Hourly" | "Daily" | "Weekly" | "Monthly"
  > => {
    const period = ui.selectedPeriod;
    const daysDiff = currentDateRange
      ? Math.ceil(
          (currentDateRange.endDate.getTime() -
            currentDateRange.startDate.getTime()) /
            (1000 * 60 * 60 * 24),
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
    [ui.selectedPeriod, currentDateRange],
  );

  const passCustomRange = periodOffset !== 0 || ui.selectedPeriod === "Custom";
  const analytics = useAnalytics(websiteId, {
    customDateRange: passCustomRange ? currentDateRange : undefined,
    disableAutoFetch: true,
  });

  const { visitorsNow: realtimeVisitorsNow, isConnected } =
    useRealtimeVisitors(websiteId);

  useEffect(() => {
    if (websiteId) {
      dispatch(fetchWebsiteDetailsById(websiteId));
    }
  }, [websiteId, dispatch]);

  const lastPeriodRef = useRef(ui.selectedPeriod);
  const lastGranularityRef = useRef(ui.selectedGranularity);
  const lastWebsiteIdRef = useRef(websiteId);
  const isPeriodChangingRef = useRef(false);
  const analyticsAbortRef = useRef<AbortController | null>(null);
  const lastBreakdownTabsRef = useRef<{
    source: string;
    path: string;
    location: string;
    system: string;
  } | null>(null);

  useEffect(() => {
    lastBreakdownTabsRef.current = null;
  }, [websiteId]);

  const getApiCustomDateRange = (): { from: Date; to: Date } | undefined => {
    if (
      ui.selectedPeriod === "Custom" &&
      customDateRange?.from &&
      customDateRange?.to
    ) {
      return { from: customDateRange.from, to: customDateRange.to };
    }
    if (periodOffset !== 0 && currentDateRange) {
      return {
        from: currentDateRange.startDate,
        to: currentDateRange.endDate,
      };
    }
    return undefined;
  };

  const getApiPeriod = (): string => toApiPeriod(ui.selectedPeriod);

  const getSignalForNewAnalyticsRequest = (): AbortSignal => {
    analyticsAbortRef.current?.abort();
    const controller = new AbortController();
    analyticsAbortRef.current = controller;
    return controller.signal;
  };

  const getBreakdownKeysForCurrentTabs = (): BreakdownKey[] => [
    ui.selectedSourceTab === "Channel"
      ? "source-channels"
      : ui.selectedSourceTab === "Referrer"
        ? "source-referrer"
        : ui.selectedSourceTab === "Campaign"
          ? "source-campaign"
          : "source-keyword",
    ui.selectedPathTab === "Page"
      ? "path-pages"
      : ui.selectedPathTab === "Hostname"
        ? "path-hostnames"
        : ui.selectedPathTab === "Entry page"
          ? "path-entry-pages"
          : "path-exit-links",
    ui.selectedLocationTab === "Country" || ui.selectedLocationTab === "Map"
      ? "location-country"
      : ui.selectedLocationTab === "Region"
        ? "location-region"
        : "location-city",
    ui.selectedSystemTab === "Browser"
      ? "system-browser"
      : ui.selectedSystemTab === "OS"
        ? "system-os"
        : "system-device",
  ];

  const fetchAnalyticsForCurrentFilters = (
    period: string,
    granularity: "hourly" | "daily" | "weekly" | "monthly",
    apiCustomDateRange: { from: Date; to: Date } | undefined,
    options?: { withSignal?: boolean },
  ) => {
    const signal =
      options?.withSignal !== false
        ? getSignalForNewAnalyticsRequest()
        : undefined;
    dispatch(
      fetchAnalytics({
        websiteId,
        period,
        granularity,
        customDateRange: apiCustomDateRange,
        signal,
      }),
    );
    getBreakdownKeysForCurrentTabs().forEach((breakdown) => {
      dispatch(
        fetchBreakdown({
          websiteId,
          breakdown,
          period,
          customDateRange: apiCustomDateRange,
        }),
      );
    });
  };

  useEffect(() => {
    if (!websiteId) return;

    const websiteChanged = lastWebsiteIdRef.current !== websiteId;
    if (websiteChanged) {
      lastWebsiteIdRef.current = websiteId;
      lastPeriodRef.current = ui.selectedPeriod;
      lastGranularityRef.current = ui.selectedGranularity;
      const granularity = ui.selectedGranularity.toLowerCase() as
        | "hourly"
        | "daily"
        | "weekly"
        | "monthly";
      fetchAnalyticsForCurrentFilters(
        getApiPeriod(),
        granularity,
        getApiCustomDateRange(),
      );
      return;
    }

    const periodChanged = lastPeriodRef.current !== ui.selectedPeriod;
    const dateRangeChanged =
      periodOffset !== 0 ||
      (ui.selectedPeriod === "Custom" &&
        customDateRange?.from &&
        customDateRange?.to);

    if (periodChanged) {
      isPeriodChangingRef.current = true;

      const period = ui.selectedPeriod;
      const daysDiff = currentDateRange
        ? Math.ceil(
            (currentDateRange.endDate.getTime() -
              currentDateRange.startDate.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0;

      let defaultGranularity: "Hourly" | "Daily" | "Weekly" | "Monthly" =
        "Daily";

      if (
        period === "Today" ||
        period === "Yesterday" ||
        period === "Last 24 hours"
      ) {
        defaultGranularity = "Hourly";
      } else if (daysDiff <= 2) {
        defaultGranularity = "Hourly";
      } else if (
        period === "Last 7 days" ||
        period === "Week to date" ||
        (daysDiff > 2 && daysDiff <= 7)
      ) {
        defaultGranularity = "Daily";
      } else if (
        period === "Last 30 days" ||
        period === "Month to date" ||
        (daysDiff > 7 && daysDiff <= 90)
      ) {
        defaultGranularity = "Daily";
      } else if (period === "All time") {
        defaultGranularity = "Weekly";
      } else if (
        period === "Last 12 months" ||
        period === "Year to date" ||
        daysDiff > 90
      ) {
        defaultGranularity = "Weekly";
      }

      const currentGranularityAvailable =
        period === "Today" ||
        period === "Yesterday" ||
        period === "Last 24 hours"
          ? ui.selectedGranularity === "Hourly"
          : daysDiff <= 2
            ? ui.selectedGranularity === "Hourly" ||
              ui.selectedGranularity === "Daily"
            : period === "Last 7 days" ||
                period === "Week to date" ||
                (daysDiff > 2 && daysDiff <= 7)
              ? ui.selectedGranularity === "Daily" ||
                ui.selectedGranularity === "Weekly"
              : period === "Last 30 days" ||
                  period === "Month to date" ||
                  (daysDiff > 7 && daysDiff <= 90)
                ? ui.selectedGranularity === "Daily" ||
                  ui.selectedGranularity === "Weekly" ||
                  ui.selectedGranularity === "Monthly"
                : period === "All time"
                  ? ui.selectedGranularity === "Weekly" ||
                    ui.selectedGranularity === "Monthly"
                  : period === "Last 12 months" ||
                      period === "Year to date" ||
                      daysDiff > 90
                    ? ui.selectedGranularity === "Weekly" ||
                      ui.selectedGranularity === "Monthly"
                    : true;

      if (!currentGranularityAvailable) {
        dispatch(setSelectedGranularity(defaultGranularity));
      }

      const effectiveGranularity = currentGranularityAvailable
        ? ui.selectedGranularity
        : defaultGranularity;

      const granularity = effectiveGranularity.toLowerCase() as
        | "hourly"
        | "daily"
        | "weekly"
        | "monthly";

      fetchAnalyticsForCurrentFilters(
        getApiPeriod(),
        granularity,
        getApiCustomDateRange(),
      );

      lastPeriodRef.current = ui.selectedPeriod;
      lastGranularityRef.current = effectiveGranularity;
      isPeriodChangingRef.current = false;
      return;
    }

    if (dateRangeChanged && !periodChanged) {
      const granularity = ui.selectedGranularity.toLowerCase() as
        | "hourly"
        | "daily"
        | "weekly"
        | "monthly";

      fetchAnalyticsForCurrentFilters(
        getApiPeriod(),
        granularity,
        getApiCustomDateRange(),
      );
    }
  }, [
    websiteId,
    periodOffset,
    dispatch,
    currentDateRange,
    ui.selectedPeriod,
    customDateRange,
  ]);

  useEffect(() => {
    if (isPeriodChangingRef.current) return;

    const needsAdjust =
      availableGranularities.length > 0 &&
      !availableGranularities.includes(ui.selectedGranularity);
    if (needsAdjust) {
      dispatch(setSelectedGranularity(availableGranularities[0]));
    }
  }, [
    availableGranularities,
    ui.selectedGranularity,
    ui.selectedPeriod,
    dispatch,
  ]);

  useEffect(() => {
    if (!websiteId) return;

    if (isPeriodChangingRef.current) {
      return;
    }

    if (lastPeriodRef.current !== ui.selectedPeriod) {
      return;
    }

    const granularityChanged =
      lastGranularityRef.current !== ui.selectedGranularity;

    if (
      granularityChanged &&
      availableGranularities.includes(ui.selectedGranularity)
    ) {
      const granularity = ui.selectedGranularity.toLowerCase() as
        | "hourly"
        | "daily"
        | "weekly"
        | "monthly";

      fetchAnalyticsForCurrentFilters(
        getApiPeriod(),
        granularity,
        getApiCustomDateRange(),
      );

      lastGranularityRef.current = ui.selectedGranularity;
    }
  }, [
    websiteId,
    periodOffset,
    dispatch,
    currentDateRange,
    ui.selectedPeriod,
    customDateRange,
    availableGranularities,
    ui.selectedGranularity,
  ]);

  useEffect(() => {
    if (!websiteId || isPeriodChangingRef.current) return;

    const keys = getBreakdownKeysForCurrentTabs();
    const currentTabs = {
      source: ui.selectedSourceTab,
      path: ui.selectedPathTab,
      location: ui.selectedLocationTab,
      system: ui.selectedSystemTab,
    };

    if (lastBreakdownTabsRef.current === null) {
      lastBreakdownTabsRef.current = currentTabs;
      return;
    }

    const prev = lastBreakdownTabsRef.current;
    const apiCustomDateRange = getApiCustomDateRange();
    const period = getApiPeriod();

    if (prev.source !== currentTabs.source) {
      dispatch(
        fetchBreakdown({
          websiteId,
          breakdown: keys[0],
          period,
          customDateRange: apiCustomDateRange,
        }),
      );
    }
    if (prev.path !== currentTabs.path) {
      dispatch(
        fetchBreakdown({
          websiteId,
          breakdown: keys[1],
          period,
          customDateRange: apiCustomDateRange,
        }),
      );
    }
    if (prev.location !== currentTabs.location) {
      dispatch(
        fetchBreakdown({
          websiteId,
          breakdown: keys[2],
          period,
          customDateRange: apiCustomDateRange,
        }),
      );
    }
    if (prev.system !== currentTabs.system) {
      dispatch(
        fetchBreakdown({
          websiteId,
          breakdown: keys[3],
          period,
          customDateRange: apiCustomDateRange,
        }),
      );
    }

    lastBreakdownTabsRef.current = currentTabs;
  }, [
    websiteId,
    dispatch,
    ui.selectedSourceTab,
    ui.selectedPathTab,
    ui.selectedLocationTab,
    ui.selectedSystemTab,
    ui.selectedPeriod,
    periodOffset,
    customDateRange,
    currentDateRange,
  ]);

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
  };

  const canGoNext = periodOffset > 0;

  const variationFromChange = (pc: string | null | undefined): string =>
    pc != null ? `${pc}%` : "0%";
  const trendFromChange = (pc: string | null | undefined): "up" | "down" => {
    if (pc == null) return "up";
    const n = parseFloat(pc);
    return !Number.isNaN(n) && n < 0 ? "down" : "up";
  };

  const metricsData = useMemo(() => {
    const pc = analytics.percentageChange ?? {};

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
        variation: variationFromChange(pc.totalVisitors),
        trend: trendFromChange(pc.totalVisitors),
      },
      revenue: {
        value: analytics.metrics.revenue,
        variation: variationFromChange(pc.totalRevenue),
        trend: trendFromChange(pc.totalRevenue),
      },
      conversionRate: {
        value: analytics.metrics.conversionRate,
        variation: variationFromChange(pc.conversionRate),
        trend: trendFromChange(pc.conversionRate),
      },
      revenuePerVisitor: {
        value: analytics.metrics.revenuePerVisitor,
        variation: variationFromChange(pc.revenuePerVisitor),
        trend: trendFromChange(pc.revenuePerVisitor),
      },
      bounceRate: {
        value: analytics.metrics.bounceRate,
        variation: variationFromChange(pc.bounceRate),
        trend: trendFromChange(pc.bounceRate),
      },
      sessionTime: {
        value: analytics.metrics.sessionTime,
        variation: variationFromChange(pc.sessionDuration),
        trend: trendFromChange(pc.sessionDuration),
      },
      visitorsNow: { value: analytics.metrics.visitorsNow },
    };
  }, [analytics.metrics, analytics.percentageChange]);

  const chartData = analytics.chartData || [];

  const sourceData = useMemo(() => {
    if (!analytics.breakdowns) return [];
    switch (ui.selectedSourceTab) {
      case "Channel":
        return (
          analytics.breakdowns.source.channels ||
          analytics.breakdowns.source.channel ||
          []
        );
      case "Referrer":
        return analytics.breakdowns.source.referrer || [];
      case "Campaign":
        return analytics.breakdowns.source.campaign || [];
      case "Keyword":
        return analytics.breakdowns.source.keyword || [];
      default:
        return (
          analytics.breakdowns.source.channels ||
          analytics.breakdowns.source.channel ||
          []
        );
    }
  }, [analytics.breakdowns, ui.selectedSourceTab]);

  const pathData = useMemo(() => {
    if (!analytics.breakdowns) return [];
    switch (ui.selectedPathTab) {
      case "Page":
        return analytics.breakdowns.path.pages || [];
      case "Hostname":
        return analytics.breakdowns.path.hostnames || [];
      case "Entry page":
        return analytics.breakdowns.path.entryPages || [];
      case "Exit link":
        return analytics.breakdowns.path.exitLinks || [];
      default:
        return analytics.breakdowns.path.pages || [];
    }
  }, [analytics.breakdowns, ui.selectedPathTab]);

  const locationData = useMemo(() => {
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
  }, [analytics.breakdowns, ui.selectedLocationTab]);

  const systemData = useMemo(() => {
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
  }, [analytics.breakdowns, ui.selectedSystemTab]);

  const visitorsNow =
    realtimeVisitorsNow > 0
      ? realtimeVisitorsNow.toString()
      : metricsData.visitorsNow.value;

  const refetch = () => {
    if (!websiteId) return;
    fetchAnalyticsForCurrentFilters(
      getApiPeriod(),
      ui.selectedGranularity.toLowerCase() as
        | "hourly"
        | "daily"
        | "weekly"
        | "monthly",
      getApiCustomDateRange(),
    );
  };

  return {
    ui,
    website,
    periodOffset,
    customDateRange,
    mentionDialogOpen,
    selectedMentionData,
    canGoNext,
    availableGranularities,
    currentDateRange,

    analytics,
    refetch,
    chartData,
    metricsData,
    revenueBreakdown: analytics.revenueBreakdown,
    sourceData,
    pathData,
    locationData,
    systemData,
    visitorsNow,
    isConnected,

    handlePreviousPeriod,
    handleNextPeriod,
    handlePeriodSelect,
    setCustomDateRange,
    setMentionDialogOpen,
    setSelectedMentionData,

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
