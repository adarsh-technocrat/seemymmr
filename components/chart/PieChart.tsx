"use client";

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Sector,
  Tooltip,
} from "recharts";
import { ResponsiveContainer } from "recharts";
import {
  PieChartTooltip,
  type BreakdownData,
} from "@/components/dashboard/analytics/tooltips/PieChartTooltip";

const DEFAULT_COLORS = ["#4f6d85", "#4a6880", "#6b8aa7", "#7a99b5", "#2d3d4d"];

export interface PieChartData extends BreakdownData {}

interface PieChartProps {
  data: PieChartData[];
  colors?: string[];
  height?: string;
  /** Website color scheme for revenue in tooltip (hex). Defaults to #E78468. */
  colorScheme?: string;
}

export function PieChart({
  data,
  colors = DEFAULT_COLORS,
  height = "h-96",
  colorScheme = "#E78468",
}: PieChartProps) {
  const sanitizedData = data
    .map((item) => ({
      ...item,
      uv: typeof item.uv === "number" && !isNaN(item.uv) ? item.uv : 0,
      revenue:
        typeof item.revenue === "number" && !isNaN(item.revenue)
          ? item.revenue
          : 0,
    }))
    .filter((item) => item.uv >= 0);

  const pieData = sanitizedData.map((item) => ({
    ...item,
    name: item.name || "Unknown",
    value: item.uv || 0,
  }));

  const minPercentForLabel = 0.05;

  const renderCustomLabel = (props: any) => {
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      name,
      percent,
      payload,
    } = props;

    if (percent < minPercentForLabel) {
      return null;
    }

    const RADIAN = Math.PI / 180;
    const angle = -midAngle * RADIAN;

    // Calculate label position (further out)
    const radius = outerRadius + 80;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);

    // Line start point (on pie edge)
    const lineStartX = cx + outerRadius * Math.cos(angle);
    const lineStartY = cy + outerRadius * Math.sin(angle);

    // Elbow point (L-shape corner)
    const elbowRadius = outerRadius + 40;
    const elbowX = cx + elbowRadius * Math.cos(angle);
    const elbowY = cy + elbowRadius * Math.sin(angle);

    // Horizontal line extends left or right from elbow
    const horizontalX = x > cx ? elbowX + 40 : elbowX - 40;

    const imageRadius = (innerRadius + outerRadius) / 2;
    const imageX = cx + imageRadius * Math.cos(angle);
    const imageY = cy + imageRadius * Math.sin(angle);

    const referrersWithImages = payload?.referrers
      ? payload.referrers.filter((ref: any) => ref.image).slice(0, 3)
      : [];

    return (
      <g>
        {/* Leader line - from pie edge to elbow point (tilted) */}
        <line
          x1={lineStartX}
          y1={lineStartY}
          x2={elbowX}
          y2={elbowY}
          stroke="#6b8aa7"
          strokeWidth={2}
        />
        {/* Horizontal line from elbow to label (horizontal segment) */}
        <line
          x1={elbowX}
          y1={elbowY}
          x2={horizontalX}
          y2={elbowY}
          stroke="#6b8aa7"
          strokeWidth={2}
        />

        {/* Label text */}
        <text
          x={x > cx ? horizontalX + 10 : horizontalX - 10}
          y={elbowY}
          fill="currentColor"
          textAnchor={x > cx ? "start" : "end"}
          dominantBaseline="central"
          className="text-xs fill-textSecondary"
        >
          {name}
        </text>

        {referrersWithImages.length > 0 && (
          <g>
            {referrersWithImages.map((referrer: any, index: number) => {
              const iconSize = referrersWithImages.length === 1 ? 20 : 16;
              const spacing = 4;

              let iconX: number;
              let iconY: number;

              if (referrersWithImages.length === 1) {
                iconX = imageX - iconSize / 2;
                iconY = imageY - iconSize / 2;
              } else if (referrersWithImages.length === 2) {
                const totalWidth = 2 * iconSize + spacing;
                const startX = imageX - totalWidth / 2;
                iconX = startX + index * (iconSize + spacing);
                iconY = imageY - iconSize / 2;
              } else {
                if (index === 0) {
                  iconX = imageX - iconSize / 2;
                  iconY = imageY - iconSize - spacing / 2;
                } else {
                  const totalWidth = 2 * iconSize + spacing;
                  const startX = imageX - totalWidth / 2;
                  iconX = startX + (index - 1) * (iconSize + spacing);
                  iconY = imageY + spacing / 2;
                }
              }

              return (
                <image
                  key={`referrer-${index}`}
                  x={iconX}
                  y={iconY}
                  width={iconSize}
                  height={iconSize}
                  href={referrer.image}
                  mask="url(#circleMask)"
                  onError={(e: any) => {
                    e.target.style.display = "none";
                  }}
                />
              );
            })}
          </g>
        )}
      </g>
    );
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
      props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          fillOpacity={0.8}
        />
      </g>
    );
  };

  return (
    <div className={`relative w-full max-w-full ${height}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <defs>
            <mask id="circleMask">
              <circle cx="50%" cy="50%" r="50%" fill="white" />
            </mask>
          </defs>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            cornerRadius="5%"
            innerRadius="30%"
            label={renderCustomLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
            activeShape={renderActiveShape}
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip
            content={
              <PieChartTooltip
                allData={sanitizedData}
                colorScheme={colorScheme}
              />
            }
            cursor={{ fill: "transparent" }}
            animationDuration={200}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
