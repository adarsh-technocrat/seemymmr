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
  shouldHaveRadiusForNew,
  shouldHaveRadiusForRenewal,
  shouldHaveRadiusForRefund,
  createRoundedTopRectPath,
} from "@/utils/analytics/chart";
import { NotesIcon } from "@/components/icons";
import { Spinner } from "@/components/ui/spinner";
import { AnalyticsChartTooltip } from "@/components/dashboard/analytics/tooltips/AnalyticsChartTooltip";

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
  visitorsForChart?: number | null;
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
  if (!x || !y || !width || !height || isNaN(height) || !isFinite(height))
    return <g />;

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
  if (!x || !y || !width || !height || isNaN(height) || !isFinite(height))
    return <g />;

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
  if (!x || !y || !width || !height || isNaN(height) || !isFinite(height))
    return <g />;

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
  showVisitors?: boolean;
  currency?: string;
  onMentionClick?: (data: ChartDataPoint) => void;
  onNoteClick?: (data: ChartDataPoint) => void;
  height?: string;
  loading?: boolean;
}

function AnalyticsChartComponent({
  data,
  avatarUrls = [],
  showMentions = true,
  showRevenue = true,
  showVisitors = true,
  currency = "USD",
  onMentionClick,
  onNoteClick,
  height = "h-72 md:h-96",
  loading = false,
}: AnalyticsChartProps) {
  const [showMentionsOnChart, setShowMentionsOnChart] = useState(showMentions);

  if (!data || data.length === 0) {
    return (
      <div className="p-4">
        <div
          className={`flex items-center justify-center w-full ${height} rounded-lg bg-muted/30 border border-borderColor/50`}
          aria-hidden={!loading}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-textSecondary">
              <Spinner className="size-8" aria-label="Loading chart" />
              <span className="text-sm">Loading chart...</span>
            </div>
          ) : (
            <span className="text-sm text-textSecondary">
              No chart data for this period
            </span>
          )}
        </div>
      </div>
    );
  }

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
  const maxRevenue = Math.max(
    ...data.map((d) => (typeof d.revenue === "number" ? d.revenue : 0)),
    0,
  );

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

    // For today: use real-time projection (only show up to current time index).
    // Use 0 for null/empty buckets so the visitor line is continuous (no gaps).
    // Future hours (past current time) stay null so the line doesn't extend into the future.
    let solidLineValue: number | null = null;
    let visitorsForChart: number | null = null;
    if (itemIsToday) {
      const inRange = currentTimeIndex !== null && index <= currentTimeIndex;
      const raw = item.visitors ?? null;
      if (inRange) {
        solidLineValue = raw !== null ? raw : 0;
        visitorsForChart = raw !== null ? raw : 0;
      } else {
        solidLineValue = null;
        visitorsForChart = null;
      }
    } else {
      solidLineValue =
        item.visitors !== null && item.visitors !== undefined
          ? item.visitors
          : 0;
      visitorsForChart =
        item.visitors !== null && item.visitors !== undefined
          ? item.visitors
          : 0;
    }

    const sanitizeRevenue = (
      value: number | undefined | null,
    ): number | undefined => {
      if (value === null || value === undefined) return undefined;
      const num = typeof value === "number" ? value : Number(value);
      return !isNaN(num) && isFinite(num) ? num : undefined;
    };

    return {
      ...item,
      isForecast,
      solidLineValue,
      visitorsForChart,
      // Dashed line value: only for currentTimeIndex (today only)
      dashedLineValue:
        currentTimeIndex !== null && index === currentTimeIndex && itemIsToday
          ? (item.visitors ?? null)
          : null,
      // Sanitize revenue values
      revenueNew: sanitizeRevenue(item.revenueNew),
      revenueRenewal: sanitizeRevenue(item.revenueRenewal),
      revenueRefund: sanitizeRevenue(item.revenueRefund),
      revenue: sanitizeRevenue(item.revenue) ?? 0,
      revenuePerVisitor: sanitizeRevenue(item.revenuePerVisitor),
      conversionRate: sanitizeRevenue(item.conversionRate),
    };
  });

  const hasHourlyLabels =
    data[0]?.date?.includes("am") ?? data[0]?.date?.includes("pm");
  const nonZeroBuckets = data.filter(
    (d) =>
      (d.visitors ?? 0) > 0 || (typeof d.revenue === "number" && d.revenue > 0),
  ).length;
  const isSparse =
    hasHourlyLabels &&
    data.length > 4 &&
    nonZeroBuckets <= Math.ceil(data.length / 4);

  return (
    <div className={`flex flex-col gap-1 ${height}`}>
      {isSparse && (
        <p
          className="text-xs text-muted-foreground text-center px-2 py-0.5"
          role="status"
        >
          Most of this period has no activity yet. Data updates as visitors and
          payments are recorded.
        </p>
      )}
      <div className="flex-1 min-h-0">
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
            {showVisitors && (
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
            )}
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
                domain={
                  maxRevenue <= 0
                    ? [0, 10]
                    : [0, (dataMax: number) => Math.max(dataMax * 1.2, 10)]
                }
                ticks={maxRevenue <= 0 ? [0, 5, 10] : undefined}
                tickCount={maxRevenue <= 0 ? undefined : 5}
              />
            )}

            <Tooltip content={<AnalyticsChartTooltip currency={currency} />} />
            {showVisitors && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="visitorsForChart"
                stroke="transparent"
                strokeWidth={0}
                fill="url(#visitorGradient)"
                fillOpacity={0.6}
                connectNulls={false}
              />
            )}

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
            {showVisitors && (
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
                dot={(props: DotProps & { key?: React.Key }) => {
                  const { key, ...restProps } = props;
                  return (
                    <ChartDot
                      key={key}
                      {...restProps}
                      currentTimeIndex={currentTimeIndex}
                      forecastData={forecastData}
                      showMentionsOnChart={showMentionsOnChart}
                      onMentionClick={onMentionClick}
                    />
                  );
                }}
                activeDot={(props: DotProps) => (
                  <ActiveDot {...props} onClick={onNoteClick} />
                )}
                connectNulls={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
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
