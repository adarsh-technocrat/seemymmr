import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export const fetchAnalytics = createAsyncThunk(
  "analytics/fetchAnalytics",
  async (
    {
      websiteId,
      period,
      granularity = "daily",
      customDateRange,
    }: {
      websiteId: string;
      period: string;
      granularity?: "hourly" | "daily" | "weekly" | "monthly";
      customDateRange?: { from: Date; to: Date };
    },
    { rejectWithValue }
  ) => {
    try {
      let apiPeriod = period;
      if (period === "Custom" && customDateRange?.from && customDateRange?.to) {
        const fromStr = customDateRange.from.toISOString().split("T")[0];
        const toStr = customDateRange.to.toISOString().split("T")[0];
        apiPeriod = `custom:${fromStr}:${toStr}`;
      }

      const params = new URLSearchParams({
        period: apiPeriod,
        granularity,
      });

      const response = await fetch(
        `/api/websites/${websiteId}/analytics?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      return { ...data, period, granularity };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

interface ChartDataPoint {
  date: string;
  fullDate?: string;
  timestamp?: string;
  visitors: number;
  revenue: number;
  revenueNew?: number;
  revenueRefund?: number;
  revenuePerVisitor?: number;
  conversionRate?: number;
  hasMention?: boolean;
  mentions?: Array<{
    text: string;
    url?: string;
    type: "profile" | "gear";
  }>;
}

interface BreakdownData {
  name: string;
  uv: number; // Unique visitors
  revenue?: number; // Revenue in cents
  image?: string; // Image URL (for system and location breakdowns)
  flag?: string; // Flag emoji (for location breakdowns)
  conversionRate?: number;
  goalCount?: number;
  goalConversionRate?: number;
  hostname?: string; // For path breakdowns
}

interface WebsiteAnalytics {
  chartData: ChartDataPoint[];
  metrics: {
    visitors: string;
    revenue: string;
    conversionRate: string;
    revenuePerVisitor: string;
    bounceRate: string;
    sessionTime: string;
    visitorsNow: string;
  } | null;
  revenueBreakdown: {
    newRevenue: number;
    renewalRevenue: number;
    refundedRevenue: number;
  } | null;
  breakdowns: {
    source: {
      channel: BreakdownData[];
      referrer: BreakdownData[];
      campaign: BreakdownData[];
      keyword: BreakdownData[];
    };
    path: {
      pages: BreakdownData[];
      hostnames: BreakdownData[];
      entryPages: BreakdownData[];
    };
    location: {
      country: BreakdownData[];
      region: BreakdownData[];
      city: BreakdownData[];
    };
    system: {
      browser: BreakdownData[];
      os: BreakdownData[];
      device: BreakdownData[];
    };
  } | null;
  loading: boolean;
  error: string | null;
  lastFetched: string | null;
  currentStartDate: string | null;
  currentEndDate: string | null;
  currentGranularity: "hourly" | "daily" | "weekly" | "monthly";
}

interface AnalyticsState {
  // Store analytics data per websiteId
  byWebsiteId: Record<string, WebsiteAnalytics>;
  // Global loading state (true if any website is loading)
  loading: boolean;
  // Current website being viewed (for backward compatibility)
  currentWebsiteId: string | null;
}

const createEmptyWebsiteAnalytics = (): WebsiteAnalytics => ({
  chartData: [],
  metrics: null,
  revenueBreakdown: null,
  breakdowns: null,
  loading: false,
  error: null,
  lastFetched: null,
  currentStartDate: null,
  currentEndDate: null,
  currentGranularity: "daily",
});

const initialState: AnalyticsState = {
  byWebsiteId: {},
  loading: false,
  currentWebsiteId: null,
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    clearAnalytics: (state, action?: PayloadAction<string | undefined>) => {
      if (action?.payload) {
        // Clear specific website
        delete state.byWebsiteId[action.payload];
      } else {
        // Clear all
        state.byWebsiteId = {};
      }
      state.currentWebsiteId = null;
    },
    setGranularity: (
      state,
      action: PayloadAction<{
        websiteId: string;
        granularity: "hourly" | "daily" | "weekly" | "monthly";
      }>
    ) => {
      const websiteData = state.byWebsiteId[action.payload.websiteId];
      if (websiteData) {
        websiteData.currentGranularity = action.payload.granularity;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state, action) => {
        const websiteId = action.meta.arg.websiteId;
        if (!state.byWebsiteId[websiteId]) {
          state.byWebsiteId[websiteId] = createEmptyWebsiteAnalytics();
        }
        state.byWebsiteId[websiteId].loading = true;
        state.byWebsiteId[websiteId].error = null;
        // Set global loading to true if any website is loading
        state.loading = Object.values(state.byWebsiteId).some(
          (data) => data.loading
        );
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        const websiteId = action.meta.arg.websiteId;
        if (!state.byWebsiteId[websiteId]) {
          state.byWebsiteId[websiteId] = createEmptyWebsiteAnalytics();
        }

        const websiteData = state.byWebsiteId[websiteId];
        websiteData.loading = false;
        websiteData.error = null;
        websiteData.lastFetched = new Date().toISOString();
        const processedData = action.payload.processedData || [];

        websiteData.chartData = processedData.map((item: any) => {
          return {
            date: item.name,
            fullDate: formatFullDate(item.timestamp),
            timestamp: item.timestamp,
            visitors: item.visitors ?? 0,
            revenue: (item.revenue ?? 0) + (item.renewalRevenue ?? 0), // Total revenue
            revenueNew: item.revenue ?? 0,
            revenueRenewal: item.renewalRevenue ?? 0,
            revenueRefund: item.refundedRevenue ?? 0,
            revenuePerVisitor:
              (item.visitors ?? 0) > 0
                ? ((item.revenue ?? 0) + (item.renewalRevenue ?? 0)) /
                  (item.visitors ?? 1)
                : 0,
            conversionRate: 0, // Will be calculated if needed
          };
        });

        // Store metrics from totals
        websiteData.metrics = {
          visitors: formatNumber(action.payload.totalVisitors || 0),
          revenue: formatCurrency((action.payload.totalRevenue || 0) * 100), // Convert to cents
          conversionRate: action.payload.conversionRate
            ? `${action.payload.conversionRate.toFixed(2)}%`
            : "0%",
          revenuePerVisitor: action.payload.revenuePerVisitor
            ? formatCurrency((action.payload.revenuePerVisitor || 0) * 100)
            : "$0.00",
          bounceRate: action.payload.bounceRate
            ? `${action.payload.bounceRate.toFixed(0)}%`
            : "0%",
          sessionTime: action.payload.sessionDuration
            ? formatDuration(action.payload.sessionDuration)
            : "0m 0s",
          visitorsNow: "0", // TODO: Get from real-time if available
        };

        // Store revenue breakdown
        websiteData.revenueBreakdown = {
          newRevenue: action.payload.totalNewRevenue || 0,
          renewalRevenue: action.payload.totalRenewalRevenue || 0,
          refundedRevenue: action.payload.totalRefundedRevenue || 0,
        };

        if (action.payload.breakdowns) {
          websiteData.breakdowns = {
            source: {
              channel: action.payload.breakdowns.source?.channel || [],
              referrer: action.payload.breakdowns.source?.referrer || [],
              campaign: action.payload.breakdowns.source?.campaign || [],
              keyword: action.payload.breakdowns.source?.keyword || [],
            },
            path: {
              pages: action.payload.breakdowns.path?.pages || [],
              hostnames: action.payload.breakdowns.path?.hostnames || [],
              entryPages: action.payload.breakdowns.path?.entryPages || [],
            },
            location: {
              country: action.payload.breakdowns.location?.country || [],
              region: action.payload.breakdowns.location?.region || [],
              city: action.payload.breakdowns.location?.city || [],
            },
            system: {
              browser: action.payload.breakdowns.system?.browser || [],
              os: action.payload.breakdowns.system?.os || [],
              device: action.payload.breakdowns.system?.device || [],
            },
          };
        } else {
          websiteData.breakdowns = null;
        }

        websiteData.currentStartDate = null;
        websiteData.currentEndDate = null;
        websiteData.currentGranularity = action.meta.arg.granularity || "daily";

        // Update global state
        state.currentWebsiteId = websiteId;
        state.loading = Object.values(state.byWebsiteId).some(
          (data) => data.loading
        );
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        const websiteId = action.meta.arg.websiteId;
        if (!state.byWebsiteId[websiteId]) {
          state.byWebsiteId[websiteId] = createEmptyWebsiteAnalytics();
        }
        state.byWebsiteId[websiteId].loading = false;
        state.byWebsiteId[websiteId].error = action.payload as string;
        // Update global loading state
        state.loading = Object.values(state.byWebsiteId).some(
          (data) => data.loading
        );
      });
  },
});

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toString();
}

function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000000) {
    return "$" + (dollars / 1000000).toFixed(1) + "M";
  }
  if (dollars >= 1000) {
    return "$" + (dollars / 1000).toFixed(1) + "k";
  }
  return "$" + dollars.toFixed(2);
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

export const { clearAnalytics, setGranularity } = analyticsSlice.actions;
export default analyticsSlice.reducer;
