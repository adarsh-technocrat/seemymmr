export interface VisitBucket {
  count: number;
  percentage: number;
  totalRevenue: number;
}

export interface VisitsToConversion {
  distribution: Record<string, VisitBucket>;
  average: number;
  median: number;
}

export interface TimeToConversion {
  distribution: Record<string, VisitBucket>;
  averageHours: number;
  medianHours: number;
}

export interface HourlyCell {
  count: number;
  revenue: number;
  averageValue: number;
  _id?: string;
}

export interface PurchaseTimePatterns {
  peakDayHour: { day: string; hour: number; count: number };
  hourlyDistribution: Record<string, HourlyCell>;
  peakDay: string;
  peakHour: number;
}

export interface DimensionRow {
  visitors: number;
  conversions: number;
  conversionRate: number;
  totalRevenue: number;
  averageValue: number;
  averageVisitsToConversion?: number;
  _id?: string;
}

export interface CustomEventRow {
  count: number;
  totalConversions: number;
  conversionRate: number;
  averageTimeToConversion: number;
  description: string;
  totalRevenue: number;
  averageValue: number;
  _id?: string;
}

export interface ConversionMetricsPayload {
  visitsToConversion: VisitsToConversion;
  timeToConversion: TimeToConversion;
  purchaseTimePatterns: PurchaseTimePatterns;
  dimensions: {
    devices: Record<string, DimensionRow>;
    operatingSystems: Record<string, DimensionRow>;
    browsers: Record<string, DimensionRow>;
    countries: Record<string, DimensionRow>;
    referrers: Record<string, Omit<DimensionRow, "averageVisitsToConversion" | "_id">>;
  };
  timeRange: { startDate: string; endDate: string };
  websiteId: string;
  totalVisitors: number;
  totalConversions: number;
  baselineConversionRate: number;
  baselineAverageValue: number;
  totalRevenue: number;
  averageDailyVisitors: number;
  averageDailyRevenue: number;
  customEvents: Record<string, CustomEventRow>;
  status: string;
  aiInsights?: Array<{ insight: string; _id?: string; id?: string }>;
  createdAt: string;
  updatedAt: string;
  processingTime?: number;
  id?: string;
  revenuePerVisitorOverTime?: Array<{ date: string; value: number }>;
}

export interface ConversionMetricsResponse {
  conversionMetrics: ConversionMetricsPayload;
}
