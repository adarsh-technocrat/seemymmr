"use client";

export interface ReferrerData {
  name: string;
  channel?: string;
  uv?: number;
  image?: string | null;
  isAlternativeSource?: boolean;
  referrerType?: string;
  originalValue?: string;
  hasPaidMedium?: boolean;
  paidMediumHint?: string | null;
  revenue?: number;
  paymentCount?: number;
  conversionRate?: number;
  goalCount?: number;
  goalConversionRate?: number;
}

export interface BreakdownData {
  name: string;
  uv: number;
  revenue?: number;
  image?: string;
  flag?: string;
  color?: string;
  conversionRate?: number;
  goalCount?: number;
  goalConversionRate?: number;
  hostname?: string;
  countryCode?: string;
  referrers?: ReferrerData[];
}

interface RechartsPiePayload {
  name?: string;
  value?: number;
  payload?: {
    payload?: BreakdownData;
    stroke?: string;
    fill?: string;
    cx?: string | number;
    cy?: string | number;
  };
  dataKey?: string;
}

interface PieTooltipProps {
  active?: boolean;
  payload?: RechartsPiePayload[];
  allData?: BreakdownData[];
  colorScheme?: string;
}

const DEFAULT_COLORS = ["#4f6d85", "#4a6880", "#6b8aa7", "#7a99b5", "#2d3d4d"];

export const PieChartTooltip = ({
  active,
  payload,
  allData,
  colorScheme = "#E78468",
}: PieTooltipProps) => {
  if (!active || !payload || !payload.length || !allData) {
    return null;
  }

  const activePayload = payload[0];
  // Recharts wraps our data: payload.payload.payload contains the BreakdownData
  const activeChannel = activePayload?.payload?.payload;

  if (!activeChannel) {
    return null;
  }

  const channelVisitors = activeChannel?.uv || 0;
  const channelRevenue = activeChannel?.revenue || 0;

  const topReferrers = activeChannel?.referrers
    ? [...activeChannel.referrers]
        .sort((a, b) => (b.uv || 0) - (a.uv || 0))
        .slice(0, 3)
        .map((ref) => ({
          ...ref,
          percent:
            channelVisitors > 0 ? ((ref.uv || 0) / channelVisitors) * 100 : 0,
        }))
    : [];

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toLocaleString("en-US");
  };

  const formatCurrency = (cents: number) => {
    const dollars = cents / 100;
    if (dollars >= 1000) {
      return `$${(dollars / 1000).toFixed(1)}k`;
    }
    return `$${dollars.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const channelName = activeChannel?.name || "Unknown";

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2.5 min-w-[200px] max-w-[240px]">
      <div className="mb-2.5 pb-2.5 border-b border-gray-100">
        <div className="text-sm font-semibold text-textPrimary truncate">
          {channelName}
        </div>
      </div>

      <div className="space-y-1.5 text-[0.7rem] mb-2.5 pb-2.5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{
                backgroundColor: "#8dcdff",
              }}
            ></div>
            <span className="text-textSecondary">Visitors</span>
          </div>
          <span className="font-semibold text-textPrimary">
            {formatNumber(channelVisitors)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{
                backgroundColor: colorScheme,
              }}
            ></div>
            <span className="text-textSecondary">Revenue</span>
          </div>
          <span className="font-semibold text-textPrimary">
            {formatCurrency(channelRevenue)}
          </span>
        </div>
      </div>
      {topReferrers.length > 0 && (
        <div>
          <div className="text-textSecondary uppercase tracking-wide text-[0.65rem] opacity-75 mb-1.5">
            TOP SOURCES
          </div>
          <div className="space-y-1.5">
            {topReferrers.map((referrer, index) => {
              const referrerImage = referrer.image;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between text-[0.7rem]"
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {referrerImage ? (
                      <img
                        src={referrerImage}
                        alt={referrer.name}
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            DEFAULT_COLORS[index % DEFAULT_COLORS.length],
                        }}
                      />
                    )}
                    <span className="text-textPrimary truncate">
                      {referrer.name}
                    </span>
                  </div>
                  <span className="font-semibold text-textPrimary ml-1.5">
                    {referrer.percent.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
