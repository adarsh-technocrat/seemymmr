"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState, use } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function WebsiteAnalyticsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const [selectedPeriod, setSelectedPeriod] = useState("Last 30 days");
  const [selectedGranularity, setSelectedGranularity] = useState("Hourly");
  const [selectedSourceTab, setSelectedSourceTab] = useState("Channel");
  const [selectedPathTab, setSelectedPathTab] = useState("Page");
  const [selectedLocationTab, setSelectedLocationTab] = useState("Country");
  const [selectedSystemTab, setSelectedSystemTab] = useState("Browser");
  const [selectedGoalTab, setSelectedGoalTab] = useState("Goal");

  // Dummy data for charts - matching the exact structure from the reference
  const hourlyData = [
    { time: "12am", visitors: 72 },
    { time: "2am", visitors: 72 },
    { time: "5am", visitors: 72 },
    { time: "8am", visitors: 72 },
    { time: "11am", visitors: 72 },
    { time: "2pm", visitors: 72 },
    { time: "5pm", visitors: 72 },
    { time: "8pm", visitors: 72 },
    { time: "11pm", visitors: 72 },
  ];

  // Metrics data with variations and trends
  const metricsData = {
    visitors: { value: "18.9k", variation: "-12.7%", trend: "down" },
    revenue: { value: "$28.3k", variation: "+45.4%", trend: "up" },
    conversionRate: { value: "0.60%", variation: "+63.3%", trend: "up" },
    revenuePerVisitor: { value: "$1.49", variation: "+66.5%", trend: "up" },
    bounceRate: { value: "83%", variation: "-1.2%", trend: "up" },
    sessionTime: { value: "2m 41s", variation: "+1.4%", trend: "up" },
    visitorsNow: { value: "2" },
  };

  const sourceData = [
    { name: "Direct", value: 45 },
    { name: "Google", value: 30 },
    { name: "Social", value: 15 },
    { name: "Referral", value: 10 },
  ];

  const pathData = [
    { name: "/", value: 120 },
    { name: "/about", value: 80 },
    { name: "/products", value: 60 },
    { name: "/contact", value: 40 },
  ];

  const locationData = [
    { name: "United States", value: 150 },
    { name: "United Kingdom", value: 80 },
    { name: "Canada", value: 50 },
    { name: "Germany", value: 30 },
    { name: "Other", value: 40 },
  ];

  const systemData = [
    { name: "Chrome", value: 180 },
    { name: "Safari", value: 100 },
    { name: "Firefox", value: 50 },
    { name: "Edge", value: 20 },
  ];

  const COLORS = ["#8dcdff", "#7888b2", "#E16540", "#94a3b8", "#cbd5e1"];

  // Calculate totals
  const totalVisitors = "18.9k";
  const visitorsNow = metricsData.visitorsNow.value;

  return (
    <>
      <main className="mx-auto min-h-screen max-w-6xl px-4 pb-32 md:px-8 bg-background">
        {/* Top Controls Section */}
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center mt-6">
          <div className="flex w-full flex-col items-center gap-4 sm:flex-row">
            {/* Website Selector */}
            <div className="relative inline-block shrink-0">
              <div className="join-divider border border-borderColor bg-white rounded-md overflow-hidden">
                <button className="btn join-item btn-sm h-8 inline-flex shrink-0 flex-nowrap items-center gap-2 whitespace-nowrap border-0 bg-transparent text-textPrimary hover:bg-gray-50 px-3">
                  <Image
                    src="https://icons.duckduckgo.com/ip3/uxmagic.ai.ico"
                    alt="uxmagic.ai"
                    className="size-5! rounded"
                    width={20}
                    height={20}
                    unoptimized
                  />
                  <h3 className="text-base font-normal">uxmagic.ai</h3>
                </button>
                <Link
                  href={`/dashboard/${websiteId}/settings`}
                  className="btn btn-square join-item btn-sm h-8 w-8 p-0 border-0 border-l border-borderColor bg-transparent text-textPrimary hover:bg-gray-50 flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-settings size-4"
                  >
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </Link>
              </div>
            </div>

            {/* Period Selector */}
            <div className="relative">
              <div className="join-divider relative z-10 border border-borderColor bg-white rounded-md overflow-hidden">
                <button
                  className="btn btn-square btn-ghost join-item btn-sm h-8 w-8 p-0 border-0 bg-transparent text-textPrimary hover:bg-gray-50 flex items-center justify-center"
                  aria-label="Previous period"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-chevron-left size-4"
                  >
                    <path d="m15 18-6-6 6-6"></path>
                  </svg>
                </button>
                <button className="btn join-item btn-sm h-8 inline-flex flex-nowrap items-center gap-2 whitespace-nowrap border-0 border-l border-borderColor bg-transparent text-textPrimary hover:bg-gray-50 px-3">
                  <h3 className="text-base font-normal">{selectedPeriod}</h3>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-chevron-down size-3.5 shrink-0 opacity-30 duration-200"
                  >
                    <path d="m6 9 6 6 6-6"></path>
                  </svg>
                </button>
                <button
                  disabled
                  className="btn btn-square btn-ghost join-item btn-sm h-8 w-8 p-0 border-0 border-l border-borderColor bg-transparent text-textSecondary opacity-30 cursor-not-allowed flex items-center justify-center"
                  aria-label="Next period"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-chevron-right size-4"
                  >
                    <path d="m9 18 6-6-6-6"></path>
                  </svg>
                </button>
              </div>
            </div>

            {/* Granularity Selector */}
            <div className="hidden sm:block">
              <div className="relative h-8">
                <button className="single-item-join-divider btn btn-sm h-8 inline-flex shrink-0 flex-nowrap items-center gap-2 whitespace-nowrap border border-borderColor bg-white text-textPrimary hover:bg-gray-50 rounded-md px-3">
                  <span className="text-base font-normal">
                    {selectedGranularity}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-chevron-down size-3.5 shrink-0 opacity-30 duration-200"
                  >
                    <path d="m6 9 6 6 6-6"></path>
                  </svg>
                </button>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              className="single-item-join-divider group btn btn-square btn-sm h-8 w-8 max-md:hidden border border-borderColor bg-white text-textPrimary hover:bg-gray-50 rounded-md p-0 flex items-center justify-center"
              title="Refresh analytics data (Cmd+R / Ctrl+R)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="size-4"
              >
                <path
                  fillRule="evenodd"
                  d="M13.836 2.477a.75.75 0 0 1 .75.75v3.182a.75.75 0 0 1-.75.75h-3.182a.75.75 0 0 1 0-1.5h1.37l-.84-.841a4.5 4.5 0 0 0-7.08.932.75.75 0 0 1-1.3-.75 6 6 0 0 1 9.44-1.242l.842.84V3.227a.75.75 0 0 1 .75-.75Zm-.911 7.5A.75.75 0 0 1 13.199 10a6 6 0 0 1-9.44 1.241l-.84-.84v1.371a.75.75 0 0 1-1.5 0V8.591a.75.75 0 0 1 .75-.75H5.35a.75.75 0 0 1 0 1.5H3.98l.841.841a4.5 4.5 0 0 0 7.08-.932.75.75 0 0 1 1.025-.273Z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
          </div>
        </section>

        {/* Analytics Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Main Analytics Card - Full Width */}
          <div className="md:col-span-2">
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="flex-1">
                <section className="custom-card group">
                  {/* Metrics List */}
                  <ul className="grid grid-cols-3 flex-col overflow-x-scroll border-0 border-textPrimary/5 p-4 max-md:gap-4 sm:flex-row md:flex lg:pb-2">
                    <li>
                      <div className="flex flex-col items-start gap-1 border-textPrimary/5 md:mr-6 md:border-r md:pr-6 select-none">
                        <div className="flex cursor-pointer items-center gap-1.5">
                          <input
                            className="checkbox size-4 rounded checkbox-secondary"
                            type="checkbox"
                            defaultChecked
                          />
                          <div className="text-textSecondary whitespace-nowrap text-xs md:text-sm">
                            Visitors
                          </div>
                        </div>
                        <div className="flex flex-col items-start">
                          <div className="whitespace-nowrap text-xl font-bold md:text-[1.65rem] md:leading-9 text-textPrimary">
                            {metricsData.visitors.value}
                          </div>
                          <div className="flex w-full flex-1 items-center gap-1 leading-none duration-150">
                            <span className="text-textSecondary text-xs opacity-80">
                              {metricsData.visitors.variation}
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                              className={`size-3 ${
                                metricsData.visitors.trend === "down"
                                  ? "text-red-500 dark:text-red-700"
                                  : "text-green-500 dark:text-green-600 rotate-180"
                              }`}
                              strokeWidth="2"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8 2a.75.75 0 0 1 .75.75v8.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.22 3.22V2.75A.75.75 0 0 1 8 2Z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="flex flex-col items-start gap-1 border-textPrimary/5 md:mr-6 md:border-r md:pr-6 select-none">
                        <div className="flex cursor-pointer items-center gap-1.5">
                          <input
                            className="checkbox size-4 rounded"
                            type="checkbox"
                            defaultChecked
                            style={
                              {
                                "--chkbg": "#e78468",
                                "--chkfg": "#ffffff",
                                borderColor: "rgb(231, 132, 104)",
                              } as React.CSSProperties
                            }
                          />
                          <div className="text-textSecondary whitespace-nowrap text-xs md:text-sm">
                            Revenue
                          </div>
                        </div>
                        <div className="flex flex-col items-start">
                          <div className="whitespace-nowrap text-xl font-bold md:text-[1.65rem] md:leading-9 text-textPrimary">
                            {metricsData.revenue.value}
                          </div>
                          <div className="flex w-full flex-1 items-center gap-1 leading-none duration-150">
                            <span className="text-textSecondary text-xs opacity-80">
                              {metricsData.revenue.variation}
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                              className={`size-3 ${
                                metricsData.revenue.trend === "down"
                                  ? "text-red-500 dark:text-red-700"
                                  : "text-green-500 dark:text-green-600 rotate-180"
                              }`}
                              strokeWidth="2"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8 2a.75.75 0 0 1 .75.75v8.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.22 3.22V2.75A.75.75 0 0 1 8 2Z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
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
                            {metricsData.conversionRate.value}
                          </div>
                          <div className="flex w-full flex-1 items-center gap-1 leading-none duration-150">
                            <span className="text-textSecondary text-xs opacity-80">
                              {metricsData.conversionRate.variation}
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                              className={`size-3 ${
                                metricsData.conversionRate.trend === "down"
                                  ? "text-red-500 dark:text-red-700"
                                  : "text-green-500 dark:text-green-600 rotate-180"
                              }`}
                              strokeWidth="2"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8 2a.75.75 0 0 1 .75.75v8.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.22 3.22V2.75A.75.75 0 0 1 8 2Z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
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
                              <span>{metricsData.revenuePerVisitor.value}</span>
                            </div>
                          </div>
                          <div className="flex w-full flex-1 items-center gap-1 leading-none duration-150">
                            <span className="text-textSecondary text-xs opacity-80">
                              {metricsData.revenuePerVisitor.variation}
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                              className={`size-3 ${
                                metricsData.revenuePerVisitor.trend === "down"
                                  ? "text-red-500 dark:text-red-700"
                                  : "text-green-500 dark:text-green-600 rotate-180"
                              }`}
                              strokeWidth="2"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8 2a.75.75 0 0 1 .75.75v8.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.22 3.22V2.75A.75.75 0 0 1 8 2Z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
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
                            {metricsData.bounceRate.value}
                          </div>
                          <div className="flex w-full flex-1 items-center gap-1 leading-none duration-150">
                            <span className="text-textSecondary text-xs opacity-80">
                              {metricsData.bounceRate.variation}
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                              className={`size-3 ${
                                metricsData.bounceRate.trend === "down"
                                  ? "text-red-500 dark:text-red-700"
                                  : "text-green-500 dark:text-green-600"
                              }`}
                              strokeWidth="2"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8 2a.75.75 0 0 1 .75.75v8.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.22 3.22V2.75A.75.75 0 0 1 8 2Z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
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
                            {metricsData.sessionTime.value}
                          </div>
                          <div className="flex w-full flex-1 items-center gap-1 leading-none duration-150">
                            <span className="text-textSecondary text-xs opacity-80">
                              {metricsData.sessionTime.variation}
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                              className={`size-3 ${
                                metricsData.sessionTime.trend === "down"
                                  ? "text-red-500 dark:text-red-700"
                                  : "text-green-500 dark:text-green-600 rotate-180"
                              }`}
                              strokeWidth="2"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8 2a.75.75 0 0 1 .75.75v8.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.22 3.22V2.75A.75.75 0 0 1 8 2Z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
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
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75"></span>
                            <span className="relative inline-flex size-2 rounded-full bg-secondary"></span>
                          </span>
                        </div>
                        <div className="relative flex flex-col items-start overflow-hidden">
                          <div className="absolute w-full animate-dropIn transition-transform duration-100 ease-in-out">
                            <div className="whitespace-nowrap text-xl font-bold md:text-[1.65rem] md:leading-9 text-textPrimary">
                              {visitorsNow}
                            </div>
                          </div>
                          <div className="opacity-0">
                            <div className="whitespace-nowrap text-xl font-bold md:text-[1.65rem] md:leading-9 text-textPrimary">
                              {visitorsNow}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>

                  {/* Chart */}
                  <div>
                    <div className="h-72 pb-4 md:h-92">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={hourlyData}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="visitorGradient"
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
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#ccc"
                            className="stroke-neutral-200 dark:stroke-neutral-600/50!"
                            opacity={0.3}
                          />
                          <XAxis
                            dataKey="time"
                            stroke="#666"
                            className="stroke-neutral-200 dark:stroke-neutral-600!"
                            tick={{
                              fill: "hsl(var(--muted-foreground))",
                              fontSize: 12,
                              className:
                                "text-xs fill-base-secondary opacity-80",
                            }}
                            style={{
                              fontSize: "12px",
                            }}
                          />
                          <YAxis
                            stroke="#666"
                            className="stroke-neutral-200 dark:stroke-neutral-600!"
                            tick={{
                              fill: "hsl(var(--muted-foreground))",
                              fontSize: 12,
                              className:
                                "text-xs fill-base-secondary opacity-80",
                            }}
                            style={{
                              fontSize: "12px",
                            }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "0.5rem",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="visitors"
                            stroke="transparent"
                            strokeWidth={0}
                            fill="url(#visitorGradient)"
                            fillOpacity={0.6}
                          />
                          <Line
                            type="monotone"
                            dataKey="visitors"
                            stroke="#8dcdff"
                            strokeWidth={2.5}
                            strokeLinecap="round"
                            dot={false}
                            activeDot={{
                              r: 4,
                              fill: "#8dcdff",
                              strokeWidth: 2,
                              stroke: "#fff",
                            }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>

          {/* Source Card */}
          <section className="custom-card" id="Source">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-x-2 border-b border-textPrimary/5 px-1 py-1">
                <div className="flex items-baseline gap-0">
                  <div role="tablist" className="tabs tabs-sm ml-1">
                    {["Channel", "Referrer", "Campaign", "Keyword"].map(
                      (tab) => (
                        <button
                          key={tab}
                          role="tab"
                          className={`tab h-8! px-2! font-medium duration-100 ${
                            selectedSourceTab === tab
                              ? "tab-active text-textPrimary"
                              : "text-textSecondary opacity-50 hover:text-textPrimary hover:opacity-80"
                          }`}
                          onClick={() => setSelectedSourceTab(tab)}
                        >
                          <div className="flex items-center gap-1.5">{tab}</div>
                        </button>
                      )
                    )}
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-0">
                  <button className="group btn btn-ghost btn-xs inline-flex flex-nowrap items-center gap-0.5 px-1.5! text-xs! font-medium! border-borderColor bg-white text-textPrimary hover:bg-gray-50">
                    <span className="-mr-0.5 inline-block max-w-20! truncate">
                      All
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="size-3.5 opacity-50 duration-200 group-hover:opacity-100"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="relative h-96">
                <ResponsiveContainer width="100%" height="100%">
                  {selectedSourceTab === "Channel" ? (
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sourceData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  ) : (
                    <BarChart data={sourceData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#ccc"
                        opacity={0.3}
                      />
                      <XAxis dataKey="name" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8dcdff" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Path Card */}
          <section className="custom-card" id="Path">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-x-2 border-b border-textPrimary/5 px-1 py-1">
                <div className="flex items-baseline gap-0">
                  <div role="tablist" className="tabs tabs-sm ml-1">
                    {["Hostname", "Page", "Entry page", "Exit link"].map(
                      (tab) => (
                        <button
                          key={tab}
                          role="tab"
                          className={`tab h-8! px-2! font-medium duration-100 ${
                            selectedPathTab === tab
                              ? "tab-active text-textPrimary"
                              : "text-textSecondary opacity-50 hover:text-textPrimary hover:opacity-80"
                          }`}
                          onClick={() => setSelectedPathTab(tab)}
                        >
                          <div className="flex items-center gap-1.5">{tab}</div>
                        </button>
                      )
                    )}
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-0">
                  <button className="group btn btn-ghost btn-xs inline-flex flex-nowrap items-center gap-0.5 px-1.5! text-xs! font-medium! border-borderColor bg-white text-textPrimary hover:bg-gray-50">
                    <span className="-mr-0.5 inline-block max-w-20! truncate">
                      All
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="size-3.5 opacity-50 duration-200 group-hover:opacity-100"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="relative h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pathData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ccc"
                      opacity={0.3}
                    />
                    <XAxis type="number" stroke="#666" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#666"
                      width={100}
                    />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8dcdff" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Location Card */}
          <section className="custom-card" id="Location">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-x-2 border-b border-textPrimary/5 px-1 py-1">
                <div className="flex items-baseline gap-0">
                  <div role="tablist" className="tabs tabs-sm ml-1">
                    {["Map", "Country", "Region", "City"].map((tab) => (
                      <button
                        key={tab}
                        role="tab"
                        className={`tab h-8! px-2! font-medium duration-100 ${
                          selectedLocationTab === tab
                            ? "tab-active text-textPrimary"
                            : "text-textSecondary opacity-50 hover:text-textPrimary hover:opacity-80"
                        }`}
                        onClick={() => setSelectedLocationTab(tab)}
                      >
                        <div className="flex items-center gap-1.5">{tab}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="relative h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={locationData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ccc"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#666"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#666" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8dcdff" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* System Card */}
          <section className="custom-card" id="System">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-x-2 border-b border-textPrimary/5 px-1 py-1">
                <div className="flex items-baseline gap-0">
                  <div role="tablist" className="tabs tabs-sm ml-1">
                    {["Browser", "OS", "Device"].map((tab) => (
                      <button
                        key={tab}
                        role="tab"
                        className={`tab h-8! px-2! font-medium duration-100 ${
                          selectedSystemTab === tab
                            ? "tab-active text-textPrimary"
                            : "text-textSecondary opacity-50 hover:text-textPrimary hover:opacity-80"
                        }`}
                        onClick={() => setSelectedSystemTab(tab)}
                      >
                        <div className="flex items-center gap-1.5">{tab}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="relative h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={systemData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ccc"
                      opacity={0.3}
                    />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8dcdff" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Custom Event/Goal Card - Full Width */}
          <div className="md:col-span-2">
            <section className="custom-card" id="CustomEvent">
              <div>
                <div className="flex items-center justify-between gap-4 border-b border-textPrimary/5 px-1 py-1">
                  <div className="flex items-center gap-0">
                    <div className="relative">
                      <div role="tablist" className="tabs tabs-sm ml-1">
                        {["Goal", "Funnel", "Journey"].map((tab) => (
                          <button
                            key={tab}
                            role="tab"
                            className={`group tab relative h-8! gap-1 px-2! font-medium duration-100 ${
                              selectedGoalTab === tab
                                ? "tab-active text-textPrimary"
                                : "text-textSecondary opacity-50 group-hover:text-textPrimary group-hover:opacity-80"
                            }`}
                            onClick={() => setSelectedGoalTab(tab)}
                          >
                            <span>{tab}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/docs/custom-goals"
                    target="_blank"
                    className="text-textSecondary group mx-2 hidden items-center gap-0.5 px-2 py-1 text-xs opacity-80 duration-100 hover:text-primary hover:opacity-100 md:inline-flex"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="size-3"
                    >
                      <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z"></path>
                    </svg>
                    <span className="">Add goals</span>
                  </Link>
                </div>
                <div className="relative h-96">
                  <div className="relative flex h-full flex-col items-center justify-center gap-6">
                    <div className="relative z-10 space-y-4 rounded-lg bg-white/20 px-4 py-2 text-center font-medium text-textPrimary backdrop-blur">
                      <p className="font-semibold">
                        Track what visitors do on your site
                      </p>
                      <Link
                        href="/docs/custom-goals"
                        className="btn btn-primary btn-sm bg-primary hover:bg-[#d15a38] text-white"
                        target="_blank"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-4"
                        >
                          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"></path>
                        </svg>
                        Add goals
                      </Link>
                      <p className="text-textSecondary mx-auto max-w-[18rem] pt-4 text-center text-sm font-normal">
                        Revenue-related goals are automatically tracked with{" "}
                        <Link
                          href="/docs/revenue-attribution-guide"
                          className="link hover:text-primary"
                          target="_blank"
                        >
                          revenue attribution
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="fixed bottom-2 left-2 z-50 max-sm:right-2 sm:bottom-4 sm:left-4">
          <div className="flex max-w-full flex-row items-start gap-3 rounded-box border p-4 text-sm shadow-lg sm:max-w-md border-yellow-200 bg-yellow-50 text-yellow-800">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-5 text-yellow-400"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
            <div className="grow">
              <p className="mb-1.5 flex items-baseline gap-2 font-medium">
                Awaiting the first event...
                <span className="loading loading-spinner w-3"></span>
              </p>
              <ol className="list-inside list-decimal text-yellow-700">
                <li>
                  Install the script using{" "}
                  <Link
                    href={`/dashboard/${websiteId}/settings?tab=general`}
                    className="link hover:text-yellow-900"
                  >
                    the tracking code
                  </Link>
                </li>
                <li>
                  Visit{" "}
                  <a
                    href="https://uxmagic.ai/?ref=seemorethanmmr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link hover:text-yellow-900"
                  >
                    uxmagic.ai
                  </a>{" "}
                  to register the first event yourself
                </li>
                <li>Refresh your dashboard</li>
                <li>
                  Still not working?{" "}
                  <a
                    href="mailto:support@seemorethanmmr.com?subject=Dashboard not working for uxmagic.ai"
                    className="link hover:text-yellow-900"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contact support
                  </a>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
