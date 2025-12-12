"use client";

import { useState, memo } from "react";
import {
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import {
  getCurrentTimeIndex,
  formatDateDisplay,
  shouldHaveRadiusForNew,
  shouldHaveRadiusForRenewal,
  shouldHaveRadiusForRefund,
  createRoundedTopRectPath,
} from "@/utils/analytics/chart";
import { NotesIcon } from "@/components/icons";

export interface Mention {
  text: string;
  url?: string;
  type: "profile" | "gear";
}

export interface ChartDataPoint {
  date: string;
  fullDate?: string;
  timestamp?: string;
  visitors: number | null | undefined;
  revenue: number;
  revenueNew?: number;
  revenueRenewal?: number;
  revenueRefund?: number;
  revenuePerVisitor?: number;
  conversionRate?: number;
  hasMention?: boolean;
  mentions?: Mention[];
}

interface ForecastDataPoint extends ChartDataPoint {
  isForecast?: boolean;
  solidLineValue?: number | null;
  dashedLineValue?: number | null;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataPoint;
    value?: number;
    name?: string;
  }>;
}

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: ChartDataPoint;
  value?: number;
  index?: number;
}

interface ChartDotProps extends DotProps {
  currentTimeIndex: number | null;
  forecastData: ForecastDataPoint[];
  showMentionsOnChart: boolean;
  onMentionClick?: (data: ChartDataPoint) => void;
}

interface ActiveDotProps extends DotProps {
  onClick?: (data: ChartDataPoint) => void;
}

// Custom bar shape for revenueNew (solid bars)
function RevenueNewBarShape(props: any) {
  const { x, y, width, height, fill } = props;
  if (!x || !y || !width || !height) return <g />;

  const hasRadius = shouldHaveRadiusForNew(props);
  const radius = 4;

  if (hasRadius) {
    return (
      <path
        d={createRoundedTopRectPath(x, y, width, height, radius)}
        fill={fill}
        style={{ opacity: 0.8 }}
      />
    );
  }

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      style={{ opacity: 0.8 }}
    />
  );
}

// Custom bar shape for revenueRenewal (solid bars)
function RevenueRenewalBarShape(props: any) {
  const { x, y, width, height, fill } = props;
  if (!x || !y || !width || !height) return <g />;

  const hasRadius = shouldHaveRadiusForRenewal(props);
  const radius = 4;
  const opacity = 0.6; // Reduced opacity to distinguish from revenueNew

  if (hasRadius) {
    return (
      <path
        d={createRoundedTopRectPath(x, y, width, height, radius)}
        fill={fill}
        style={{ opacity }}
      />
    );
  }

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      style={{ opacity }}
    />
  );
}

