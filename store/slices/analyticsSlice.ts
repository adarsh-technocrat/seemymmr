import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  BREAKDOWN_KEYS,
  type BreakdownKey,
} from "@/lib/constants/analytics-breakdowns";

export const ABORTED_PAYLOAD = "__analytics_aborted__";

export { BREAKDOWN_KEYS };
export type { BreakdownKey };

export const fetchAnalytics = createAsyncThunk(
  "analytics/fetchAnalytics",
  async (
    {
      websiteId,
      period,
      granularity = "daily",
      customDateRange,
      signal,
    }: {
      websiteId: string;
      period: string;
      granularity?: "hourly" | "daily" | "weekly" | "monthly";
      customDateRange?: { from: Date; to: Date };
      signal?: AbortSignal;
    },
    { rejectWithValue },
  ) => {
    try {
      let apiPeriod = period;
      if (customDateRange?.from && customDateRange?.to) {
        const fromStr = customDateRange.from.toISOString().split("T")[0];
        const toStr = customDateRange.to.toISOString().split("T")[0];
        apiPeriod = `custom:${fromStr}:${toStr}`;
      }

      const params = new URLSearchParams({
        period: apiPeriod,
        granularity,
      });

      const response = await fetch(
        `/api/websites/${websiteId}/analytics?${params.toString()}`,
        { signal },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      return { ...data, period, granularity };
    } catch (error: any) {
      if (error?.name === "AbortError") {
        return rejectWithValue(ABORTED_PAYLOAD);
      }
      return rejectWithValue(error?.message ?? "Failed to fetch analytics");
    }
  },
);

export const fetchBreakdown = createAsyncThunk(
  "analytics/fetchBreakdown",
  async (
    {
      websiteId,
      breakdown,
      period,
      customDateRange,
      signal,
    }: {
      websiteId: string;
      breakdown: BreakdownKey;
      period: string;
      customDateRange?: { from: Date; to: Date };
      signal?: AbortSignal;
    },
    { rejectWithValue },
  ) => {
    const params = new URLSearchParams({ period });
    if (customDateRange?.from && customDateRange?.to) {
      params.set("startDate", customDateRange.from.toISOString());
      params.set("endDate", customDateRange.to.toISOString());
    }
    const response = await fetch(
      `/api/websites/${websiteId}/analytics/breakdowns/${breakdown}?${params.toString()}`,
      { signal },
    );
    if (!response.ok) {
      throw new Error("Failed to fetch breakdown");
    }
    const data = await response.json();
    const list = data.data ?? [];
    return { websiteId, breakdown, data: list };
  },
);

interface ChartDataPoint {
  date: string;
  fullDate?: string;
  timestamp?: string;
  visitors: number;
  revenue: number;
  revenueNew?: number;
  revenueRenewal?: number;
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
  uv: number;
  revenue?: number;
  image?: string;
  flag?: string;
  conversionRate?: number;
  goalCount?: number;
  goalConversionRate?: number;
  hostname?: string;
}

export type PercentageChangeMap = Record<string, string | null>;

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
  percentageChange: PercentageChangeMap | null;
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
      channels?: BreakdownData[];
    };
    path: {
      pages: BreakdownData[];
      hostnames: BreakdownData[];
      entryPages: BreakdownData[];
      exitLinks: BreakdownData[];
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
  byWebsiteId: Record<string, WebsiteAnalytics>;
  breakdownsByWebsiteId: Record<
    string,
    NonNullable<WebsiteAnalytics["breakdowns"]> | null
  >;
  loading: boolean;
  currentWebsiteId: string | null;
}

function getEmptyBreakdowns(): WebsiteAnalytics["breakdowns"] {
  return {
    source: {
      channel: [],
      referrer: [],
      campaign: [],
      keyword: [],
      channels: [],
    },
    path: {
      pages: [],
      hostnames: [],
      entryPages: [],
      exitLinks: [],
    },
    location: {
      country: [],
      region: [],
      city: [],
    },
    system: {
      browser: [],
      os: [],
      device: [],
    },
  };
}

