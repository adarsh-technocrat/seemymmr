"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useDomainIcon } from "@/hooks/use-domain-icon";
import {
  GlobeIcon,
  ArrowRightIcon,
  ChartBarIcon,
  TrendingUpIcon,
  DollarSignIcon,
  LiveDemoIcon,
} from "@/components/icons";

export default function Home() {
  const [domain, setDomain] = useState("");
  const { iconUrl, loading } = useDomainIcon(domain);

  return (
    <>
      <header className="border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image
                src="https://datafa.st/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ficon.3a869d3d.png&w=64&q=75"
                alt="PostMetric Logo"
                width={32}
                height={32}
                className="w-8 h-8"
                unoptimized
              />
              <span className="text-xl font-bold text-gray-900">
                PostMetric
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#"
                className="text-textPrimary hover:text-gray-900 text-sm"
              >
                Features
              </a>
              <a
                href="#"
                className="text-textPrimary hover:text-gray-900 text-sm"
              >
                Pricing
              </a>
              <a
                href="#"
                className="text-textPrimary hover:text-gray-900 text-sm"
              >
                Docs
              </a>
              <a
                href="#"
                className="text-textPrimary hover:text-gray-900 text-sm"
              >
                Blog
              </a>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-textPrimary hover:text-gray-900 text-sm"
              >
                Sign in
              </Link>
              <Link
                href="/login"
                className="bg-[#E16540] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#d15a38] transition-colors shadow-[0_1px_1px_0_rgba(0,0,0,0.06),0_0_0_1px_rgba(225,101,64,0.157),0_8px_16px_-8px_rgba(225,101,64,0.64),0_-1px_2px_0_rgba(181,81,51,0.48)_inset]"
              >
                Get started
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center mb-14">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 md:mb-8 tracking-tight">
              Find out which marketing
              <br />
              channels drive your revenue
            </h1>
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-wrap items-center justify-center gap-1 text-textPrimary text-base mb-8 max-w-md mx-auto">
                <span>Analytics for</span>
                <a
                  href="#"
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  <Image
                    src="https://icons.duckduckgo.com/ip3/shipfa.st.ico"
                    alt=""
                    width={16}
                    height={16}
                    className="w-4 h-4"
                    unoptimized
                  />
                  <span>ShipFast</span>
                </a>
                <span>•</span>
                <a
                  href="#"
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  <Image
                    src="https://icons.duckduckgo.com/ip3/indiepa.ge.ico"
                    alt=""
                    width={16}
                    height={16}
                    className="w-4 h-4"
                    unoptimized
                  />
                  <span>IndiePage</span>
                </a>
                <span>•</span>
                <a
                  href="#"
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  <Image
                    src="https://icons.duckduckgo.com/ip3/marclou.com.ico"
                    alt=""
                    width={16}
                    height={16}
                    className="w-4 h-4"
                    unoptimized
                  />
                  <span>MarcLou</span>
                </a>
              </div>

              <div className="flex flex-col items-center justify-center gap-6">
                <form className="w-64 mx-auto flex flex-col items-center gap-1.5">
                  <div className="w-full">
                    <div className="relative flex items-center w-full border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <div className="flex items-center justify-center px-3 py-2 bg-gray-50 border-r border-gray-200">
                        {iconUrl ? (
                          <img
                            src={iconUrl}
                            alt="Domain icon"
                            width={24}
                            height={24}
                            className="!h-6 !w-6 !max-w-none shrink-0 animate-opacity rounded drop-shadow-sm"
                            onError={() => {}}
                          />
                        ) : loading ? (
                          <div className="!h-6 !w-6 shrink-0 animate-pulse rounded bg-gray-300" />
                        ) : (
                          <GlobeIcon className="w-5 h-5 text-textPrimary opacity-75" />
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="yourwebsite.com"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm outline-none placeholder:opacity-60"
                      />
                    </div>
                  </div>
                  <div className="w-full space-y-1">
                    <Link
                      href="/login"
                      className="w-full bg-[#E16540] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#d15a38] transition-colors shadow-[0_1px_1px_0_rgba(0,0,0,0.06),0_0_0_1px_rgba(225,101,64,0.157),0_8px_16px_-8px_rgba(225,101,64,0.64),0_-1px_2px_0_rgba(181,81,51,0.48)_inset] flex items-center justify-center gap-2"
                    >
                      <span>Add my website</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                    <div className="text-center text-sm text-textPrimary opacity-80">
                      Free 14-day trial • No credit card required
                    </div>
                  </div>
                </form>

                <div className="flex flex-col items-center gap-1">
                  <div className="flex -space-x-3">
                    {[
                      "rj.b6037c6f.jpg",
                      "serg.30bade2d.jpg",
                      "adam.d9b0a2ec.jpg",
                      "katt.b681a8ed.jpg",
                      "wozu.45cffdf1.jpg",
                      "kai.daee511e.png",
                      "siya.ef0cc018.png",
                      "osudev.6e88d616.jpg",
                    ].map((img, idx) => (
                      <div
                        key={idx}
                        className="w-9 h-9 rounded-full border-2 border-white overflow-hidden"
                      >
                        <Image
                          src={`https://datafa.st/_next/image?url=%2F_next%2Fstatic%2Fmedia%2F${img}&w=128&q=75`}
                          alt="User"
                          width={36}
                          height={36}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-base text-textPrimary">
                    <span className="font-medium text-gray-900">200+</span>{" "}
                    entrepreneurs trust PostMetric
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-6xl 2xl:max-w-7xl mx-auto rounded-[1.3rem] border border-gray-100 bg-gray-50/50 p-1.5">
            <div className="relative hidden md:block">
              <div className="absolute -top-4 right-4 flex -translate-y-full items-center gap-2">
                <LiveDemoIcon className="w-8 -rotate-[24deg] opacity-60 fill-textPrimary" />
                <span className="text-sm text-textPrimary">Live demo</span>
              </div>

              <div className="relative mx-auto flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                <div className="relative flex w-full items-center border-b border-gray-100 bg-white px-4 py-2">
                  <div className="absolute left-4 top-1/2 flex -translate-y-1/2 items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                  </div>
                  <div className="w-full text-center text-sm">
                    <span className="text-textPrimary opacity-50">
                      https://
                    </span>
                    <span className="text-gray-900">app.postmetric.com</span>
                  </div>
                </div>

                <div className="w-full bg-background">
                  <Image
                    src="https://datafa.st/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fdemo.8f89df2b.jpg&w=1080&q=100"
                    alt="PostMetric Dashboard Demo"
                    width={1080}
                    height={600}
                    className="w-full h-auto"
                    unoptimized
                  />
                </div>
              </div>
            </div>

            <div className="md:hidden">
              <Image
                src="https://datafa.st/images/devices/mobile.png"
                alt="Mobile Demo"
                width={400}
                height={800}
                className="w-full h-auto"
                unoptimized
              />
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Simple analytics that matter
            </h2>
            <p className="text-lg text-textPrimary max-w-2xl mx-auto">
              Track what drives revenue, not vanity metrics. See which channels
              bring paying customers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <div className="w-12 h-12 bg-[#E16540]/10 rounded-lg flex items-center justify-center mb-4">
                <ChartBarIcon className="w-6 h-6 text-[#E16540]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Revenue Attribution
              </h3>
              <p className="text-textPrimary">
                See which channels drive actual revenue, not just traffic.
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUpIcon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Real-time Tracking
              </h3>
              <p className="text-textPrimary">
                Monitor your metrics as they happen with live updates.
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                <DollarSignIcon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Customer Journey
              </h3>
              <p className="text-textPrimary">
                Follow the path from first click to paying customer.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
                Works with your stack
              </h2>
              <p className="text-lg text-textPrimary">
                Integrate with the tools you already use
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {[
                "icon-shopify.a664161d.png",
                "icon-wix.34f61b06.png",
                "icon-ghostcms.36b39cb0.png",
                "icon-podia.b5977fc1.png",
                "icon-gtm.d7fc830d.png",
                "icon-caddy.8d202f7e.png",
                "icon-php.858345a0.png",
                "icon-django.1260bac6.png",
                "icon-fastapi.adfa24d0.png",
                "icon-expressjs.6e4a13ee.png",
                "icon-vuejs.010f3bde.png",
                "icon-lovable.618fffcb.png",
              ].map((icon, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-center p-6 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <Image
                    src={`https://datafa.st/_next/image?url=%2F_next%2Fstatic%2Fmedia%2F${icon}&w=256&q=75`}
                    alt="Integration"
                    width={48}
                    height={48}
                    className="w-12 h-12 object-contain"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Loved by entrepreneurs
            </h2>
            <p className="text-lg text-textPrimary">
              See what makers are saying about PostMetric
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Marc Lou",
                handle: "@marc_louvion",
                avatar:
                  "https://datafa.st/_next/image?url=https%3A%2F%2Fpbs.twimg.com%2Fprofile_images%2F1754025659180187649%2FAAG78n19_normal.jpg&w=96&q=100",
                text: "Finally an analytics tool that shows me what actually matters for my business. Love the simplicity!",
              },
              {
                name: "Sarah Chen",
                handle: "@sarahchen",
                avatar:
                  "https://datafa.st/_next/image?url=https%3A%2F%2Fpbs.twimg.com%2Fprofile_images%2F1905054657971728384%2FM9JF7NHU_normal.jpg&w=96&q=100",
                text: "PostMetric helped me identify which marketing channels were actually profitable. Game changer!",
              },
              {
                name: "Alex Rivera",
                handle: "@alexrivera",
                avatar:
                  "https://datafa.st/_next/image?url=https%3A%2F%2Fpbs.twimg.com%2Fprofile_images%2F1846285407077421056%2F-nESsbOX_normal.jpg&w=96&q=100",
                text: "The real-time tracking is incredible. I can see exactly when customers convert and from where.",
              },
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-100 rounded-xl p-6"
              >
                <div className="flex items-start gap-3 mb-4">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full"
                    unoptimized
                  />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-textPrimary">
                      {testimonial.handle}
                    </div>
                  </div>
                </div>
                <p className="text-textPrimary">{testimonial.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#E16540] text-white py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
              Ready to understand your revenue?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Start tracking what matters in less than 5 minutes
            </p>
            <Link
              href="/login"
              className="inline-block bg-white text-[#E16540] px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors shadow-lg"
            >
              Get started for free
            </Link>
            <p className="mt-4 text-sm opacity-80">
              Free 14-day trial • No credit card required
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-textPrimary hover:text-gray-900 text-sm"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-textPrimary hover:text-gray-900 text-sm"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-textPrimary hover:text-gray-900 text-sm"
                  >
                    Integrations
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-textPrimary hover:text-gray-900 text-sm"
                  >
                    Changelog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-textPrimary hover:text-gray-900 text-sm"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-textPrimary hover:text-gray-900 text-sm"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-textPrimary hover:text-gray-900 text-sm"
                  >
                    Support
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-textPrimary hover:text-gray-900 text-sm"
                  >
                    API
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-textPrimary hover:text-gray-900 text-sm"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-textPrimary hover:text-gray-900 text-sm"
                  >
                    Customers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-textPrimary hover:text-gray-900 text-sm"
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-textPrimary hover:text-gray-900 text-sm"
                  >
                    Terms
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Connect</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-textPrimary hover:text-gray-900 text-sm"
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-textPrimary hover:text-gray-900 text-sm"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-textPrimary hover:text-gray-900 text-sm"
                  >
                    Discord
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-textPrimary hover:text-gray-900 text-sm"
                  >
                    Email
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Image
                src="https://datafa.st/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ficon.3a869d3d.png&w=64&q=75"
                alt="PostMetric Logo"
                width={24}
                height={24}
                className="w-6 h-6"
                unoptimized
              />
              <span className="font-semibold text-gray-900">PostMetric</span>
            </div>
            <div className="text-sm text-textPrimary">
              © 2024 PostMetric. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
