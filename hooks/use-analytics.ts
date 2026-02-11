import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAnalytics } from "@/store/slices/analyticsSlice";

export function useAnalytics(
  websiteId: string,
  options?: {
    customDateRange?: { startDate: Date; endDate: Date };
    disableAutoFetch?: boolean;
    period?: string; // Optional period override
    granularity?: "hourly" | "daily" | "weekly" | "monthly"; // Optional granularity override
  },
) {
  const dispatch = useAppDispatch();
  const analytics = useAppSelector((state) => {
    const websiteData = state.analytics.byWebsiteId[websiteId];
    if (websiteData) {
      return websiteData;
    }
    return {
      chartData: [],
      metrics: null,
      revenueBreakdown: null,
      breakdowns: null,
      loading: false,
      error: null,
      lastFetched: null,
      currentStartDate: null,
      currentEndDate: null,
      currentGranularity: "daily" as const,
    };
  });
  const selectedPeriod = useAppSelector((state) => state.ui.selectedPeriod);
  const selectedGranularity = useAppSelector(
    (state) => state.ui.selectedGranularity,
  );

  const period = options?.period ?? selectedPeriod;
  const granularity = options?.granularity ?? selectedGranularity;
  const analyticsAbortRef = useRef<AbortController | null>(null);

  const getSignalForNewAnalyticsRequest = (): AbortSignal => {
    analyticsAbortRef.current?.abort();
    const controller = new AbortController();
    analyticsAbortRef.current = controller;
    return controller.signal;
  };

  const getDateRange = (period: string) => {
    let endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case "Today":
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;
      case "Yesterday":
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "Last 24 hours":
        endDate = new Date();
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case "Last 7 days":
        endDate = new Date();
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "Last 30 days":
        endDate = new Date();
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "Last 12 months":
        endDate = new Date();
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 12);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "Week to date":
        endDate = new Date();
        const dayOfWeek = endDate.getDay();
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "Month to date":
        endDate = new Date();
        startDate = new Date(endDate);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "Year to date":
        endDate = new Date();
        startDate = new Date(endDate);
        startDate.setMonth(0);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "All time":
        endDate = new Date();
        startDate = new Date(0);
        break;
      default:
        endDate = new Date();
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
  };

  const getGranularity = (
    granularity: string,
  ): "hourly" | "daily" | "weekly" | "monthly" => {
    switch (granularity.toLowerCase()) {
      case "hourly":
        return "hourly";
      case "daily":
        return "daily";
      case "weekly":
        return "weekly";
      case "monthly":
        return "monthly";
      default:
        return "daily";
    }
  };

  useEffect(() => {
    if (!websiteId || options?.disableAutoFetch) return;

    const granularityValue = getGranularity(granularity);
    const customDateRange = options?.customDateRange
      ? {
          from: options.customDateRange.startDate,
          to: options.customDateRange.endDate,
        }
      : undefined;

    // If customDateRange is provided, use "Custom" period
    const periodToUse = customDateRange ? "Custom" : period;

    dispatch(
      fetchAnalytics({
        websiteId,
        period: periodToUse,
        granularity: granularityValue,
        customDateRange,
        signal: getSignalForNewAnalyticsRequest(),
      }),
    );
  }, [
    websiteId,
    period,
    granularity,
    dispatch,
    options?.customDateRange,
    options?.disableAutoFetch,
  ]);

  return {
    ...analytics,
    refetch: () => {
      if (!websiteId) return;
      const granularityValue = getGranularity(granularity);
      const customDateRange = options?.customDateRange
        ? {
            from: options.customDateRange.startDate,
            to: options.customDateRange.endDate,
          }
        : undefined;
      // If customDateRange is provided, use "Custom" period
      const periodToUse = customDateRange ? "Custom" : period;
      dispatch(
        fetchAnalytics({
          websiteId,
          period: periodToUse,
          granularity: granularityValue,
          customDateRange,
          signal: getSignalForNewAnalyticsRequest(),
        }),
      );
    },
  };
}
