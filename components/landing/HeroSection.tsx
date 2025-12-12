"use client";

import Link from "next/link";
import Image from "next/image";
import { Globe } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

const AVATARS = [
  {
    name: "Jack",
    src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=72&h=72&fit=crop&crop=face",
  },
  {
    name: "Edwin",
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=72&h=72&fit=crop&crop=face",
  },
  {
    name: "Adam",
    src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=72&h=72&fit=crop&crop=face",
  },
  {
    name: "RJ",
    src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=72&h=72&fit=crop&crop=face",
  },
  {
    name: "Serg",
    src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=72&h=72&fit=crop&crop=face",
  },
  {
    name: "Sergiu",
    src: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=72&h=72&fit=crop&crop=face",
  },
  {
    name: "Stephon",
    src: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=72&h=72&fit=crop&crop=face",
  },
  {
    name: "Katt",
    src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=72&h=72&fit=crop&crop=face",
  },
] as const;

const USER_COUNT = "10,706";

function extractDomain(input: string): string | null {
  if (!input || input.trim() === "") return null;

  let domain = input.trim().replace(/^https?:\/\//, "");

  domain = domain.replace(/^www\./, "");

  domain = domain.split("/")[0];

  domain = domain.split(":")[0];

  if (domain.includes(".") && domain.length > 0) {
    return domain;
  }

  return null;
}

export function HeroSection() {
  const [websiteInput, setWebsiteInput] = useState("uxmagic.ai");
  const [faviconError, setFaviconError] = useState(false);

  const domain = useMemo(() => extractDomain(websiteInput), [websiteInput]);
  const faviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    : null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-4 md:pb-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 md:mb-8 tracking-tight">
          Find out which marketing
          <br />
          channels drive your revenue
        </h1>
        <p className="text-lg md:text-xl text-textPrimary max-w-3xl mx-auto mb-8">
          Track what drives revenue, not vanity metrics. See which channels
          bring paying customers with real-time analytics and revenue
          attribution.
        </p>
        <form className="mx-auto flex w-64 flex-col items-center justify-center gap-1.5">
          <div className="w-full">
            <div className="group relative w-full flex">
              <div className="relative inline-flex select-none items-center justify-center border border-r-0 rounded-l-md bg-gray-200 px-3 border-gray-300 group-focus-within:border-gray-400">
                {faviconUrl && !faviconError ? (
                  <img
                    src={faviconUrl}
                    alt={`${domain || "website"} favicon`}
                    className="h-6 w-6 max-w-none shrink-0 rounded drop-shadow-sm"
                    style={{ imageRendering: "-webkit-optimize-contrast" }}
                    width={24}
                    height={24}
                    onError={() => setFaviconError(true)}
                    onLoad={() => setFaviconError(false)}
                  />
                ) : (
                  <Globe className="h-6 w-6 text-gray-600 shrink-0" />
                )}
              </div>
              <input
                placeholder="website.com"
                className="flex h-10 w-full rounded-r-md border border-l-0 border-gray-300 bg-background px-3 py-2 text-base placeholder:text-muted-foreground placeholder:opacity-60 focus:outline-none focus:border-gray-400 dark:placeholder:opacity-40"
                type="text"
                value={websiteInput}
                onChange={(e) => {
                  setWebsiteInput(e.target.value);
                  setFaviconError(false);
                }}
                name="website"
              />
            </div>
          </div>
          <div className="w-full space-y-1">
            <Button asChild variant="embossed" size="xl" className="w-full">
              <Link href="/signin">
                <span>Add my website</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="size-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </Button>
            <div className="text-gray-600 text-center text-sm opacity-80">
              14-day free trial. No card required
            </div>
            <div className="flex flex-col items-center justify-center gap-1 mt-4">
              <div className="flex -space-x-3">
                {AVATARS.map((avatar, index) => (
                  <div
                    key={avatar.name}
                    className="h-9 w-9 rounded-full border-2 border-white overflow-hidden relative"
                  >
                    <Image
                      src={avatar.src}
                      alt={avatar.name}
                      width={36}
                      height={36}
                      className="object-cover"
                      fetchPriority={index === 0 ? "high" : "auto"}
                    />
                  </div>
                ))}
              </div>
              <div className="text-base text-gray-600">
                Loved by{" "}
                <span className="font-medium text-gray-900">{USER_COUNT}</span>{" "}
                users
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
