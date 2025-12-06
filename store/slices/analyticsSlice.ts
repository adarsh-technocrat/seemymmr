import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

// API service function
export const fetchAnalytics = createAsyncThunk(
  "analytics/fetchAnalytics",
  async (
    {
      websiteId,
      startDate,
      endDate,
      granularity = "daily",
    }: {
      websiteId: string;
      startDate: Date;
      endDate: Date;
      granularity?: "hourly" | "daily" | "weekly" | "monthly";
    },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        granularity,
      });

      const response = await fetch(
        `/api/websites/${websiteId}/analytics?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

interface ChartDataPoint {
  date: string;
  fullDate?: string;
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
  value: number;
}

interface AnalyticsState {
  // Chart data
  chartData: ChartDataPoint[];
  // Metrics
  metrics: {
    visitors: string;
    revenue: string;
    conversionRate: string;
    revenuePerVisitor: string;
    bounceRate: string;
    sessionTime: string;
    visitorsNow: string;
  } | null;
  // Breakdowns
  breakdowns: {
    source: {
      channel: BreakdownData[];
      referrer: BreakdownData[];
      campaign: BreakdownData[];
      keyword: BreakdownData[];
    };
    path: {
      page: BreakdownData[];
      hostname: BreakdownData[];
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
  // Loading and error states
  loading: boolean;
  error: string | null;
  lastFetched: string | null;
  // Current filters
  currentWebsiteId: string | null;
  currentStartDate: string | null; // ISO string for serialization
  currentEndDate: string | null; // ISO string for serialization
  currentGranularity: "hourly" | "daily" | "weekly" | "monthly";
}

const initialState: AnalyticsState = {
  chartData: [],
  metrics: null,
  breakdowns: null,
  loading: false,
  error: null,
  lastFetched: null,
  currentWebsiteId: null,
  currentStartDate: null,
  currentEndDate: null,
  currentGranularity: "daily",
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    clearAnalytics: (state) => {
      state.chartData = [];
      state.metrics = null;
      state.breakdowns = null;
      state.error = null;
      state.lastFetched = null;
    },
    setGranularity: (
      state,
      action: PayloadAction<"hourly" | "daily" | "weekly" | "monthly">
    ) => {
      state.currentGranularity = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.lastFetched = new Date().toISOString();

        // Merge visitors and revenue data into chart format
        const visitors = action.payload.visitors || [];
        const revenue = action.payload.revenue || [];

        // Create a map of dates for efficient lookup
        const dateMap = new Map<string, ChartDataPoint>();

        // Process visitors data
        visitors.forEach((item: any) => {
          const date = item.date || item._id;
          if (!dateMap.has(date)) {
            dateMap.set(date, {
              date: formatDate(date),
              fullDate: formatFullDate(date),
              visitors: item.count || 0,
              revenue: 0,
              revenueNew: 0,
              revenueRefund: 0,
            });
          } else {
            const existing = dateMap.get(date)!;
            existing.visitors = item.count || 0;
          }
        });

        revenue.forEach((item: any) => {
          const date = item.date || item._id;
          const revenueDollars = (item.revenue || 0) / 100;
          const revenueNewDollars =
            (item.revenueNew || item.revenue || 0) / 100;
          const revenueRefundDollars = (item.revenueRefund || 0) / 100;

          if (!dateMap.has(date)) {
            dateMap.set(date, {
              date: formatDate(date),
              fullDate: formatFullDate(date),
              visitors: 0,
              revenue: revenueDollars,
              revenueNew: revenueNewDollars,
              revenueRefund: revenueRefundDollars,
            });
          } else {
            const existing = dateMap.get(date)!;
            existing.revenue = revenueDollars;
            existing.revenueNew = revenueNewDollars;
            existing.revenueRefund = revenueRefundDollars;
          }
        });

        // Convert map to array and sort by date
        state.chartData = Array.from(dateMap.values())
          .map((point) => ({
            ...point,
            revenuePerVisitor:
              point.visitors > 0 ? point.revenue / point.visitors : 0,
            conversionRate: 0, // Will be calculated if needed
          }))
          .sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA.getTime() - dateB.getTime();
          });

        // Store metrics
        state.metrics = action.payload.metrics || null;

        // Store breakdowns
        state.breakdowns = action.payload.breakdowns || null;

        // Store current filters (convert Date objects to ISO strings for serialization)
        state.currentWebsiteId = action.meta.arg.websiteId;
        state.currentStartDate = action.meta.arg.startDate.toISOString();
        state.currentEndDate = action.meta.arg.endDate.toISOString();
        state.currentGranularity = action.meta.arg.granularity || "daily";
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Helper functions
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "short" });
  return `${day} ${month}`;
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export const { clearAnalytics, setGranularity } = analyticsSlice.actions;
export default analyticsSlice.reducer;
