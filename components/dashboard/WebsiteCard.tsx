"use client";

import Link from "next/link";
import { useAnalytics } from "@/hooks/use-analytics";
import { ResponsiveContainer, Area, ComposedChart, Bar, YAxis } from "recharts";
import NumberFlow from "@number-flow/react";
import { DomainLogo } from "@/components/ui/domain-logo";

interface WebsiteCardProps {
  website: {
    _id: string;
    domain: string;
    name: string;
    iconUrl?: string;
  };
}

export function WebsiteCard({ website }: WebsiteCardProps) {
  const analytics = useAnalytics(website._id, {
    period: "Today",
    granularity: "hourly",
    disableAutoFetch: false,
  });

  const chartData = analytics.chartData.map((point) => {
    const newRev = point.revenueNew ?? 0;
    const renewalRev = point.revenueRenewal ?? 0;
    const refundRev = point.revenueRefund ?? 0;
    const netRevenue = newRev + renewalRev - refundRev;
    return {
      visitors: point.visitors,
      revenue: Math.max(0, netRevenue),
      revenueNew: newRev,
      revenueRenewal: renewalRev,
      revenueRefund: refundRev,
    };
  });

  const totalVisitors = analytics.chartData.reduce(
    (sum, point) => sum + point.visitors,
    0,
  );

  const totalRevenue = chartData.reduce((sum, point) => sum + point.revenue, 0);
  const formattedRevenue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(totalRevenue);

  return (
    <li>
      <Link href={`/dashboard/${website._id}`}>
        <article className="custom-card custom-card-hover p-4">
          <div className="flex flex-row gap-2">
            <div>
              <DomainLogo
                domain={website.domain}
                iconUrl={website.iconUrl}
                size={24}
                alt={website.name}
                className="size-5 rounded"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-stone-800">
                {website.name}
              </h3>
              <div className="relative h-20">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                      <defs>
                        <linearGradient
                          id={`visitorGradient-${website._id}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#7888b2"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="40%"
                            stopColor="#7888b2"
                            stopOpacity={0.1}
                          />
                          <stop
                            offset="100%"
                            stopColor="#7888b2"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <YAxis hide />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        hide
                        domain={[
                          0,
                          (dataMax: number) => Math.max(dataMax * 1.2, 1),
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="visitors"
                        stroke="#8dcdff"
                        strokeWidth={2.5}
                        fill={`url(#visitorGradient-${website._id})`}
                        fillOpacity={0.6}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="revenue"
                        fill="#E16540"
                        maxBarSize={10}
                        radius={[2, 2, 0, 0]}
                        name="Revenue"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="recharts-responsive-container select-none w-full h-full">
                    <div className="recharts-wrapper chart-mixed cursor-pointer relative w-full h-full max-h-20">
                      <svg
                        className="recharts-surface w-full h-full"
                        viewBox="0 0 286 80"
                      >
                        <defs>
                          <linearGradient
                            id={`visitorGradient-${website._id}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#7888b2"
                              stopOpacity="0.4"
                            />
                            <stop
                              offset="40%"
                              stopColor="#7888b2"
                              stopOpacity="0.1"
                            />
                            <stop
                              offset="100%"
                              stopColor="#7888b2"
                              stopOpacity="0"
                            />
                          </linearGradient>
                        </defs>
                        <g className="recharts-layer recharts-area">
                          <path
                            strokeWidth="0"
                            fill={`url(#visitorGradient-${website._id})`}
                            fillOpacity="0.6"
                            className="recharts-curve recharts-area-area"
                            d="M0,72L2.072,72C4.145,72,8.29,72,12.435,72C16.58,72,20.725,72,24.87,72C29.014,72,33.159,72,37.304,72C41.449,72,45.594,72,49.739,72C53.884,72,58.029,72,62.174,72C66.319,72,70.464,72,74.609,72C78.754,72,82.899,72,87.043,72C91.188,72,95.333,72,99.478,72C103.623,72,107.768,72,111.913,72C116.058,72,120.203,72,124.348,72C128.493,72,132.638,72,136.783,72C140.928,72,145.072,72,149.217,72C153.362,72,157.507,72,161.652,72C165.797,72,169.942,72,174.087,72C178.232,72,182.377,72,186.522,72C190.667,72,194.812,72,198.957,72C203.101,72,207.246,72,211.391,72C215.536,72,219.681,72,223.826,72C227.971,72,232.116,72,236.261,72C240.406,72,244.551,72,248.696,72C252.841,72,256.986,72,261.13,72C265.275,72,269.42,72,273.565,72C277.71,72,281.855,72,283.928,72L286,72L286,72L283.928,72C281.855,72,277.71,72,273.565,72C269.42,72,265.275,72,261.13,72C256.986,72,252.841,72,248.696,72C244.551,72,240.406,72,236.261,72C232.116,72,227.971,72,223.826,72C219.681,72,215.536,72,211.391,72C207.246,72,203.101,72,198.957,72C194.812,72,190.667,72,186.522,72C182.377,72,178.232,72,174.087,72C169.942,72,165.797,72,161.652,72C157.507,72,153.362,72,149.217,72C145.072,72,140.928,72,136.783,72C132.638,72,128.493,72,124.348,72C120.203,72,116.058,72,111.913,72C107.768,72,103.623,72,99.478,72C95.333,72,91.188,72,87.043,72C82.899,72,78.754,72,74.609,72C70.464,72,66.319,72,62.174,72C58.029,72,53.884,72,49.739,72C45.594,72,41.449,72,37.304,72C33.159,72,29.014,72,24.87,72C20.725,72,16.58,72,12.435,72C8.29,72,4.145,72,2.072,72L0,72Z"
                          />
                          <path
                            stroke="#8dcdff"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            fill="none"
                            className="recharts-curve recharts-line-curve"
                            d="M0,72L2.072,72C4.145,72,8.29,72,12.435,72C16.58,72,20.725,72,24.87,72C29.014,72,33.159,72,37.304,72C41.449,72,45.594,72,49.739,72C53.884,72,58.029,72,62.174,72C66.319,72,70.464,72,74.609,72C78.754,72,82.899,72,87.043,72C91.188,72,95.333,72,99.478,72C103.623,72,107.768,72,111.913,72C116.058,72,120.203,72,124.348,72C128.493,72,132.638,72,136.783,72C140.928,72,145.072,72,149.217,72C153.362,72,157.507,72,161.652,72C165.797,72,169.942,72,174.087,72C178.232,72,182.377,72,186.522,72C190.667,72,194.812,72,198.957,72C203.101,72,207.246,72,211.391,72C215.536,72,219.681,72,223.826,72C227.971,72,232.116,72,236.261,72C240.406,72,244.551,72,248.696,72C252.841,72,256.986,72,261.13,72C265.275,72,269.42,72,273.565,72C277.71,72,281.855,72,283.928,72L286,72"
                          />
                        </g>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-start gap-3 flex-wrap">
                <p className="text-stone-600 text-sm">
                  <span className="font-semibold text-stone-800">
                    <NumberFlow
                      value={totalVisitors}
                      format={{ notation: "standard" }}
                    />
                  </span>{" "}
                  <span>visitors</span>
                </p>
                <p className="text-stone-600 text-sm">
                  <span className="font-semibold text-stone-800">
                    {formattedRevenue}
                  </span>{" "}
                  <span>revenue</span>
                </p>
              </div>
            </div>
          </div>
        </article>
      </Link>
    </li>
  );
}