const createEmptyWebsiteAnalytics = (): WebsiteAnalytics => ({
  chartData: [],
  metrics: null,
  percentageChange: null,
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
  breakdownsByWebsiteId: {},
  loading: false,
  currentWebsiteId: null,
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    clearAnalytics: (state, action?: PayloadAction<string | undefined>) => {
      if (action?.payload) {
        delete state.byWebsiteId[action.payload];
        delete state.breakdownsByWebsiteId[action.payload];
      } else {
        state.byWebsiteId = {};
        state.breakdownsByWebsiteId = {};
      }
      state.currentWebsiteId = null;
    },
    setGranularity: (
      state,
      action: PayloadAction<{
        websiteId: string;
        granularity: "hourly" | "daily" | "weekly" | "monthly";
      }>,
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
        state.loading = Object.values(state.byWebsiteId).some(
          (data) => data.loading,
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
            visitors: item.visitors,
            revenue: (item.revenue ?? 0) + (item.renewalRevenue ?? 0),
            revenueNew: item.revenue,
            revenueRenewal: item.renewalRevenue,
            revenueRefund: item.refundedRevenue,
            revenuePerVisitor:
              (item.visitors ?? 0) > 0
                ? ((item.revenue ?? 0) + (item.renewalRevenue ?? 0)) /
                  (item.visitors ?? 1)
                : 0,
            conversionRate: 0,
          };
        });

        websiteData.metrics = {
          visitors: formatNumber(action.payload.totalVisitors || 0),
          revenue: formatCurrency((action.payload.totalRevenue || 0) * 100),
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
          visitorsNow: "0",
        };

        websiteData.percentageChange = action.payload.percentageChange ?? null;

        websiteData.revenueBreakdown = {
          newRevenue: action.payload.totalNewRevenue || 0,
          renewalRevenue: action.payload.totalRenewalRevenue || 0,
          refundedRevenue: action.payload.totalRefundedRevenue || 0,
        };

        websiteData.currentStartDate = null;
        websiteData.currentEndDate = null;
        websiteData.currentGranularity = action.meta.arg.granularity || "daily";

        state.currentWebsiteId = websiteId;
        state.loading = Object.values(state.byWebsiteId).some(
          (data) => data.loading,
        );
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        const websiteId = action.meta.arg.websiteId;
        if (!state.byWebsiteId[websiteId]) {
          state.byWebsiteId[websiteId] = createEmptyWebsiteAnalytics();
        }
        state.byWebsiteId[websiteId].loading = false;
        if (action.payload !== ABORTED_PAYLOAD) {
          state.byWebsiteId[websiteId].error = action.payload as string;
        }
        state.loading = Object.values(state.byWebsiteId).some(
          (data) => data.loading,
        );
      })
      .addCase(fetchBreakdown.fulfilled, (state, action) => {
        const { websiteId, breakdown, data } = action.payload;
        if (state.breakdownsByWebsiteId[websiteId] == null) {
          state.breakdownsByWebsiteId[websiteId] = getEmptyBreakdowns();
        }
        const b = state.breakdownsByWebsiteId[websiteId]!;
        const list = Array.isArray(data) ? data : [];
        switch (breakdown) {
          case "source-channel":
            b.source.channel = list;
            break;
          case "source-referrer":
            b.source.referrer = list;
            break;
          case "source-campaign":
            b.source.campaign = list;
            break;
          case "source-keyword":
            b.source.keyword = list;
            break;
          case "source-channels":
            b.source.channels = list;
            break;
          case "path-pages":
            b.path.pages = list;
            break;
          case "path-hostnames":
            b.path.hostnames = list;
            break;
          case "path-entry-pages":
            b.path.entryPages = list;
            break;
          case "path-exit-links":
            b.path.exitLinks = list;
            break;
          case "location-country":
            b.location.country = list;
            break;
          case "location-region":
            b.location.region = list;
            break;
          case "location-city":
            b.location.city = list;
            break;
          case "system-browser":
            b.system.browser = list;
            break;
          case "system-os":
            b.system.os = list;
            break;
          case "system-device":
            b.system.device = list;
            break;
        }
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
