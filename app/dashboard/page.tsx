"use client";

import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchWebsites } from "@/store/slices/websitesSlice";
import { WebsiteCard } from "@/components/dashboard/WebsiteCard";
import { PlusIcon, XIcon, ChatIcon } from "@/components/icons";

export default function DashboardPage() {
  const [showVideo, setShowVideo] = useState(true);
  const dispatch = useAppDispatch();
  const websites = useAppSelector((state) => state.websites.websites) as Array<{
    _id: string;
    domain: string;
    name: string;
    iconUrl?: string;
  }>;
  const loading = useAppSelector((state) => state.websites.loading) as boolean;

  useEffect(() => {
    dispatch(fetchWebsites());
  }, [dispatch]);

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
              <PlusIcon className="size-4" />
              Website
            </Link>
          </div>
        </section>

        <div className="relative">
          {loading ? (
            <div className="mt-8 text-center text-textSecondary">
              Loading websites...
            </div>
          ) : websites.length === 0 ? (
            <div className="mt-8 text-center text-textSecondary">
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
                }) => (
                  <WebsiteCard key={website._id} website={website} />
                )
              )}
            </ul>
          )}
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
              <XIcon className="size-5 text-textPrimary" />
            </button>
          </div>
        </div>
      )}

      {/* Chat Button */}
      <div className="fixed bottom-4 right-4 z-50 md:bottom-8 md:right-8">
        <button className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center shadow-lg transition-colors">
          <ChatIcon className="w-6 h-6 text-white" />
        </button>
      </div>
    </>
  );
}
