"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Monitor, Globe, Target, Link2, Layout, Wallet } from "lucide-react";
import Image from "next/image";
import type { ConversionMetricsPayload } from "@/types/conversion-metrics";
import { getFlagEmoji } from "@/utils/tracking/geolocation";
import { DomainLogo } from "@/components/ui/domain-logo";

const CAROUSEL_INTERVAL_MS = 4500;

const CHART_COLOR = "hsl(var(--accent))";
const CHART_GRADIENT_START = "hsl(var(--accent) / 0.6)";
const CHART_GRADIENT_END = "hsl(var(--accent) / 0.15)";
const AXIS_TICK_STYLE = {
  fontSize: 10,
  fill: "hsl(var(--muted-foreground))",
};
const STAT_GRADIENT_CLASS =
  "bg-gradient-to-b from-[#984027] via-[#cd5936] to-[#e56f4b] bg-clip-text text-transparent";
const BAR_GRADIENT_COLORS = {
  from: "#984027",
  via: "#cd5936",
  to: "#e56f4b",
};

const VISITS_TO_PURCHASE = [
  { visit: "1", count: 0 },
  { visit: "2", count: 0 },
  { visit: "3", count: 0 },
  { visit: "4", count: 0 },
  { visit: "5", count: 0 },
  { visit: "6", count: 0 },
  { visit: "7", count: 0 },
  { visit: "8", count: 0 },
  { visit: "9", count: 0 },
  { visit: "10+", count: 0 },
];

const REV_VISITOR_GROWTH = [
  { date: "W1", value: 0 },
  { date: "W2", value: 0 },
  { date: "W3", value: 0 },
  { date: "W4", value: 0 },
];

const DAYS_TO_PURCHASE = [
  { bucket: "1d", count: 0 },
  { bucket: "3d", count: 0 },
  { bucket: "1w", count: 0 },
  { bucket: "2w", count: 0 },
  { bucket: "1m+", count: 0 },
];

const HEATMAP_CELLS = 7 * 8;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const DAY_NAMES = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function formatHeatmapTimeSlot(slotIndex: number): string {
  const start = slotIndex * 3;
  const end = start + 3;
  const fmt = (h: number) =>
    h === 0 ? "12am" : h === 12 ? "12pm" : h < 12 ? `${h}am` : `${h - 12}pm`;
  return `${fmt(start)}–${fmt(end)}`;
}

function formatPct(n: number): string {
  if (n === 0) return "0";
  if (n >= 100) return "100";
  return n < 1 ? n.toFixed(2) : n.toFixed(1);
}

function formatCurrency(value: number, currency: string): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "USD").toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
  return formatted.replace(/^[A-Z]{2,3}\s?/i, "").trim();
}

