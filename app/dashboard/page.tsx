"use client";

import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { useState } from "react";

export default function DashboardPage() {
  const [showVideo, setShowVideo] = useState(true);

  return (
    <>
      <main className="mx-auto min-h-screen max-w-6xl px-4 pb-32 md:px-8 bg-background">
        <section className="mb-6 mt-8 flex flex-col items-baseline justify-between gap-4 md:flex-row">
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/dashboard/new"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className:
                  "border-borderColor bg-white text-textPrimary hover:bg-gray-50",
              })}
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
                className="size-4"
              >
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
              Website
            </Link>
          </div>
        </section>

        <div className="relative">
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            <li>
              <Link href="/dashboard/692c23a4ab4384205bf8326d">
                <article className="custom-card custom-card-hover p-4">
                  <div className="flex flex-row gap-2">
                    <div>
                      <Image
                        src="https://icons.duckduckgo.com/ip3/uxmagic.ai.ico"
                        alt="uxmagic.ai"
                        className="size-5 rounded"
                        width={24}
                        height={24}
                        unoptimized
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-textPrimary">
                        uxmagic.ai
                      </h3>
                      <div className="relative h-20">
                        {/* Chart placeholder - simplified version */}
                        <div className="recharts-responsive-container select-none w-full h-full">
                          <div className="recharts-wrapper chart-mixed cursor-pointer relative w-full h-full max-h-20">
                            <svg
                              className="recharts-surface w-full h-full"
                              viewBox="0 0 286 80"
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
                                  fill="url(#visitorGradient)"
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
                      </div>
                      <div className="flex items-center justify-start gap-2">
                        <p className="text-textSecondary text-sm">
                          <span className="font-semibold text-textPrimary">
                            0
                          </span>{" "}
                          <span>visitors</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            </li>
          </ul>
        </div>
      </main>

      {/* Video Widget */}
      {showVideo && (
        <div className="group fixed bottom-4 left-4 z-50 animate-opacity duration-200 hover:scale-110 md:bottom-8 md:left-8">
          <div data-fast-goal="open_onboarding_modal">
            <Image
              src="https://d1aebdcemlt4l7.cloudfront.net/videos/widget.gif"
              alt="seeMoreThanMMR Onboarding"
              width={96}
              height={96}
              className="w-24 cursor-pointer rounded-2xl border-2 border-gray-200 shadow-xl duration-200 hover:border-[2.5px] hover:border-primary hover:shadow-2xl"
              unoptimized
            />
          </div>
          <div className="absolute -right-8 -top-8 z-50 duration-150 md:-right-5 md:-top-5">
            <button
              className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 text-textPrimary flex items-center justify-center shadow-md border border-gray-200 transition-colors"
              onClick={() => setShowVideo(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-5 text-textPrimary"
              >
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Chat Button */}
      <div className="fixed bottom-4 right-4 z-50 md:bottom-8 md:right-8">
        <button className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center shadow-lg transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6 text-white"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      </div>
    </>
  );
}
