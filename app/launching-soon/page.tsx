"use client";

import { Logo } from "@/components/landing/Logo";
import Script from "next/script";

export default function LaunchingSoonPage() {
  return (
    <div className="antialiased font-sans bg-stone-50 flex flex-col h-screen overflow-hidden">
      <header className="grid grid-cols-2 lg:grid-cols-3 h-14 items-center w-full gap-2 px-4 lg:px-6 z-50 bg-stone-50/80 border-b border-stone-200 shrink-0">
        <div className="w-fit">
          <Logo
            showText={true}
            textSize="xl"
            iconSize="md"
            className="hover:opacity-70"
          />
        </div>
        <div className="w-full hidden lg:flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></div>
            <span className="font-mono text-xs uppercase text-stone-500">
              Launching Soon
            </span>
          </div>
        </div>
        <div className="w-full flex justify-end items-center gap-4">
          <a
            href="#notify"
            className="hidden sm:block text-indigo-600 font-mono text-xs uppercase hover:underline decoration-1 underline-offset-4 transition-opacity"
          >
            Get Notified
          </a>
        </div>
      </header>
      <main className="flex flex-col items-center justify-center w-full px-4 py-6 lg:py-8 flex-1 overflow-y-auto">
        <div className="max-w-4xl w-full flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4F39F6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>

            <div className="flex flex-col gap-2 max-w-2xl">
              <h1 className="font-cooper text-3xl lg:text-5xl text-stone-800 leading-tight">
                Building something{" "}
                <span className="italic text-indigo-600">cool</span> in my spare
                time.
              </h1>
              <p className="text-stone-500 text-base lg:text-lg leading-relaxed">
                Hey! I'm working on a better way to track your marketing and see
                what actually drives revenue. Still a work in progress, but if
                you're interested, drop your email below and I'll let you know
                when it's ready.
              </p>
            </div>

            <div className="w-full max-w-md" id="notify">
              <div
                id="getWaitlistContainer"
                data-waitlist_id="32272"
                data-widget_type="WIDGET_2"
              ></div>
            </div>
            <link
              rel="stylesheet"
              type="text/css"
              href="https://prod-waitlist-widget.s3.us-east-2.amazonaws.com/getwaitlist.min.css"
            />
            <Script
              src="https://prod-waitlist-widget.s3.us-east-2.amazonaws.com/getwaitlist.min.js"
              strategy="afterInteractive"
            />

            <div className="flex items-center gap-4 text-xs text-stone-400 font-mono uppercase">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                No spam, promise
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Get early access
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-stone-200 py-3 bg-white shrink-0">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-stone-400 text-xs font-mono">
            © 2025 Postmetric • Built with ☕ and late nights
          </p>
        </div>
      </footer>
    </div>
  );
}