function getReferrerFaviconUrl(refKey: string): string | null {
  if (!refKey || refKey === "direct") return null;
  const domain = refKey.replace(/_/g, ".");
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

const CAROUSEL_HIGHLIGHT_CLASS =
  "rounded bg-[#e56f4b]/25 px-1 py-0.5 font-mono text-base text-foreground border border-[#cd5936]/30";

const NUMBER_OR_PERCENT = /(\$?[\d,]+\.?\d*%?)/g;

function formatInsightText(insight: string): React.ReactNode {
  const parts = insight.split(/(`[^`]*`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      const inner = part.slice(1, -1);
      const isPercentageOrNumber = /\d/.test(inner);
      return isPercentageOrNumber ? (
        <span key={i} className={CAROUSEL_HIGHLIGHT_CLASS}>
          {inner}
        </span>
      ) : (
        <span key={i}>{inner}</span>
      );
    }
    const textParts = part.split(NUMBER_OR_PERCENT);
    return (
      <span key={i}>
        {textParts.map((sub, j) =>
          /^\$?[\d,]+\.?\d*%?$/.test(sub) ? (
            <span key={`${i}-${j}`} className={CAROUSEL_HIGHLIGHT_CLASS}>
              {sub}
            </span>
          ) : (
            <span key={`${i}-${j}`}>{sub}</span>
          ),
        )}
      </span>
    );
  });
}

function DeviceCard({
  icon: Icon,
  label,
  primaryStat,
  primaryValue,
  secondary,
}: {
  icon: React.ElementType;
  label: string;
  primaryStat: string;
  primaryValue: string;
  secondary: string;
}) {
  return (
    <div className="custom-card relative bg-card p-4 shadow-sm w-full">
      <div className="flex items-center justify-start gap-4 sm:gap-6">
        <div className="flex size-24 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
          <Icon className="size-12" strokeWidth={1.5} />
        </div>
        <div>
          <div className="text-lg font-bold text-foreground">
            {primaryStat} <span className="lowercase">{label}</span>{" "}
            {primaryValue}
          </div>
          <div className="text-muted-foreground mt-1.5 text-sm">
            {secondary}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wider opacity-60">
      {children}
    </h3>
  );
}

export function InsightsFullView({
  websiteDomain,
  websiteIconUrl,
  currency = "USD",
  conversionMetrics,
}: {
  websiteDomain?: string | null;
  websiteIconUrl?: string | null;
  currency?: string;
  conversionMetrics?: ConversionMetricsPayload | null;
}) {
  const domain = websiteDomain || "yoursite.com";
  const domainDisplay = domain.replace(/^https?:\/\//, "").split("/")[0];

  const m = conversionMetrics;
  const visitsToPurchaseData = (() => {
    const base = [
      { visit: "1", count: 0 },
      { visit: "2", count: 0 },
      { visit: "3", count: 0 },
      { visit: "4", count: 0 },
      { visit: "5", count: 0 },
      { visit: "6", count: 0 },
      { visit: "7", count: 0 },
      { visit: "8", count: 0 },
      { visit: "9", count: 0 },
      { visit: "10+", count: 0 },
    ];
    if (!m?.visitsToConversion?.distribution) return base;
    const d = m.visitsToConversion.distribution;
    for (let i = 1; i <= 9; i++) {
      base[i - 1]!.count = d[String(i)]?.count ?? 0;
    }
    base[9]!.count = d["10"]?.count ?? 0;
    for (const k of Object.keys(d)) {
      if (k === "31+" || (k !== "10" && parseInt(k, 10) > 9)) {
        base[9]!.count += d[k]?.count ?? 0;
      }
    }
    return base;
  })();

  const daysToPurchaseData = (() => {
    const base = [
      { bucket: "1d", count: 0 },
      { bucket: "3d", count: 0 },
      { bucket: "1w", count: 0 },
      { bucket: "2w", count: 0 },
      { bucket: "1m+", count: 0 },
    ];
    if (!m?.timeToConversion?.distribution) return base;
    const d = m.timeToConversion.distribution;
    base[0]!.count = d.same_day?.count ?? 0;
    base[1]!.count =
      (d.day_1?.count ?? 0) + (d.day_2?.count ?? 0) + (d.day_3?.count ?? 0);
    base[2]!.count =
      (d.day_4?.count ?? 0) +
      (d.day_5?.count ?? 0) +
      (d.day_6?.count ?? 0) +
      (d.day_7?.count ?? 0);
    base[3]!.count =
      (d.day_8?.count ?? 0) +
      (d.day_9?.count ?? 0) +
      (d.day_10?.count ?? 0) +
      (d.days_11_15?.count ?? 0);
    base[4]!.count =
      (d.days_16_20?.count ?? 0) +
      (d.days_21_30?.count ?? 0) +
      (d.days_30_plus?.count ?? 0);
    return base;
  })();

  const firstVisitPct = m?.visitsToConversion?.distribution?.["1"]?.percentage
    ? formatPct(m.visitsToConversion.distribution["1"].percentage * 100)
    : null;
  const avgVisitsToConversion = m?.visitsToConversion?.average ?? null;
  const medianVisitsToConversion = m?.visitsToConversion?.median ?? null;
  const avgDailyVisitors = m?.averageDailyVisitors ?? null;
  const avgDailyRevenue = m?.averageDailyRevenue ?? null;
  const totalRevenue = m?.totalRevenue ?? null;
  const totalVisitors = m?.totalVisitors ?? null;
  const revenuePerVisitor =
    totalVisitors != null && totalVisitors > 0 && totalRevenue != null
      ? totalRevenue / totalVisitors
      : null;
  const conversionRate = m?.baselineConversionRate
    ? formatPct(m.baselineConversionRate * 100)
    : null;
  const medianHoursToPurchase = m?.timeToConversion?.medianHours ?? null;
  const peakDay =
    m?.purchaseTimePatterns?.peakDayHour?.day ??
    m?.purchaseTimePatterns?.peakDay;
  const peakHour =
    m?.purchaseTimePatterns?.peakDayHour?.hour ??
    m?.purchaseTimePatterns?.peakHour;

  const topCountriesByRevenue = m?.dimensions?.countries
    ? Object.entries(m.dimensions.countries)
        .sort(([, a], [, b]) => (b?.totalRevenue ?? 0) - (a?.totalRevenue ?? 0))
        .slice(0, 5)
    : [];
  const topCountriesByConversion = m?.dimensions?.countries
    ? Object.entries(m.dimensions.countries)
        .sort(
          ([, a], [, b]) => (b?.conversionRate ?? 0) - (a?.conversionRate ?? 0),
        )
        .slice(0, 5)
    : [];
  const topReferrersByRevenue = m?.dimensions?.referrers
    ? Object.entries(m.dimensions.referrers)
        .sort(([, a], [, b]) => (b?.totalRevenue ?? 0) - (a?.totalRevenue ?? 0))
        .slice(0, 5)
    : [];
  const topReferrersByConversion = m?.dimensions?.referrers
    ? Object.entries(m.dimensions.referrers)
        .sort(
          ([, a], [, b]) => (b?.conversionRate ?? 0) - (a?.conversionRate ?? 0),
        )
        .slice(0, 5)
    : [];

  const heatmapGrid = (() => {
    const grid: number[][] = [];
    const dist = m?.purchaseTimePatterns?.hourlyDistribution;
    if (!dist) {
      for (let r = 0; r < 8; r++) {
        grid.push(Array(7).fill(0));
      }
      return grid;
    }
    for (let slot = 0; slot < 8; slot++) {
      const row: number[] = [];
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        const dayName = DAY_NAMES[dayIdx];
        let count = 0;
        for (let h = slot * 3; h < slot * 3 + 3 && h < 24; h++) {
          count += dist[`${dayName}_${h}`]?.count ?? 0;
        }
        row.push(count);
      }
      grid.push(row);
    }
    return grid;
  })();
  const heatmapMax = Math.max(...heatmapGrid.flat(), 1);

  const topConvertingEvents = m?.customEvents
    ? Object.entries(m.customEvents)
        .sort(
          ([, a], [, b]) => (b?.conversionRate ?? 0) - (a?.conversionRate ?? 0),
        )
        .slice(0, 8)
    : [];

  const deviceData = m?.dimensions?.devices;
  const osData = m?.dimensions?.operatingSystems;
  const browserData = m?.dimensions?.browsers;
  const totalConv = m?.totalConversions ?? 0;
  const desktopRow = deviceData?.desktop;
  const mobileRow = deviceData?.mobile;
  const desktopPct =
    totalConv > 0 && desktopRow
      ? formatPct((desktopRow.conversions / totalConv) * 100)
      : null;
  const mobilePct =
    totalConv > 0 && mobileRow
      ? formatPct((mobileRow.conversions / totalConv) * 100)
      : null;
  const osEntries = osData
    ? Object.entries(osData).sort(
        ([, a], [, b]) => (b?.totalRevenue ?? 0) - (a?.totalRevenue ?? 0),
      )
    : [];
  const browserEntries = browserData
    ? Object.entries(browserData).sort(
        ([, a], [, b]) => (b?.totalRevenue ?? 0) - (a?.totalRevenue ?? 0),
      )
    : [];
  const topOs = osEntries[0]?.[0] ?? "—";
  const topOsPct =
    totalConv > 0 && osEntries[0]?.[1]
      ? formatPct((osEntries[0][1].conversions / totalConv) * 100)
      : "—";
  const othersOs =
    osEntries.length > 1
      ? osEntries
          .slice(1, 3)
          .map(([name]) => name)
          .join(", ")
      : "—";
  const topBrowser = browserEntries[0]?.[0] ?? "—";
  const topBrowserPct =
    totalConv > 0 && browserEntries[0]?.[1]
      ? formatPct((browserEntries[0][1].conversions / totalConv) * 100)
      : "—";
  const othersBrowser =
    browserEntries.length > 1
      ? browserEntries
          .slice(1, 3)
          .map(([name]) => name)
          .join(", ")
      : "—";

  const fallbackSlides: React.ReactNode[] = [
    <>
      <span>The average number of visits to conversion is </span>
      <span className={CAROUSEL_HIGHLIGHT_CLASS}>
        {avgVisitsToConversion != null ? avgVisitsToConversion.toFixed(1) : "—"}
      </span>
      <span> with a median of </span>
      <span className={CAROUSEL_HIGHLIGHT_CLASS}>
        {medianVisitsToConversion != null
          ? Math.round(medianVisitsToConversion)
          : "—"}
      </span>
    </>,
    <>
      <span>{firstVisitPct ?? "—"}% of buyers purchase on first visit</span>
      <span className={CAROUSEL_HIGHLIGHT_CLASS}>
        {" "}
        conversion rate {conversionRate ?? "—"}%
      </span>
    </>,
    <>
      <span>Revenue per visitor </span>
      <span className={CAROUSEL_HIGHLIGHT_CLASS}>
        {revenuePerVisitor != null
          ? formatCurrency(revenuePerVisitor, currency)
          : "—"}
      </span>
      <span>
        {" "}
        · avg. daily revenue{" "}
        {avgDailyRevenue != null
          ? formatCurrency(avgDailyRevenue, currency)
          : "—"}
      </span>
    </>,
    <>
      <span>Median time to purchase </span>
      <span className={CAROUSEL_HIGHLIGHT_CLASS}>
        {medianHoursToPurchase != null
          ? `${medianHoursToPurchase.toFixed(1)}h`
          : "—"}
      </span>
      <span>
        {" "}
        · peak on {peakDay ?? "—"} at{" "}
        {peakHour != null ? `${peakHour}:00` : "—"}
      </span>
    </>,
    <>
      <span>Avg. daily visitors </span>
      <span className={CAROUSEL_HIGHLIGHT_CLASS}>
        {avgDailyVisitors != null ? avgDailyVisitors : "—"}
      </span>
      <span> · last 30 days</span>
    </>,
  ];

  const aiInsightSlides =
    m?.aiInsights
      ?.filter(
        (item): item is { insight: string } =>
          item != null &&
          typeof (item as { insight?: string }).insight === "string",
      )
      .map((item) => formatInsightText(item.insight)) ?? [];
  const carouselSlides =
    aiInsightSlides.length > 0 ? aiInsightSlides : fallbackSlides;

  const carouselSlideCount = carouselSlides.length;

  const [carouselIndex, setCarouselIndex] = useState(0);
  useEffect(() => {
    if (carouselSlideCount <= 0) return;
    setCarouselIndex((prev) => Math.min(prev, carouselSlideCount - 1));
  }, [carouselSlideCount]);
  const goToSlide = useCallback(
    (index: number) => {
      setCarouselIndex((prev) => {
        const count = carouselSlides.length;
        if (count <= 0) return 0;
        return index < 0 ? count - 1 : index % count;
      });
    },
    [carouselSlides.length],
  );
  useEffect(() => {
    if (carouselSlideCount <= 0) return;
    const id = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselSlideCount);
    }, CAROUSEL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [carouselSlideCount]);

  return (
    <div className="mx-auto w-full max-w-[1920px] p-3 sm:p-4">
      <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        <aside className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 lg:sticky lg:top-4">
          <DeviceCard
            icon={Monitor}
            label="Desktop"
            primaryStat={`${desktopPct ?? "—"}% revenue from`}
            primaryValue={`(${desktopPct ?? "—"})`}
            secondary={
              mobilePct != null ? `${mobilePct}% from mobile` : "— from mobile"
            }
          />
          <DeviceCard
            icon={Layout}
            label={topOs}
            primaryStat={`${topOsPct}% revenue from`}
            primaryValue={`(${topOsPct})`}
            secondary={`— from ${othersOs}`}
          />
          <DeviceCard
            icon={Globe}
            label={topBrowser}
            primaryStat={`${topBrowserPct}% revenue from`}
            primaryValue={`(${topBrowserPct})`}
            secondary={`— from ${othersBrowser}`}
          />
          <div className="flex flex-col gap-3 sm:flex-row lg:gap-4">
            <div className="custom-card relative flex flex-1 flex-col items-center justify-center p-4 shadow-sm">
              <div
                className={`${STAT_GRADIENT_CLASS} text-center text-5xl font-black tracking-tight sm:text-6xl`}
              >
                {firstVisitPct ?? "—"}
              </div>
              <p className="text-muted-foreground mt-1 text-center text-sm">
                of buyers purchase on first visit
              </p>
            </div>
            <div className="custom-card relative min-w-0 flex-1 p-4 shadow-sm">
              <SectionTitle>Visits to purchase</SectionTitle>
              <div className="h-[140px] sm:h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={visitsToPurchaseData}
                    margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
                  >
                    <defs>
                      <linearGradient
                        id="barGradientVisits"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={BAR_GRADIENT_COLORS.from}
                        />
                        <stop
                          offset="50%"
                          stopColor={BAR_GRADIENT_COLORS.via}
                        />
                        <stop
                          offset="100%"
                          stopColor={BAR_GRADIENT_COLORS.to}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="visit"
                      tick={AXIS_TICK_STYLE}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Bar
                      dataKey="count"
                      fill="url(#barGradientVisits)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="relative custom-card flex min-h-[280px] flex-1 overflow-hidden bg-card p-4 shadow-sm sm:min-h-[320px]">
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.07]">
              <Globe className="size-64 text-foreground" strokeWidth={1} />
            </div>
            <div className="relative z-10 grid min-h-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
              <div className="flex flex-col">
                <SectionTitle>Top Revenue</SectionTitle>
                <div className="flex min-h-[200px] flex-1 flex-col justify-center space-y-3 text-sm text-muted-foreground sm:min-h-[240px]">
                  {topCountriesByRevenue.length
                    ? topCountriesByRevenue.map(([code, row]) => (
                        <div
                          key={code}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="flex items-center gap-2 font-medium text-foreground">
                            {code.length === 2 ? (
                              <span className="text-lg leading-none">
                                {getFlagEmoji(code)}
                              </span>
                            ) : null}
                            {code}
                          </span>
                          <span className="text-foreground font-medium">
                            {formatCurrency(row?.totalRevenue ?? 0, currency)}
                          </span>
                        </div>
                      ))
                    : null}
                </div>
              </div>
              <div className="flex flex-col">
                <SectionTitle>Top Conversion</SectionTitle>
                <div className="flex min-h-[200px] flex-1 flex-col justify-center space-y-3 text-sm text-muted-foreground sm:min-h-[240px]">
                  {topCountriesByConversion.length
                    ? topCountriesByConversion.map(([code, row]) => (
                        <div
                          key={code}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="flex items-center gap-2 font-medium text-foreground">
                            {code.length === 2 ? (
                              <span className="text-lg leading-none">
                                {getFlagEmoji(code)}
                              </span>
                            ) : null}
                            {code}
                          </span>
                          <span className="text-foreground font-medium">
                            {formatPct((row?.conversionRate ?? 0) * 100)}%
                          </span>
                        </div>
                      ))
                    : null}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 lg:gap-4">
          <div className="custom-card relative grid grid-cols-2 gap-4 bg-card p-4 shadow-sm">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex size-16 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                <Globe
                  className="size-8 scale-125 object-contain"
                  strokeWidth={1.5}
                />
              </div>
              <div className="flex flex-col items-center justify-center text-center">
                <div
                  className={`${STAT_GRADIENT_CLASS} text-center text-4xl font-black tracking-tight lg:text-6xl`}
                >
                  {avgDailyVisitors != null ? avgDailyVisitors : "—"}
                </div>
                <p className="text-muted-foreground mt-1 text-center text-sm">
                  avg. daily visitors
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex size-16 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                <Wallet
                  className="size-8 scale-125 object-contain"
                  strokeWidth={1.5}
                />
              </div>
              <div className="flex flex-col items-center justify-center text-center">
                <div
                  className={`${STAT_GRADIENT_CLASS} text-center text-4xl font-black tracking-tight lg:text-6xl`}
                >
                  {avgDailyRevenue != null
                    ? formatCurrency(avgDailyRevenue, currency)
                    : "—"}
                </div>
                <p className="text-muted-foreground mt-1 text-center text-sm">
                  avg. daily revenue
                </p>
              </div>
            </div>
          </div>

          <div className="custom-card relative overflow-hidden bg-card py-[60px] shadow-sm">
            <div className="absolute inset-0 opacity-20" aria-hidden>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
                viewBox="0 0 800 800"
                className="scale-[1.3]"
              >
                <rect fill="#fef5f3" width="800" height="800" />
                <g fillOpacity={1}>
                  <circle fill="#fde8e4" cx="400" cy="400" r="600" />
                  <circle fill="#fcddd6" cx="400" cy="400" r="500" />
                  <circle fill="#fad2c8" cx="400" cy="400" r="400" />
                  <circle fill="#f8c7ba" cx="400" cy="400" r="300" />
                  <circle fill="#f6bcac" cx="400" cy="400" r="200" />
                  <circle fill="#f4b19e" cx="400" cy="400" r="100" />
                </g>
              </svg>
            </div>
            <div className="relative z-10 flex flex-col items-center justify-between">
              <div className="relative flex size-40 items-center justify-center">
                <div className="absolute inset-0 z-10 rounded-lg border-2 border-border bg-card" />
                <div className="absolute inset-6 z-10 rounded-lg bg-card" />
                <DomainLogo
                  domain={domain}
                  size={95}
                  className="relative z-20"
                />
              </div>
              <div className="mt-4 text-center text-4xl font-black text-foreground sm:text-5xl md:text-6xl">
                {domainDisplay}
              </div>
              <div className="text-muted-foreground mt-2 text-sm italic">
                last 30 days
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:gap-4">
            <div className="custom-card relative min-w-0 flex-1 pb-0 pt-4 shadow-sm">
              <div className="px-4">
                <SectionTitle>Rev/visitor growth</SectionTitle>
              </div>
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={REV_VISITOR_GROWTH}
                    margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
                  >
                    <XAxis
                      dataKey="date"
                      tick={AXIS_TICK_STYLE}
                      tickLine={false}
                    />
                    <defs>
                      <linearGradient
                        id="areaGradientInsights"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={CHART_GRADIENT_START}
                          stopOpacity={1}
                        />
                        <stop
                          offset="100%"
                          stopColor={CHART_GRADIENT_END}
                          stopOpacity={1}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={CHART_COLOR}
                      strokeWidth={2}
                      fill="url(#areaGradientInsights)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="custom-card flex min-w-0 flex-shrink-0 flex-col items-center justify-center p-4 shadow-sm sm:min-w-[140px]">
              <div
                className={`${STAT_GRADIENT_CLASS} text-center text-4xl font-black tracking-tight sm:text-5xl md:text-6xl`}
              >
                {revenuePerVisitor != null
                  ? formatCurrency(revenuePerVisitor, currency)
                  : "—"}
              </div>
              <p className="text-muted-foreground mt-1 text-center text-sm">
                revenue per visitor
              </p>
            </div>
          </div>

          <div className="custom-card flex flex-col justify-center pt-6 pb-4 px-4 shadow-sm overflow-hidden">
            <div
              className="animate-in fade-in duration-300 min-h-[3.5rem] flex items-center justify-center"
              key={carouselIndex}
            >
              <div className="w-full text-center text-lg font-medium text-foreground leading-relaxed text-pretty">
                {
                  carouselSlides[
                    carouselSlideCount > 0
                      ? Math.min(carouselIndex, carouselSlideCount - 1)
                      : 0
                  ]
                }
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {Array.from({ length: carouselSlideCount }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToSlide(i)}
                  aria-label={`Go to insight ${i + 1}`}
                  className={`rounded-full transition-all duration-200 size-1.5 hover:scale-125 ${
                    i === carouselIndex
                      ? "size-2 bg-foreground"
                      : "bg-muted-foreground/10 hover:bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
          </div>

          <p className="text-muted-foreground mt-2 text-center text-xs opacity-60 max-lg:hidden">
            These metrics are based on the last 30 days and are updated daily.
          </p>
        </main>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 md:col-span-2 lg:col-span-1 lg:gap-4">
          <div className="relative custom-card flex min-h-[280px] flex-1 overflow-hidden bg-card p-4 shadow-sm sm:min-h-[320px]">
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.15]">
              <Link2 className="size-64 text-foreground" strokeWidth={1} />
            </div>
            <div className="relative z-10 grid min-h-full grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
              <div className="flex flex-col">
                <SectionTitle>Top Revenue</SectionTitle>
                <div className="flex min-h-[200px] flex-1 flex-col justify-center space-y-3 text-sm text-muted-foreground sm:min-h-[240px]">
                  {topReferrersByRevenue.length
                    ? topReferrersByRevenue.map(([ref, row]) => {
                        const favicon = getReferrerFaviconUrl(ref);
                        const displayName = ref.replace(/_/g, ".");
                        return (
                          <div
                            key={ref}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="flex min-w-0 items-center gap-2 font-medium text-foreground">
                              {favicon ? (
                                <Image
                                  src={favicon}
                                  alt=""
                                  width={16}
                                  height={16}
                                  className="size-4 shrink-0 rounded-sm object-contain"
                                  unoptimized
                                />
                              ) : (
                                <span className="flex size-4 shrink-0 items-center justify-center">
                                  <Link2 className="size-3.5 text-muted-foreground" />
                                </span>
                              )}
                              <span className="truncate">{displayName}</span>
                            </span>
                            <span className="shrink-0 text-foreground font-medium">
                              {formatCurrency(row?.totalRevenue ?? 0, currency)}
                            </span>
                          </div>
                        );
                      })
                    : null}
                </div>
              </div>
              <div className="flex flex-col">
                <SectionTitle>Top Conversion</SectionTitle>
                <div className="flex min-h-[200px] flex-1 flex-col justify-center space-y-3 text-sm text-muted-foreground sm:min-h-[240px]">
                  {topReferrersByConversion.length
                    ? topReferrersByConversion.map(([ref, row]) => {
                        const favicon = getReferrerFaviconUrl(ref);
                        const displayName = ref.replace(/_/g, ".");
                        return (
                          <div
                            key={ref}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="flex min-w-0 items-center gap-2 font-medium text-foreground">
                              {favicon ? (
                                <Image
                                  src={favicon}
                                  alt=""
                                  width={16}
                                  height={16}
                                  className="size-4 shrink-0 rounded-sm object-contain"
                                  unoptimized
                                />
                              ) : (
                                <span className="flex size-4 shrink-0 items-center justify-center">
                                  <Link2 className="size-3.5 text-muted-foreground" />
                                </span>
                              )}
                              <span className="truncate">{displayName}</span>
                            </span>
                            <span className="shrink-0 text-foreground font-medium">
                              {formatPct((row?.conversionRate ?? 0) * 100)}%
                            </span>
                          </div>
                        );
                      })
                    : null}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:gap-4">
            <div className="custom-card min-w-0 flex-1 p-4 shadow-sm">
              <SectionTitle>Days to purchase</SectionTitle>
              <div className="h-[110px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={daysToPurchaseData}
                    margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
                  >
                    <defs>
                      <linearGradient
                        id="barGradientDays"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={BAR_GRADIENT_COLORS.from}
                        />
                        <stop
                          offset="50%"
                          stopColor={BAR_GRADIENT_COLORS.via}
                        />
                        <stop
                          offset="100%"
                          stopColor={BAR_GRADIENT_COLORS.to}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="bucket"
                      tick={AXIS_TICK_STYLE}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Bar
                      dataKey="count"
                      fill="url(#barGradientDays)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="custom-card flex flex-shrink-0 flex-col items-center justify-center py-8 p-4 shadow-sm sm:min-w-[120px] sm:py-10">
              <div
                className={`${STAT_GRADIENT_CLASS} text-center text-4xl font-black tracking-tight sm:text-5xl md:text-6xl`}
              >
                {medianHoursToPurchase != null
                  ? medianHoursToPurchase.toFixed(1)
                  : "—"}
              </div>
              <p className="text-muted-foreground mt-1 text-center text-sm">
                hours median to purchase
              </p>
            </div>
          </div>
          <div className="custom-card flex flex-col items-center justify-center p-4 shadow-sm">
            <div
              className={`${STAT_GRADIENT_CLASS} text-center text-4xl font-black tracking-tight sm:text-5xl md:text-6xl`}
            >
              {conversionRate != null ? `${conversionRate}%` : "—"}
            </div>
            <p className="text-muted-foreground mt-1 text-center text-sm">
              conversion rate
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:gap-4">
            <div className="custom-card relative min-w-0 flex-1 overflow-hidden p-4 shadow-sm">
              <SectionTitle>Top Converting Events</SectionTitle>
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.07]">
                <Target className="size-64 text-foreground" strokeWidth={1} />
              </div>
              <div className="relative z-10 min-h-32 space-y-3 text-sm text-muted-foreground sm:min-h-36">
                {topConvertingEvents.length ? (
                  topConvertingEvents.map(([eventName, row]) => (
                    <div
                      key={eventName}
                      className="flex flex-wrap items-baseline justify-between gap-2"
                    >
                      <span className="font-medium text-foreground">
                        {eventName.replace(/_/g, " ")}
                      </span>
                      <span className="text-foreground font-medium">
                        {formatPct((row?.conversionRate ?? 0) * 100)}% →{" "}
                        {formatCurrency(row?.totalRevenue ?? 0, currency)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p>
                    No events yet. Add custom goals to see which actions lead to
                    purchases.
                  </p>
                )}
              </div>
            </div>
            <div className="custom-card min-w-0 flex-shrink-0 p-4 shadow-sm sm:min-w-[160px]">
              <SectionTitle>Conversion by day & time</SectionTitle>
              <div className="grid grid-cols-7 gap-1">
                {DAY_LABELS.map((d) => (
                  <div
                    key={d}
                    className="text-muted-foreground mb-1 text-center text-xs opacity-80"
                  >
                    {d}
                  </div>
                ))}
                {heatmapGrid.flatMap((row, r) =>
                  row.map((count, c) => (
                    <div
                      key={`${r}-${c}`}
                      className="group relative aspect-square rounded bg-muted/50 transition-colors cursor-default"
                      style={
                        count > 0
                          ? {
                              backgroundColor: `hsl(var(--accent) / ${0.15 + 0.85 * (count / heatmapMax)})`,
                            }
                          : undefined
                      }
                    >
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 hidden -translate-x-1/2 group-hover:block">
                        <div className="rounded-lg border border-border bg-background px-3 py-2 text-center text-sm font-medium text-foreground shadow-md max-w-[180px]">
                          <div className="line-clamp-2">
                            {DAY_FULL_NAMES[c]} {formatHeatmapTimeSlot(r)}
                            <br />
                            {count} {count === 1 ? "purchase" : "purchases"}
                          </div>
                          <div
                            className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-background"
                            aria-hidden
                          />
                        </div>
                      </div>
                    </div>
                  )),
                )}
              </div>
              <div className="text-muted-foreground mt-2.5 text-center text-xs">
                <span className="opacity-80">Conversion peak on</span>{" "}
                <span className="font-medium capitalize text-foreground">
                  {peakDay ?? "—"}
                </span>{" "}
                <span className="opacity-80">at</span>{" "}
                <span className="font-medium text-foreground">
                  {peakHour != null ? `${peakHour}:00` : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
