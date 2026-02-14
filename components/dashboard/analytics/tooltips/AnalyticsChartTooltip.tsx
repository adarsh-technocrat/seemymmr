"use client";

import { formatDateDisplay } from "@/utils/analytics/chart";
import type {
  ChartDataPoint,
  Mention,
} from "@/components/chart/AnalyticsChart";

interface AnalyticsChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataPoint;
    value?: number;
    name?: string;
  }>;
  currency?: string;
  colorScheme?: string;
}

export const AnalyticsChartTooltip = ({
  active,
  payload,
  currency = "USD",
  colorScheme = "#E78468",
}: AnalyticsChartTooltipProps) => {
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
                      backgroundColor: colorScheme,
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
                      backgroundColor: colorScheme,
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
