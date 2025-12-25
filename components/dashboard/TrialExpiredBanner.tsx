"use client";

import Link from "next/link";
import Image from "next/image";
import { PricingContent } from "@/components/landing/pricing/PricingContent";
import { Footer } from "@/components/landing/Footer";

export function TrialExpiredBanner() {
  return (
    <div className="fixed inset-0 z-50 bg-stone-50 flex flex-col min-h-screen overflow-y-auto">
      <main className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="max-w-4xl w-full border-x border-stone-200 flex flex-col gap-20 lg:gap-30">
          <div className="flex flex-col items-center gap-6 text-center px-4 md:px-6 pt-12 lg:pt-20">
            <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center border border-red-100 mb-2">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#EF4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>

            <div className="flex flex-col gap-3 max-w-lg">
              <h1 className="font-cooper text-4xl lg:text-5xl text-stone-800 leading-tight">
                Your trial has{" "}
                <span className="italic text-red-500">expired.</span>
              </h1>
              <p className="text-stone-500 text-lg leading-relaxed">
                Your 14-day trial period has ended. To continue accessing your
                analytics and insights, please select a plan below.
              </p>
            </div>

            <div className="flex gap-4 mt-2">
              <Link
                href="/dashboard/billing"
                className="cursor-pointer box-border flex items-center justify-center font-semibold font-mono uppercase border border-indigo-600 bg-indigo-600 text-white px-8 py-3 rounded text-xs hover:bg-indigo-700 transition-all shadow-sm"
              >
                Go to Billing
              </Link>
              <Link
                href="mailto:support@postmetric.com"
                className="cursor-pointer box-border flex items-center justify-center font-semibold font-mono uppercase border border-stone-200 bg-white px-8 py-3 rounded text-xs hover:bg-stone-50 transition-all text-stone-700"
              >
                Contact Support
              </Link>
            </div>
          </div>

          <div className="w-full mt-8">
            <PricingContent showHeader={false} showBillingToggle={true} />
          </div>
        </div>
      </main>

      <div className="w-full flex justify-center">
        <div className="max-w-4xl w-full border-x border-stone-200 flex flex-col">
          <div className="w-full flex flex-col items-center justify-center gap-2 text-center px-4 md:px-6 py-12 lg:py-20">
            <p className="text-stone-400 text-sm">
              Need more time to evaluate?
            </p>
            <Link
              href="mailto:support@postmetric.com"
              className="text-indigo-600 font-mono text-xs uppercase hover:underline decoration-1 underline-offset-4 inline-block"
            >
              Request trial extension →
            </Link>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}
