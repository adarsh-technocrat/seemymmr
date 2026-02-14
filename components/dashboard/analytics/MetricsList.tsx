"use client";

import NumberFlow from "@number-flow/react";
import { parseFormattedNumber } from "@/utils/number-utils";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronUpIcon } from "@/components/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipArrow,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function MetricVariation({
  variation,
  trend,
}: {
  variation: string;
  trend: "up" | "down";
}) {
  const noChange = variation === "0%";
  return (
    <div className="flex w-full flex-1 items-center gap-1 leading-none duration-150">
      <span className="text-textSecondary text-xs opacity-80">
        {noChange ? "—" : variation}
      </span>
      {!noChange && (
        <ChevronUpIcon
          className={`size-3 ${
            trend === "down"
              ? "text-red-500 dark:text-red-700"
              : "text-green-500 dark:text-green-600 rotate-180"
          }`}
        />
      )}
    </div>
  );
}

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
  showVisitorsOnChart: boolean;
  isConnected: boolean;
  currency?: string;
  /** Website color scheme for revenue indicators (hex). Defaults to #E78468. */
  colorScheme?: string;
  revenueBreakdown?: {
    newRevenue: number;
    renewalRevenue: number;
    refundedRevenue: number;
  } | null;
  onShowRevenueChange: (checked: boolean) => void;
  onShowMentionsChange: (checked: boolean) => void;
  onShowVisitorsChange: (checked: boolean) => void;
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
  showVisitorsOnChart,
  isConnected,
  currency = "USD",
  colorScheme = "#E78468",
  revenueBreakdown,
  onShowRevenueChange,
  onShowMentionsChange,
  onShowVisitorsChange,
}: MetricsListProps) {
  return (
    <ul className="grid grid-cols-3 flex-col overflow-x-scroll border-0 border-textPrimary/5 p-4 pb-6 max-md:gap-4 sm:flex-row md:flex lg:pb-4">
      <li>
        <div className="flex flex-col items-start gap-1 border-textPrimary/5 md:mr-6 md:border-r md:pr-6 select-none">
          <div className="flex cursor-pointer items-center gap-1.5">
            <Checkbox
              checked={showVisitorsOnChart}
              onCheckedChange={(checked) =>
                onShowVisitorsChange(checked === true)
              }
              className="data-[state=checked]:bg-white data-[state=checked]:border-[#7888b2] data-[state=checked]:text-[#7888b2]"
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
            <MetricVariation
              variation={visitors.variation}
              trend={visitors.trend}
            />
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
              style={
                showRevenueOnChart
                  ? {
                      backgroundColor: colorScheme,
                      borderColor: colorScheme,
                    }
                  : undefined
              }
            />
            <div className="text-textSecondary whitespace-nowrap text-xs md:text-sm">
              Revenue
            </div>
          </div>
          <div className="flex flex-col items-start">
            <TooltipProvider delayDuration={100} skipDelayDuration={0}>
              <Tooltip disableHoverableContent>
                <TooltipTrigger asChild>
                  <div className="whitespace-nowrap text-xl font-bold md:text-[1.65rem] md:leading-9 text-textPrimary cursor-help">
                    <NumberFlow
                      value={parseFormattedNumber(revenue.value)}
                      locales="en-US"
                      format={{
                        style: "currency",
                        currency: currency,
                        currencyDisplay: "symbol",
                        notation: "compact",
                        trailingZeroDisplay: "stripIfInteger",
                      }}
                    />
                  </div>
                </TooltipTrigger>
                {revenueBreakdown &&
                  (revenueBreakdown.newRevenue > 0 ||
                    revenueBreakdown.renewalRevenue > 0 ||
                    revenueBreakdown.refundedRevenue > 0) && (
                    <TooltipContent
                      side="top"
                      sideOffset={8}
                      className="bg-white border border-gray-200 rounded-lg p-2 min-w-[170px] shadow-lg"
                    >
                      <TooltipArrow
                        className="fill-white"
                        width={11}
                        height={5}
                        style={{
                          filter: "drop-shadow(0 1px 0 rgb(229 231 235))",
                        }}
                      />
                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold text-textPrimary">
                          REVENUE
                          <span className="ml-1.5 text-textPrimary">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: currency,
                              currencyDisplay: "symbol",
                            }).format(
                              revenueBreakdown.newRevenue +
                                revenueBreakdown.renewalRevenue,
                            )}
                          </span>
                        </div>
                        {revenueBreakdown.refundedRevenue > 0 && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <div
                                className="w-3 h-3 rounded-sm border-[1.5px] border-dashed opacity-80 overflow-hidden"
                                style={{
                                  borderColor: colorScheme,
                                }}
                              >
                                <div
                                  className="h-full w-full opacity-35"
                                  style={{
                                    backgroundColor: colorScheme,
                                  }}
                                ></div>
                              </div>
                              <span className="text-[11px] text-textSecondary">
                                Refunds
                              </span>
                            </div>
                            <span className="text-[11px] font-medium text-textPrimary">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: currency,
                                currencyDisplay: "symbol",
                              }).format(revenueBreakdown.refundedRevenue)}
                            </span>
                          </div>
                        )}
                        {revenueBreakdown.renewalRevenue > 0 && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <div
                                className="w-3 h-3 rounded-sm"
                                style={{
                                  backgroundColor: colorScheme,
                                  opacity: 0.6,
                                }}
                              ></div>
                              <span className="text-[11px] text-textSecondary">
                                Renewal
                              </span>
                            </div>
                            <span className="text-[11px] font-medium text-textPrimary">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: currency,
                                currencyDisplay: "symbol",
                              }).format(revenueBreakdown.renewalRevenue)}
                            </span>
                          </div>
                        )}
                        {revenueBreakdown.newRevenue > 0 && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <div
                                className="w-3 h-3 rounded-sm"
                                style={{
                                  backgroundColor: colorScheme,
                                }}
                              ></div>
                              <span className="text-[11px] text-textSecondary">
                                New
                              </span>
                            </div>
                            <span className="text-[11px] font-medium text-textPrimary">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: currency,
                                currencyDisplay: "symbol",
                              }).format(revenueBreakdown.newRevenue)}
                            </span>
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  )}
              </Tooltip>
            </TooltipProvider>
            <MetricVariation
              variation={revenue.variation}
              trend={revenue.trend}
            />
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
            <MetricVariation
              variation={conversionRate.variation}
              trend={conversionRate.trend}
            />
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
                  locales="en-US"
                  format={{
                    style: "currency",
                    currency: currency,
                    currencyDisplay: "symbol",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }}
                />
              </div>
            </div>
            <MetricVariation
              variation={revenuePerVisitor.variation}
              trend={revenuePerVisitor.trend}
            />
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
            <MetricVariation
              variation={bounceRate.variation}
              trend={bounceRate.trend}
            />
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
            <MetricVariation
              variation={sessionTime.variation}
              trend={sessionTime.trend}
            />
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
