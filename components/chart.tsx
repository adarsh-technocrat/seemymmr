"use client";

import { useState } from "react";
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
import NumberFlow from "@number-flow/react";

export interface Mention {
  text: string;
  url?: string;
  type: "profile" | "gear";
}

export interface ChartDataPoint {
  date: string;
  fullDate?: string;
  visitors: number;
  revenue: number;
  revenueNew?: number;
  revenueRefund?: number;
  revenuePerVisitor?: number;
  conversionRate?: number;
  hasMention?: boolean;
  mentions?: Mention[];
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
}

interface ChartProps {
  data: ChartDataPoint[];
  avatarUrls?: string[];
  showMentions?: boolean;
  showRevenue?: boolean;
  currency?: string;
  onMentionClick?: (data: ChartDataPoint) => void;
  height?: string;
}

export function Chart({
  data,
  avatarUrls = [],
  showMentions = true,
  showRevenue = true,
  currency = "USD",
  onMentionClick,
  height = "h-72 md:h-96",
}: ChartProps) {
  const [showMentionsOnChart, setShowMentionsOnChart] = useState(showMentions);

  const handleMentionClick = (payload: ChartDataPoint, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMentionClick) {
      onMentionClick(payload);
    }
  };

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

  const maxVisitors = Math.max(...data.map((d) => d.visitors), 0);

  const visitorTicks = calculateTicks(maxVisitors);

  const calculateVisitorDomainMax = (dataMax: number) =>
    calculateDomainMax(dataMax);

  const visitorDomain:
    | [number, number]
    | [number, (dataMax: number) => number] =
    maxVisitors <= 0
      ? ([0, 5] as [number, number])
      : [0, calculateVisitorDomainMax];

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload as ChartDataPoint;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[280px] max-w-[320px]">
          <div className="text-sm font-semibold text-textPrimary mb-3">
            {data.fullDate || data.date}
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-textSecondary">Visitors</span>
              <span className="font-semibold text-textPrimary">
                <NumberFlow
                  value={data.visitors}
                  format={{ notation: "standard" }}
                />
              </span>
            </div>
            <div className="border-t border-gray-100 pt-2 mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-textSecondary uppercase tracking-wide text-[0.7rem] opacity-75">
                  Revenue
                </span>
                <span className="font-semibold text-textPrimary">
                  <NumberFlow
                    value={data.revenue}
                    locales="en-US"
                    format={{
                      style: "currency",
                      currency: currency,
                      currencyDisplay: "symbol",
                      notation: "standard",
                    }}
                  />
                </span>
              </div>
              {data.revenueRefund && data.revenueRefund > 0 && (
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
                    <NumberFlow
                      value={data.revenueRefund}
                      locales="en-US"
                      format={{
                        style: "currency",
                        currency: currency,
                        currencyDisplay: "symbol",
                        notation: "standard",
                      }}
                    />
                  </span>
                </div>
              )}
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
                  <NumberFlow
                    value={data.revenueNew || data.revenue}
                    locales="en-US"
                    format={{
                      style: "currency",
                      currency: currency,
                      currencyDisplay: "symbol",
                      notation: "standard",
                    }}
                  />
                </span>
              </div>
            </div>
            {data.revenuePerVisitor !== undefined && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-textSecondary">Revenue/visitor</span>
                <span className="font-semibold text-textPrimary">
                  <NumberFlow
                    value={data.revenuePerVisitor}
                    locales="en-US"
                    format={{
                      style: "currency",
                      currency: currency,
                      currencyDisplay: "symbol",
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }}
                  />
                </span>
              </div>
            )}
            {data.conversionRate !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-textSecondary">Conversion rate</span>
                <span className="font-semibold text-textPrimary">
                  <NumberFlow
                    value={data.conversionRate * 100}
                    format={{
                      style: "percent",
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }}
                  />
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
          data={data}
          margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
          barCategoryGap="0%"
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
            interval="preserveStartEnd"
            tickMargin={8}
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
              dataKey="revenue"
              fill="#E16540"
              radius={[4, 4, 0, 0]}
              opacity={0.8}
              maxBarSize={30}
            />
          )}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="visitors"
            stroke="#8dcdff"
            strokeWidth={2.5}
            strokeLinecap="round"
            dot={(props: DotProps) => {
              const { cx, cy, payload } = props;
              if (payload?.hasMention && cx && cy && showMentionsOnChart) {
                const avatarIndex = data.findIndex(
                  (d) => d.date === payload.date
                );
                const profileMentions = payload.mentions
                  ? payload.mentions.filter(
                      (m: Mention) => m.type === "profile"
                    )
                  : [];

                return (
                  <g
                    key={`mention-${payload.date}`}
                    style={{ pointerEvents: "auto" }}
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={12}
                      fill="white"
                      stroke="#8dcdff"
                      strokeWidth={2}
                    />
                    {profileMentions.length > 0
                      ? profileMentions
                          .slice(0, 3)
                          .map((mention: Mention, idx: number) => {
                            const offsetX = idx * -6;
                            const offsetY = 0;
                            const avatarSize = 20;
                            const avatarRadius = avatarSize / 2;

                            return (
                              <g
                                key={`avatar-${payload.date}-${idx}`}
                                style={{
                                  cursor: onMentionClick
                                    ? "pointer"
                                    : "default",
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
                                  {mention.text?.charAt(0)?.toUpperCase() ||
                                    "?"}
                                </text>
                                <defs>
                                  <clipPath
                                    id={`avatarClip-${payload.date}-${idx}`}
                                  >
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
                              fill={`hsl(${
                                (avatarIndex * 137.5) % 360
                              }, 70%, 50%)`}
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
                              {payload.mentions?.[0]?.text
                                ?.charAt(0)
                                ?.toUpperCase() || "?"}
                            </text>
                          </g>,
                        ]}
                  </g>
                );
              }
              return <g />;
            }}
            activeDot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