// Custom bar shape for dashed bars (Refunds)
function DashedBarShape(props: any) {
  const { x, y, width, height, fill } = props;
  if (!x || !y || !width || !height) return <g />;

  const borderWidth = 0.75;
  const fillOpacity = 0.35;
  const borderOpacity = 0.8;
  const hasRadius = shouldHaveRadiusForRefund(props);
  const radius = 4;

  if (hasRadius) {
    const pathData = createRoundedTopRectPath(x, y, width, height, radius);
    // Extract top border path (rounded top only)
    const topPath = `M ${x} ${y + radius} Q ${x} ${y} ${x + radius} ${y} L ${
      x + width - radius
    } ${y} Q ${x + width} ${y} ${x + width} ${y + radius}`;
    return (
      <g>
        {/* Background fill with opacity */}
        <path d={pathData} fill={fill} fillOpacity={fillOpacity} />
        {/* Dashed top border (rounded) */}
        <path
          d={topPath}
          fill="none"
          stroke={fill}
          strokeWidth={borderWidth}
          strokeDasharray="4 2"
          strokeOpacity={borderOpacity}
        />
        {/* Dashed left border */}
        <line
          x1={x}
          y1={y + radius}
          x2={x}
          y2={y + height}
          stroke={fill}
          strokeWidth={borderWidth}
          strokeDasharray="4 2"
          strokeOpacity={borderOpacity}
        />
        {/* Dashed right border */}
        <line
          x1={x + width}
          y1={y + radius}
          x2={x + width}
          y2={y + height}
          stroke={fill}
          strokeWidth={borderWidth}
          strokeDasharray="4 2"
          strokeOpacity={borderOpacity}
        />
      </g>
    );
  }

  return (
    <g>
      {/* Background fill with opacity */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        fillOpacity={fillOpacity}
      />
      {/* Dashed top border */}
      <line
        x1={x}
        y1={y}
        x2={x + width}
        y2={y}
        stroke={fill}
        strokeWidth={borderWidth}
        strokeDasharray="4 2"
        strokeOpacity={borderOpacity}
      />
      {/* Dashed left border */}
      <line
        x1={x}
        y1={y}
        x2={x}
        y2={y + height}
        stroke={fill}
        strokeWidth={borderWidth}
        strokeDasharray="4 2"
        strokeOpacity={borderOpacity}
      />
      {/* Dashed right border */}
      <line
        x1={x + width}
        y1={y}
        x2={x + width}
        y2={y + height}
        stroke={fill}
        strokeWidth={borderWidth}
        strokeDasharray="4 2"
        strokeOpacity={borderOpacity}
      />
    </g>
  );
}

interface AnalyticsChartProps {
  data: ChartDataPoint[];
  avatarUrls?: string[];
  showMentions?: boolean;
  showRevenue?: boolean;
  currency?: string;
  onMentionClick?: (data: ChartDataPoint) => void;
  onNoteClick?: (data: ChartDataPoint) => void;
  height?: string;
}

function AnalyticsChartComponent({
  data,
  avatarUrls = [],
  showMentions = true,
  showRevenue = true,
  currency = "USD",
  onMentionClick,
  onNoteClick,
  height = "h-72 md:h-96",
}: AnalyticsChartProps) {
  const [showMentionsOnChart, setShowMentionsOnChart] = useState(showMentions);

  const calculateDomainMax = (dataMax: number): number => {
    if (dataMax <= 0) {
      return 5;
    }
    const paddedMax = dataMax * 1.2;

    if (paddedMax < 100) {
      return Math.round(paddedMax / 20) * 20 || 20;
    } else if (paddedMax < 500) {
      return Math.round(paddedMax / 100) * 100 || 100;
    } else if (paddedMax < 1000) {
      return Math.round(paddedMax / 200) * 200 || 200;
    } else if (paddedMax < 5000) {
      return Math.round(paddedMax / 1000) * 1000 || 1000;
    } else if (paddedMax < 10000) {
      const candidates = [
        Math.round(paddedMax / 2000) * 2000,
        Math.round(paddedMax / 4000) * 4000,
        Math.round(paddedMax / 5000) * 5000,
        Math.round(paddedMax / 8000) * 8000,
        Math.round(paddedMax / 10000) * 10000,
      ];
      const validCandidates = candidates.filter((c) => c >= paddedMax);
      return validCandidates.length > 0
        ? Math.min(...validCandidates)
        : Math.max(...candidates);
    } else if (paddedMax < 50000) {
      const candidates = [
        Math.round(paddedMax / 5000) * 5000,
        Math.round(paddedMax / 10000) * 10000,
      ];
      const validCandidates = candidates.filter((c) => c >= paddedMax);
      return validCandidates.length > 0
        ? Math.min(...validCandidates)
        : Math.max(...candidates);
    } else {
      return Math.round(paddedMax / 10000) * 10000 || 10000;
    }
  };

  const calculateTicks = (dataMax: number): number[] => {
    if (dataMax <= 0) {
      return [0, 1, 2, 3, 4, 5];
    }
    const max = calculateDomainMax(dataMax);
    return [0, max * 0.25, max * 0.5, max * 0.75, max];
  };

  const maxVisitors = Math.max(...data.map((d) => d.visitors ?? 0), 0);

  const visitorTicks = calculateTicks(maxVisitors);

  const calculateVisitorDomainMax = (dataMax: number) =>
    calculateDomainMax(dataMax);

  const visitorDomain:
    | [number, number]
    | [number, (dataMax: number) => number] =
    maxVisitors <= 0
      ? ([0, 5] as [number, number])
      : [0, calculateVisitorDomainMax];

  const currentTimeIndex = getCurrentTimeIndex(data);

  // Helper function to check if a data point is today
  // Uses UTC date parts to avoid timezone issues
  const isToday = (item: ChartDataPoint): boolean => {
    if (!item.timestamp) return false;
    const dataDate = new Date(item.timestamp);
    const today = new Date();

    // Compare UTC date parts to avoid timezone issues
    return (
      dataDate.getUTCFullYear() === today.getUTCFullYear() &&
      dataDate.getUTCMonth() === today.getUTCMonth() &&
      dataDate.getUTCDate() === today.getUTCDate()
    );
  };

  const forecastData: ForecastDataPoint[] = data.map((item, index) => {
    const itemIsToday = isToday(item);
    const isForecast =
      currentTimeIndex !== null && index > currentTimeIndex && itemIsToday;

    // For today: use real-time projection (only show up to current time index)
    // For previous dates: always show the full visitor line (preserve null values)
    let solidLineValue: number | null = null;
    if (itemIsToday) {
      // Today: only show up to current time index
      solidLineValue =
        currentTimeIndex !== null && index <= currentTimeIndex
          ? item.visitors ?? null
          : null;
    } else {
      // Previous dates: always show the visitor line (preserve null if no data)
      solidLineValue = item.visitors ?? null;
    }

    return {
      ...item,
      isForecast,
      solidLineValue,
      // Dashed line value: only for currentTimeIndex (today only)
      dashedLineValue:
        currentTimeIndex !== null && index === currentTimeIndex && itemIsToday
          ? item.visitors ?? null
          : null,
    };
  });

  // Debug logs
  console.log("[AnalyticsChart] showRevenue:", showRevenue);
  console.log("[AnalyticsChart] Data sample:", forecastData.slice(0, 3));
  console.log("[AnalyticsChart] Revenue data check:", {
    hasRevenueNew: forecastData.some((d) => d.revenueNew && d.revenueNew > 0),
    hasRevenueRenewal: forecastData.some(
      (d) => d.revenueRenewal && d.revenueRenewal > 0
    ),
    hasRevenueRefund: forecastData.some(
      (d) => d.revenueRefund && d.revenueRefund > 0
    ),
    revenueNewValues: forecastData
      .map((d) => d.revenueNew)
      .filter((v) => v && v > 0)
      .slice(0, 5),
    revenueRenewalValues: forecastData
      .map((d) => d.revenueRenewal)
      .filter((v) => v && v > 0)
      .slice(0, 5),
    revenueRefundValues: forecastData
      .map((d) => d.revenueRefund)
      .filter((v) => v && v > 0)
      .slice(0, 5),
  });

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload as ChartDataPoint;

      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[280px] max-w-[320px]">
          <div className="text-sm font-semibold text-textPrimary mb-3">
            {formatDateDisplay(data)}
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: "#8dcdff",
                  }}
                ></div>
                <span className="text-textSecondary">Visitors</span>
              </div>

              <span className="font-semibold text-textPrimary">
                {data.visitors?.toLocaleString("en-US") ?? "0"}
              </span>
            </div>
            <div className="border-t border-gray-100 pt-2 mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-textSecondary uppercase tracking-wide text-[0.7rem] opacity-75">
                  Revenue
                </span>
                <span className="font-semibold text-textPrimary">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: currency,
                    currencyDisplay: "symbol",
                  }).format(data.revenue ?? 0)}
                </span>
              </div>
              {data.revenueRefund != undefined && data.revenueRefund > 0 && (
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded-sm border-[1.5px] border-dashed opacity-80 overflow-hidden"
                      style={{
                        borderColor: "#E16540",
                      }}
                    >
                      <div
                        className="h-full w-full opacity-35"
                        style={{
                          backgroundColor: "#E16540",
                        }}
                      ></div>
                    </div>
                    <span className="text-textSecondary">Refunds</span>
                  </div>
                  <span className="font-medium text-textPrimary">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: currency,
                      currencyDisplay: "symbol",
                    }).format(data.revenueRefund ?? 0)}
                  </span>
                </div>
              )}
              {data.revenueRenewal != undefined && data.revenueRenewal > 0 && (
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{
                        backgroundColor: "#E16540",
                        opacity: 0.6,
                      }}
                    ></div>
                    <span className="text-textSecondary">Renewal</span>
                  </div>
                  <span className="font-medium text-textPrimary">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: currency,
                      currencyDisplay: "symbol",
                    }).format(data.revenueRenewal ?? 0)}
                  </span>
                </div>
              )}
              {data.revenueNew != undefined && data.revenueNew > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{
                        backgroundColor: "#E16540",
                      }}
                    ></div>
                    <span className="text-textSecondary">New</span>
                  </div>
                  <span className="font-medium text-textPrimary">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: currency,
                      currencyDisplay: "symbol",
                    }).format(data.revenueNew ?? 0)}
                  </span>
                </div>
              )}
            </div>
            {data.revenuePerVisitor !== undefined && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-textSecondary">Revenue/visitor</span>
                <span className="font-semibold text-textPrimary">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: currency,
                    currencyDisplay: "symbol",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(data.revenuePerVisitor ?? 0)}
                </span>
              </div>
            )}
            {data.conversionRate !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-textSecondary">Conversion rate</span>
                <span className="font-semibold text-textPrimary">
                  {new Intl.NumberFormat("en-US", {
                    style: "percent",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format((data.conversionRate ?? 0) / 100)}
                </span>
              </div>
            )}
            {data.mentions && data.mentions.length > 0 && (
              <div className="border-t border-gray-100 pt-2 mt-2 space-y-2">
                {data.mentions.map((mention: Mention, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-textSecondary text-xs"
                  >
                    {mention.type === "profile" ? (
                      <div
                        className="w-4 h-4 rounded-full mt-0.5 shrink-0 flex items-center justify-center text-[10px] font-semibold text-white"
                        style={{
                          backgroundColor: `hsl(${
                            (idx * 137.5) % 360
                          }, 70%, 50%)`,
                        }}
                      >
                        {mention.text?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    ) : (
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
                        className="mt-0.5 shrink-0"
                      >
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                    <span className="leading-relaxed">
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
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={height}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={forecastData}
          margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
          barCategoryGap="10%"
        >
          <defs>
            <linearGradient id="visitorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7888b2" stopOpacity={0.4} />
              <stop offset="40%" stopColor="#7888b2" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#7888b2" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            className="stroke-neutral-200 dark:stroke-neutral-600/50!"
            opacity={0.3}
            vertical={false}
            horizontal={true}
          />
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            className="stroke-neutral-200 dark:stroke-neutral-600!"
            tick={{
              fill: "hsl(var(--muted-foreground))",
              fontSize: 11,
              className: "text-xs fill-textSecondary opacity-80",
            }}
            style={{
              fontSize: "11px",
            }}
            interval={1}
            tickMargin={10}
            minTickGap={50}
          />
          <YAxis
            yAxisId="left"
            stroke="#9ca3af"
            className="stroke-neutral-200 dark:stroke-neutral-600!"
            tick={{
              fill: "hsl(var(--muted-foreground))",
              fontSize: 11,
              className: "text-xs fill-textSecondary opacity-80",
            }}
            style={{
              fontSize: "11px",
            }}
            tickFormatter={(value) => {
              if (value >= 1000) return `${value / 1000}k`;
              return value.toString();
            }}
            tickMargin={8}
            domain={visitorDomain}
            ticks={visitorTicks}
          />
          {showRevenue && (
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#9ca3af"
              className="stroke-neutral-200 dark:stroke-neutral-600!"
              tick={{
                fill: "hsl(var(--muted-foreground))",
                fontSize: 11,
                className: "text-xs fill-textSecondary opacity-80",
              }}
              style={{
                fontSize: "11px",
              }}
              tickFormatter={(value) => {
                const formatter = new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: currency,
                  currencyDisplay: "symbol",
                  notation: value >= 1000 ? "compact" : "standard",
                  maximumFractionDigits: value >= 1000 ? 1 : 0,
                });
                return formatter.format(value);
              }}
              tickMargin={8}
              domain={[0, (dataMax: number) => Math.max(dataMax * 1.5, 50)]}
              tickCount={5}
            />
          )}

          <Tooltip content={<CustomTooltip />} />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="visitors"
            stroke="transparent"
            strokeWidth={0}
            fill="url(#visitorGradient)"
            fillOpacity={0.6}
          />

          {showRevenue && (
            <Bar
              yAxisId="right"
              dataKey="revenueNew"
              fill="#E16540"
              stackId={"stack"}
              shape={RevenueNewBarShape}
              maxBarSize={30}
            />
          )}
          {showRevenue && (
            <Bar
              yAxisId="right"
              dataKey="revenueRenewal"
              fill="#E16540"
              stackId={"stack"}
              shape={RevenueRenewalBarShape}
              maxBarSize={30}
            />
          )}
          {showRevenue && (
            <Bar
              yAxisId="right"
              dataKey="revenueRefund"
              fill="#E16540"
              stackId={"stack"}
              shape={DashedBarShape}
              maxBarSize={30}
            />
          )}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="solidLineValue"
            stroke="#8dcdff"
            strokeWidth={2.5}
            strokeLinecap="round"
            isAnimationActive={true}
            animationBegin={0}
            animationDuration={800}
            dot={(props: DotProps) => (
              <ChartDot
                {...props}
                currentTimeIndex={currentTimeIndex}
                forecastData={forecastData}
                showMentionsOnChart={showMentionsOnChart}
                onMentionClick={onMentionClick}
              />
            )}
            activeDot={(props: DotProps) => (
              <ActiveDot {...props} onClick={onNoteClick} />
            )}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartDot({
  cx,
  cy,
  payload,
  index,
  currentTimeIndex,
  forecastData,
  showMentionsOnChart,
  onMentionClick,
}: ChartDotProps) {
  const handleMentionClick = (data: ChartDataPoint, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMentionClick) {
      onMentionClick(data);
    }
  };

  // Helper function to check if a data point is today
  const isToday = (item: ChartDataPoint | undefined): boolean => {
    if (!item?.timestamp) return false;
    const dataDate = new Date(item.timestamp);
    const today = new Date();
    return (
      dataDate.getFullYear() === today.getFullYear() &&
      dataDate.getMonth() === today.getMonth() &&
      dataDate.getDate() === today.getDate()
    );
  };

  // Show dot at current time - only for today's data
  if (
    currentTimeIndex !== null &&
    index === currentTimeIndex &&
    cx &&
    cy &&
    isToday(payload)
  ) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={4} fill="#8dcdff" />
        <circle
          cx={cx}
          cy={cy}
          r={7}
          fill="#8dcdff"
          className="animate-pulse"
          opacity={0.3}
        />
      </g>
    );
  }

  // Show mention avatars if present
  if (payload?.hasMention && cx && cy && showMentionsOnChart) {
    const avatarIndex = forecastData.findIndex((d) => d.date === payload.date);
    const profileMentions = payload.mentions
      ? payload.mentions.filter((m: Mention) => m.type === "profile")
      : [];

    return (
      <g key={`mention-${payload.date}`} style={{ pointerEvents: "auto" }}>
        <circle
          cx={cx}
          cy={cy}
          r={12}
          fill="white"
          stroke="#8dcdff"
          strokeWidth={2}
        />
        {profileMentions.length > 0
          ? profileMentions.slice(0, 3).map((mention: Mention, idx: number) => {
              const offsetX = idx * -6;
              const offsetY = 0;
              const avatarSize = 20;
              const avatarRadius = avatarSize / 2;

              return (
                <g
                  key={`avatar-${payload.date}-${idx}`}
                  style={{
                    cursor: onMentionClick ? "pointer" : "default",
                  }}
                  onClick={(e) => handleMentionClick(payload, e)}
                >
                  <circle
                    cx={cx + offsetX}
                    cy={cy + offsetY}
                    r={avatarRadius + 2}
                    fill="white"
                    stroke="#8dcdff"
                    strokeWidth={2}
                  />
                  <circle
                    cx={cx + offsetX}
                    cy={cy + offsetY}
                    r={avatarRadius}
                    fill={`hsl(${
                      ((avatarIndex + idx) * 137.5) % 360
                    }, 70%, 50%)`}
                  />
                  <text
                    x={cx + offsetX}
                    y={cy + offsetY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="10"
                    fontWeight="bold"
                    fill="white"
                    style={{ pointerEvents: "none" }}
                  >
                    {mention.text?.charAt(0)?.toUpperCase() || "?"}
                  </text>
                  <defs>
                    <clipPath id={`avatarClip-${payload.date}-${idx}`}>
                      <circle
                        cx={cx + offsetX}
                        cy={cy + offsetY}
                        r={avatarRadius}
                      />
                    </clipPath>
                  </defs>
                </g>
              );
            })
          : [
              <g
                key={`avatar-${payload.date}`}
                style={{
                  cursor: onMentionClick ? "pointer" : "default",
                }}
                onClick={(e) => handleMentionClick(payload, e)}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={12}
                  fill="white"
                  stroke="#8dcdff"
                  strokeWidth={2}
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={10}
                  fill={`hsl(${(avatarIndex * 137.5) % 360}, 70%, 50%)`}
                />
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="10"
                  fontWeight="bold"
                  fill="white"
                  style={{ pointerEvents: "none" }}
                >
                  {payload.mentions?.[0]?.text?.charAt(0)?.toUpperCase() || "?"}
                </text>
              </g>,
            ]}
      </g>
    );
  }
  return <g />;
}

function ActiveDot({ cx, cy, payload, onClick }: ActiveDotProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!cx || !cy || !payload) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(payload);
    }
  };

  const iconSize = 14;
  const buttonSize = 24;
  const offsetY = buttonSize / 20;
  const scale = isHovered ? 1.1 : 1;
  const radius = (buttonSize / 2) * scale;

  return (
    <g
      style={{ pointerEvents: "auto", cursor: "pointer" }}
      transform={`translate(${cx}, ${cy + offsetY})`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <circle
        cx={0}
        cy={0}
        r={radius}
        fill="rgba(107, 114, 128, 0.8)"
        className="backdrop-blur-sm"
        style={{ filter: "blur(4px)", transition: "r 0.2s ease" }}
        opacity={0.6}
      />
      <circle
        cx={0}
        cy={0}
        r={radius}
        fill="#1f1f1f"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth={1}
        style={{ transition: "r 0.2s ease" }}
      />
      <foreignObject
        x={-iconSize / 2}
        y={-iconSize / 2}
        width={iconSize}
        height={iconSize}
        style={{ pointerEvents: "none" }}
      >
        <div className="flex items-center justify-center w-full h-full">
          <NotesIcon size={iconSize} className="text-white" />
        </div>
      </foreignObject>
    </g>
  );
}
export const AnalyticsChart = memo(AnalyticsChartComponent);
