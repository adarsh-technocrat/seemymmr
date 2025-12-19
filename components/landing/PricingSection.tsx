"use client";

import { useState } from "react";
import Link from "next/link";

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [selectedVolume, setSelectedVolume] = useState("10K");

  const baseStarterMonthly = 9;
  const baseGrowthMonthly = 19;

  const starterMonthly = baseStarterMonthly;
  const growthMonthly = baseGrowthMonthly;
  const starterYearly = starterMonthly * 10;
  const growthYearly = growthMonthly * 10;

  const starterPrice =
    billingPeriod === "monthly" ? starterMonthly : starterYearly;
  const growthPrice =
    billingPeriod === "monthly" ? growthMonthly : growthYearly;

  const starterYearlySavings = starterMonthly * 12 - starterYearly;
  const growthYearlySavings = growthMonthly * 12 - growthYearly;

  const plans = [
    {
      name: "Starter",
      price: starterPrice,
      monthlyPrice: starterMonthly,
      yearlySavings: starterYearlySavings,
      eventLimit: "10k monthly events",
      features: [
        { text: "10k monthly events", included: true },
        { text: "1 website", included: true },
        { text: "1 team member", included: true },
        { text: "3 years of data retention", included: true },
        { text: "Mentions and link attribution for 𝕏", included: false },
      ],
      buttonText: "Get Started",
      buttonLink: "/dashboard/new",
      priceId: "price_1PjYvqEIeBR5XIjfRwXlMnGp",
      isPopular: false,
    },
    {
      name: "Growth",
      price: growthPrice,
      monthlyPrice: growthMonthly,
      yearlySavings: growthYearlySavings,
      eventLimit: "10k monthly events",
      features: [
        { text: "10k monthly events", included: true },
        { text: "30 websites", included: true },
        { text: "30 team members", included: true },
        { text: "5+ years of data retention", included: true },
        { text: "Mentions and link attribution for 𝕏", included: true },
      ],
      buttonText: "Get Started",
      buttonLink: "/dashboard/new",
      priceId: "price_1SImzbEIeBR5XIjf7IqKjV6D",
      isPopular: true,
    },
  ];

  return (
    <div className="flex flex-col w-full items-center">
      <div className="flex flex-col w-full">
        <div className="py-6 px-4 lg:px-20 lg:py-20 flex flex-col gap-6 items-center pb-20">
          <div className="flex flex-col gap-3 items-center">
            <h1 className="font-cooper text-[28px] lg:text-[40px] leading-8 lg:leading-tight text-center text-balance text-stone-800">
              Simple, transparent pricing
            </h1>
            <h2 className="text-center text-balance lg:whitespace-pre-line whitespace-normal leading-6 text-stone-500 text-base lg:text-lg">
              Pay only for what you use. No hidden fees, no surprises.
              <br className="md:block hidden" />
              Start free and scale as you grow.
            </h2>
          </div>
        </div>

        <div className="flex flex-col items-center w-full gap-6">
          <div className="flex flex-col items-center gap-10 w-full">
            <div className="flex flex-col items-center gap-10 w-full">
              <div className="flex flex-col gap-10 w-full md:px-6 px-4">
                <div className="lg:flex flex-col items-center gap-4 w-full hidden">
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-stone-500 font-normal text-xs">
                      Select your monthly event volume
                    </p>
                  </div>
                  <div className="flex items-center justify-center w-full">
                    <div className="grid grid-cols-12 w-full justify-around relative isolate">
                      {[
                        "1K",
                        "5K",
                        "10K",
                        "25K",
                        "50K",
                        "75K",
                        "100K",
                        "250K",
                        "500K",
                        "750K",
                        "1M",
                        "1M+",
                      ].map((volume) => (
                        <button
                          key={volume}
                          onClick={() => setSelectedVolume(volume)}
                          className="relative flex flex-col items-center justify-items-start cursor-pointer group gap-1 w-full"
                        >
                          <p
                            className={`text-xs transition-colors duration-200 leading-5 ${
                              selectedVolume === volume
                                ? "text-brand-600 font-semibold scale-110"
                                : "text-stone-500 group-hover:text-brand-600 font-normal group-hover:font-medium"
                            }`}
                          >
                            {volume}
                          </p>
                          <div className="flex items-center justify-center h-6">
                            <div
                              className={`w-0.5 transition-all duration-200 ${
                                selectedVolume === volume
                                  ? "bg-brand-600 h-6"
                                  : "bg-stone-400 group-hover:bg-brand-600 group-hover:scale-y-120 h-3"
                              }`}
                            ></div>
                          </div>
                        </button>
                      ))}
                      <div className="w-full absolute bottom-2.5 -z-10">
                        <div className="h-0.5 bg-stone-200 w-full"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Volume Selector - Mobile */}
                <div className="flex flex-col gap-4 lg:hidden">
                  <div className="grid grid-cols-2 gap-4 max-w-85 w-full">
                    <p className="text-stone-800 font-medium text-sm">
                      Monthly events
                    </p>
                    <div className="flex flex-col gap-1">
                      <select
                        value={selectedVolume}
                        onChange={(e) => setSelectedVolume(e.target.value)}
                        className="w-full py-1.5 min-h-9 outline-none text-sm rounded-lg border border-stone-300 px-3 bg-white focus:border-brand-500 transition-all duration-100"
                      >
                        <option value="1K">1,000</option>
                        <option value="5K">5,000</option>
                        <option value="10K">10,000</option>
                        <option value="25K">25,000</option>
                        <option value="50K">50,000</option>
                        <option value="75K">75,000</option>
                        <option value="100K">100,000</option>
                        <option value="250K">250,000</option>
                        <option value="500K">500,000</option>
                        <option value="750K">750,000</option>
                        <option value="1M">1,000,000</option>
                        <option value="1M+">1,000,000+</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Period Toggle */}
              <div className="flex items-center justify-center w-full px-4 md:px-6">
                <div className="relative inline-flex items-center rounded border border-stone-200 bg-stone-50 p-1">
                  <button
                    onClick={() => setBillingPeriod("monthly")}
                    className={`px-4 py-2 text-xs font-medium font-mono uppercase transition-all rounded ${
                      billingPeriod === "monthly"
                        ? "bg-white text-stone-800"
                        : "text-stone-500"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingPeriod("yearly")}
                    className={`px-4 py-2 text-xs font-medium font-mono uppercase transition-all rounded ${
                      billingPeriod === "yearly"
                        ? "bg-white text-stone-800"
                        : "text-stone-500"
                    }`}
                  >
                    Yearly
                  </button>
                  {billingPeriod === "yearly" && (
                    <div className="absolute -top-8 right-0 flex items-center gap-1.5">
                      <span className="whitespace-nowrap text-xs font-medium text-stone-600">
                        2 months free
                      </span>
                      <svg
                        className="h-5 w-5 fill-stone-600 opacity-60"
                        style={{ transform: "rotate(32deg) scaleX(-1)" }}
                        viewBox="0 0 219 41"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g clipPath="url(#clip0_3_248)">
                          <path d="M21.489 29.4305C36.9333 31.3498 51.3198 33.0559 65.7063 34.9753C66.7641 35.1885 67.6104 36.4681 69.9376 38.3875C63.1675 39.2406 57.8783 40.3069 52.5892 40.5201C38.6259 40.9467 24.8741 40.9467 10.9107 40.9467C9.21821 40.9467 7.5257 41.1599 5.83317 40.7334C0.332466 39.6671 -1.57164 36.0416 1.39028 31.1365C2.87124 28.7906 4.56377 26.658 6.46786 24.7386C13.6611 17.4876 21.0659 10.4499 28.4707 3.41224C29.7401 2.13265 31.6442 1.49285 34.183 0C34.6061 10.8765 23.8162 13.8622 21.489 22.3927C23.3931 21.9662 25.0856 21.7529 26.5666 21.3264C83.6894 5.54486 140.601 7.25099 197.3 22.606C203.224 24.0988 208.936 26.4447 214.649 28.5773C217.61 29.6437 220.149 31.9896 218.457 35.6151C216.976 39.2406 214.014 39.2406 210.629 37.7477C172.759 20.6866 132.561 18.7672 91.9404 19.407C70.7838 19.6203 50.0504 21.9662 29.5285 26.8713C26.9897 27.5111 24.4509 28.3641 21.489 29.4305Z" />
                        </g>
                        <defs>
                          <clipPath id="clip0_3_248">
                            <rect width="219" height="41" />
                          </clipPath>
                        </defs>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col w-full items-center">
                <div className="grid grid-cols-1 md:grid-cols-2 max-w-full w-full border-b border-t border-stone-200">
                  {plans.map((plan, index) => (
                    <div
                      key={plan.name}
                      className={`flex flex-col w-full ${
                        index === 0
                          ? "border-r border-stone-200"
                          : "border-none border-stone-200"
                      }`}
                    >
                      <div className="px-4 md:px-6 py-3 flex items-center justify-between bg-stone-0 border-b border-stone-200">
                        <p className="text-stone-800 font-semibold text-sm font-mono uppercase">
                          {plan.name}
                          <br className="sm:hidden" />
                        </p>
                      </div>
                      <div className="flex md:flex-row flex-col gap-2 md:items-center py-5 bg-stone-0 md:py-10 px-4 md:px-6">
                        <p className="font-light text-[40px] font-mono text-stone-800">
                          ${plan.price}
                        </p>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-stone-800 font-semibold text-sm font-mono uppercase">
                            per month
                          </p>
                          <p className="text-stone-800 font-normal text-xs">
                            <span className="hidden md:inline">
                              {plan.eventLimit}
                            </span>
                            <br className="md:hidden" />
                            <span className="md:hidden">{plan.eventLimit}</span>
                          </p>
                        </div>
                      </div>
                      <div className="w-full">
                        <Link
                          href={plan.buttonLink}
                          className={`w-full md:px-6 group px-4 py-3 h-11 flex items-center justify-center font-semibold transition-all ${
                            plan.isPopular
                              ? "bg-brand-500 hover:bg-brand-600 text-white"
                              : "bg-stone-800 hover:bg-stone-900 text-white"
                          }`}
                          data-postmetric-goal="checkout_button_clicked"
                          data-postmetric-goal-price-id={plan.priceId}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-mono uppercase text-xs text-white">
                              {plan.buttonText}
                            </span>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="text-white"
                            >
                              <path
                                d="M6 12L10 8L6 4"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        </Link>
                      </div>
                      <div className="flex flex-col gap-3 py-6 px-4 md:px-6">
                        {index === 1 ? (
                          <p className="text-lime-600 font-semibold text-sm">
                            Everything in Starter, plus:
                          </p>
                        ) : (
                          <p className="text-stone-800 font-semibold text-sm">
                            What's included:
                          </p>
                        )}
                        {plan.features.map((feature, featureIndex) => (
                          <div
                            key={featureIndex}
                            className="flex items-center gap-2"
                          >
                            <span
                              className={
                                feature.included
                                  ? "text-brand-500"
                                  : "text-stone-200"
                              }
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M16.6667 5L7.50004 14.1667L3.33337 10"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                            <p
                              className={
                                feature.included
                                  ? "text-stone-800 font-normal text-sm"
                                  : "text-stone-500 font-normal text-sm"
                              }
                            >
                              {feature.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
