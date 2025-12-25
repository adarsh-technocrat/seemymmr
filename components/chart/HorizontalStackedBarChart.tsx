"use client";

import { Bar, BarChart, XAxis, YAxis, LabelList } from "recharts";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Link2 } from "lucide-react";

export interface HorizontalStackedBarChartData {
  name: string;
  icon?: string | null;
  [key: string]: string | number | null | undefined;
}

interface HorizontalStackedBarChartProps {
  data: HorizontalStackedBarChartData[];
  config: ChartConfig;
  height?: string;
  maxItems?: number;
  showCard?: boolean;
}

export function HorizontalStackedBarChart({
  data,
  config,
  height = "h-96",
  maxItems = 10,
  showCard = true,
}: HorizontalStackedBarChartProps) {
  // Get the data keys from config (excluding name, icon)
  const dataKeys = Object.keys(config).filter(
    (key) => key !== "name" && key !== "icon"
  );

  // Limit data to maxItems
  const displayData = data.slice(0, maxItems);

  const getTotal = (item: HorizontalStackedBarChartData): number => {
    return dataKeys.reduce((sum, key) => {
      const value = item[key];
      return sum + (typeof value === "number" ? value : 0);
    }, 0);
  };

  const getIconUrl = (item: HorizontalStackedBarChartData): string | null => {
    if (item.icon) return item.icon;

    // Try to extract domain from name
    const cleanName = item.name
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, "")
      .trim();

    if (cleanName.includes(".")) {
      return `https://icons.duckduckgo.com/ip3/${cleanName}.ico`;
    }

    return null;
  };

  const getBarColor = (key: string): string => {
    if (key === "revenue") {
      return "#E16540";
    }
    return "#8dcdff";
  };

  const getBarOpacity = (key: string): number => {
    if (key === "revenue") {
      return 0.6;
    }

    return 1.0;
  };

  const truncateText = (
    text: string,
    maxWidth: number,
    fontSize: number = 14
  ): string => {
    if (!text) return "";
    // Approximate character width (roughly 0.6 * fontSize for most characters)
    const avgCharWidth = fontSize * 0.6;
    const maxChars = Math.floor((maxWidth - 12) / avgCharWidth); // -12 for ellipsis padding

    if (text.length <= maxChars) {
      return text;
    }

    return text.substring(0, maxChars - 3) + "...";
  };

  const chartContent = (
    <div className={`relative w-full max-w-full ${height}`}>
      <div className="absolute right-4 top-0 flex h-full flex-col justify-around py-4 z-10">
        {displayData.map((item, index) => {
          const total = getTotal(item);
          return (
            <div
              key={index}
              className="relative flex items-center justify-end text-sm font-medium text-foreground"
              style={{ height: `${100 / displayData.length}%` }}
            >
              {total.toLocaleString()}
            </div>
          );
        })}
      </div>

      <ChartContainer
        config={config}
        className={`h-full w-full max-w-full ${height}`}
      >
        <BarChart
          data={displayData}
          layout="vertical"
          margin={{ top: 16, right: 60, bottom: 16, left: 16 }}
          barCategoryGap="10%"
        >
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" hide />
          {dataKeys.map((key, index) => {
            const isFirst = index === 0;
            const isLast = index === dataKeys.length - 1;
            const barColor = getBarColor(key);
            const barOpacity = getBarOpacity(key);
            const radius = 4;
            return (
              <Bar
                key={key}
                dataKey={key}
                stackId="a"
                fill={barColor}
                fillOpacity={barOpacity}
                maxBarSize={30}
                radius={
                  isLast
                    ? [0, radius, radius, 0] // Rounded on right side (top-right and bottom-right)
                    : [0, 0, 0, 0] // No radius for bars that aren't the rightmost
                }
              >
                {isFirst && (
                  <LabelList
                    dataKey="name"
                    position="insideLeft"
                    offset={8}
                    content={(props: any) => {
                      const { x, y, width, height, index } = props;
                      const item = displayData[index];
                      const iconUrl = getIconUrl(item);
                      const isCampaignLabel = item.name?.startsWith("?");
                      const availableWidth = width - 8; // Leave some padding
                      const truncatedCampaignName = isCampaignLabel
                        ? truncateText(item.name || "", availableWidth)
                        : item.name;

                      if (isCampaignLabel) {
                        return (
                          <g>
                            <text
                              x={x + 8}
                              y={y + height / 2}
                              fill="currentColor"
                              fontSize={14}
                              dominantBaseline="middle"
                              className="fill-foreground"
                            >
                              {truncatedCampaignName}
                            </text>
                          </g>
                        );
                      }

                      // Regular label rendering for non-campaign data
                      return (
                        <g>
                          {/* Icon */}
                          {iconUrl ? (
                            <image
                              x={x}
                              y={y + height / 2 - 9}
                              width={18}
                              height={18}
                              href={iconUrl}
                              onError={(e: any) => {
                                // Fallback if icon fails to load
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <foreignObject
                              x={x}
                              y={y + height / 2 - 9}
                              width={18}
                              height={18}
                            >
                              <div className="flex h-full w-full items-center justify-center">
                                <Link2 className="size-[18px] opacity-60" />
                              </div>
                            </foreignObject>
                          )}

                          <text
                            x={x + 26}
                            y={y + height / 2}
                            fill="currentColor"
                            fontSize={14}
                            dominantBaseline="middle"
                            className="fill-foreground "
                          >
                            {item.name && item.name.length > 45
                              ? `${item.name.slice(0, 45)}...`
                              : item.name}
                          </text>
                        </g>
                      );
                    }}
                  />
                )}
              </Bar>
            );
          })}
        </BarChart>
      </ChartContainer>
    </div>
  );

  if (!showCard) {
    return chartContent;
  }

  return <div className="w-full max-w-full">{chartContent}</div>;
}
