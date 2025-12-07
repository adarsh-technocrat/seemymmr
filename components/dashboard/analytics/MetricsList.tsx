"use client";

import NumberFlow from "@number-flow/react";
import { parseFormattedNumber } from "@/utils/number-utils";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronUpIcon } from "@/components/icons";

interface Metric {
  value: string;
  variation: string;
  trend: "up" | "down";
}

interface MetricsListProps {
  visitors: Metric;
  revenue: Metric;
  conversionRate: Metric;
  revenuePerVisitor: Metric;
  bounceRate: Metric;
  sessionTime: Metric;
  visitorsNow: { value: string };
  showRevenueOnChart: boolean;
  showMentionsOnChart: boolean;
  isConnected: boolean;
  onShowRevenueChange: (checked: boolean) => void;
  onShowMentionsChange: (checked: boolean) => void;
}

export function MetricsList({
  visitors,
  revenue,
  conversionRate,
  revenuePerVisitor,
  bounceRate,
  sessionTime,
  visitorsNow,
  showRevenueOnChart,
  showMentionsOnChart,
  isConnected,
  onShowRevenueChange,
  onShowMentionsChange,
}: MetricsListProps) {
  return (
    <ul className="grid grid-cols-3 flex-col overflow-x-scroll border-0 border-textPrimary/5 p-4 pb-6 max-md:gap-4 sm:flex-row md:flex lg:pb-4">
      <li>
        <div className="flex flex-col items-start gap-1 border-textPrimary/5 md:mr-6 md:border-r md:pr-6 select-none">
          <div className="flex cursor-pointer items-center gap-1.5">
            <Checkbox
              defaultChecked
              className="data-[state=checked]:bg-secondary"
            />
            <div className="text-textSecondary whitespace-nowrap text-xs md:text-sm">
              Visitors
            </div>
          </div>
          <div className="flex flex-col items-start">
            <div className="whitespace-nowrap text-xl font-bold md:text-[1.65rem] md:leading-9 text-textPrimary">
              <NumberFlow
                value={parseFormattedNumber(visitors.value)}
                format={{ notation: "compact" }}
              />
            </div>
            <div className="flex w-full flex-1 items-center gap-1 leading-none duration-150">
              <span className="text-textSecondary text-xs opacity-80">
                {visitors.variation}
              </span>
              <ChevronUpIcon
                className={`size-3 ${
                  visitors.trend === "down"
                    ? "text-red-500 dark:text-red-700"
                    : "text-green-500 dark:text-green-600 rotate-180"
                }`}
              />
            </div>
          </div>
        </div>
      </li>
      <li>
        <div className="flex flex-col items-start gap-1 border-textPrimary/5 md:mr-6 md:border-r md:pr-6 select-none">
          <div className="flex cursor-pointer items-center gap-1.5">
            <Checkbox
              checked={showRevenueOnChart}
              onCheckedChange={(checked) =>
                onShowRevenueChange(checked === true)
              }
              className="data-[state=checked]:bg-[#e78468] data-[state=checked]:border-[#e78468]"
            />
            <div className="text-textSecondary whitespace-nowrap text-xs md:text-sm">
              Revenue
            </div>
          </div>
          <div className="flex flex-col items-start">
            <div className="whitespace-nowrap text-xl font-bold md:text-[1.65rem] md:leading-9 text-textPrimary">
              <NumberFlow
                value={parseFormattedNumber(revenue.value)}
                format={{
                  style: "currency",
                  currency: "USD",
                  notation: "compact",
                  trailingZeroDisplay: "stripIfInteger",
                }}
              />
            </div>
            <div className="flex w-full flex-1 items-center gap-1 leading-none duration-150">
              <span className="text-textSecondary text-xs opacity-80">
                {revenue.variation}
              </span>
              <ChevronUpIcon
                className={`size-3 ${
                  revenue.trend === "down"
                    ? "text-red-500 dark:text-red-700"
                    : "text-green-500 dark:text-green-600 rotate-180"
                }`}
              />
            </div>
          </div>
        </div>
      </li>
      <li>
        <div className="flex flex-col items-start gap-1 border-textPrimary/5 md:mr-6 md:border-r md:pr-6">
          <div className="text-textSecondary whitespace-nowrap text-xs md:text-sm">
            Conversion rate
          </div>
          <div className="flex flex-col items-start">
            <div className="whitespace-nowrap text-xl font-bold md:text-[1.65rem] md:leading-9 text-textPrimary">
              <NumberFlow
                value={parseFormattedNumber(conversionRate.value)}
                format={{
                  style: "percent",
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 2,
                }}
              />
            </div>
            <div className="flex w-full flex-1 items-center gap-1 leading-none duration-150">
              <span className="text-textSecondary text-xs opacity-80">
                {conversionRate.variation}
              </span>
              <ChevronUpIcon
                className={`size-3 ${
                  conversionRate.trend === "down"
                    ? "text-red-500 dark:text-red-700"
                    : "text-green-500 dark:text-green-600 rotate-180"
                }`}
              />
            </div>
          </div>
        </div>
      </li>
      <li>
        <div className="flex flex-col items-start gap-1 border-textPrimary/5 md:mr-6 md:border-r md:pr-6">
          <div className="text-textSecondary whitespace-nowrap text-xs md:text-sm">
            Revenue/visitor
          </div>
          <div className="flex flex-col items-start">
            <div className="whitespace-nowrap text-xl font-bold md:text-[1.65rem] md:leading-9 text-textPrimary">
              <div className="flex items-baseline gap-2">
                <NumberFlow
                  value={parseFormattedNumber(revenuePerVisitor.value)}
                  format={{
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }}
                />
              </div>
            </div>
            <div className="flex w-full flex-1 items-center gap-1 leading-none duration-150">
              <span className="text-textSecondary text-xs opacity-80">
                {revenuePerVisitor.variation}
              </span>
              <ChevronUpIcon
                className={`size-3 ${
                  revenuePerVisitor.trend === "down"
                    ? "text-red-500 dark:text-red-700"
                    : "text-green-500 dark:text-green-600 rotate-180"
                }`}
              />
            </div>
          </div>
        </div>
      </li>
      <li>
        <div className="flex flex-col items-start gap-1 border-textPrimary/5 md:mr-6 md:border-r md:pr-6">
          <div className="text-textSecondary whitespace-nowrap text-xs md:text-sm">
            Bounce rate
          </div>
          <div className="flex flex-col items-start">
            <div className="whitespace-nowrap text-xl font-bold md:text-[1.65rem] md:leading-9 text-textPrimary">
              <NumberFlow
                value={parseFormattedNumber(bounceRate.value)}
                format={{
                  style: "percent",
                  maximumFractionDigits: 0,
                }}
              />
            </div>
            <div className="flex w-full flex-1 items-center gap-1 leading-none duration-150">
              <span className="text-textSecondary text-xs opacity-80">
                {bounceRate.variation}
              </span>
              <ChevronUpIcon
                className={`size-3 ${
                  bounceRate.trend === "down"
                    ? "text-red-500 dark:text-red-700"
                    : "text-green-500 dark:text-green-600"
                }`}
              />
            </div>
          </div>
        </div>
      </li>
      <li>
        <div className="flex flex-col items-start gap-1 border-textPrimary/5 md:mr-6 md:border-r md:pr-6">
          <div className="text-textSecondary whitespace-nowrap text-xs md:text-sm">
            Session time
          </div>
          <div className="flex flex-col items-start">
            <div className="whitespace-nowrap text-xl font-bold md:text-[1.65rem] md:leading-9 text-textPrimary">
              {sessionTime.value}
            </div>
            <div className="flex w-full flex-1 items-center gap-1 leading-none duration-150">
              <span className="text-textSecondary text-xs opacity-80">
                {sessionTime.variation}
              </span>
              <ChevronUpIcon
                className={`size-3 ${
                  sessionTime.trend === "down"
                    ? "text-red-500 dark:text-red-700"
                    : "text-green-500 dark:text-green-600 rotate-180"
                }`}
              />
            </div>
          </div>
        </div>
      </li>
      <li>
        <div className="flex flex-col items-start gap-1 border-0! select-none cursor-pointer group/metric">
          <div className="flex items-center gap-0">
            <div className="text-textSecondary whitespace-nowrap text-xs md:text-sm duration-100">
              Visitors now
            </div>
            <span className="relative ml-1.5 inline-flex size-2">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                  isConnected ? "bg-green-500" : "bg-gray-400"
                }`}
              ></span>
              <span
                className={`relative inline-flex size-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-gray-400"
                }`}
              ></span>
            </span>
          </div>
          <div className="relative flex flex-col items-start overflow-hidden">
            <div className="absolute w-full animate-dropIn transition-transform duration-100 ease-in-out">
              <div className="whitespace-nowrap text-xl font-bold md:text-[1.65rem] md:leading-9 text-textPrimary">
                <NumberFlow
                  value={parseInt(visitorsNow.value) || 0}
                  format={{ notation: "standard" }}
                />
              </div>
            </div>
            <div className="opacity-0">
              <div className="whitespace-nowrap text-xl font-bold md:text-[1.65rem] md:leading-9 text-textPrimary">
                <NumberFlow
                  value={parseInt(visitorsNow.value) || 0}
                  format={{ notation: "standard" }}
                />
              </div>
            </div>
          </div>
        </div>
      </li>
    </ul>
  );
}
