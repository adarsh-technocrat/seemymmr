"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAllUserWebsites } from "@/store/slices/websitesSlice";
import { WebsiteCard } from "@/components/dashboard/WebsiteCard";
import { PlusIcon } from "@/components/icons";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const websites = useAppSelector((state) => state.websites.websites) as Array<{
    _id: string;
    domain: string;
    name: string;
    iconUrl?: string;
    settings?: { colorScheme?: string };
  }>;
  const loading = useAppSelector((state) => state.websites.loading) as boolean;

  useEffect(() => {
    dispatch(fetchAllUserWebsites());
  }, []);

  return (
    <>
      <main className="w-full max-w-7xl flex flex-col bg-transparent">
        <section className="mb-6 mt-8 flex flex-col items-baseline justify-between gap-4 md:flex-row">
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/dashboard/new"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className:
                  "border-stone-200 bg-white text-stone-800 hover:bg-stone-50",
              })}
            >
              <PlusIcon className="size-4" />
              Website
            </Link>
          </div>
        </section>

        <div className="relative px-4 md:px-8 pb-32">
          {loading ? (
            <div className="mt-8 text-center text-stone-600">
              Loading websites...
            </div>
          ) : websites.length === 0 ? (
            <div className="mt-8 text-center text-stone-600">
              No websites found. Create your first website to get started.
            </div>
          ) : (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {websites.map(
                (website: {
                  _id: string;
                  domain: string;
                  name: string;
                  iconUrl?: string;
                  settings?: { colorScheme?: string };
                }) => (
                  <WebsiteCard key={website._id} website={website} />
                ),
              )}
            </ul>
          )}
        </div>
      </main>

      {/* Video Widget */}
      {/* {showVideo && (
        <div className="group fixed bottom-4 left-4 z-50 animate-opacity duration-200 hover:scale-110 md:bottom-8 md:left-8">
          <div data-postmetric-goal="open_onboarding_modal">
            <Image
              src="https://d1aebdcemlt4l7.cloudfront.net/videos/widget.gif"
              alt="PostMetric Onboarding"
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
              <XIcon className="size-5 text-textPrimary" />
            </button>
          </div>
        </div>
      )} */}
    </>
  );
}
