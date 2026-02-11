"use client";

import { useMemo } from "react";
import { Link2 } from "lucide-react";
import {
  getDeviceIcon,
  getBrowserIcon,
  type Visitor,
} from "@/utils/realtime-map";
import { DomainLogo } from "@/components/ui/domain-logo";

interface StatsSectionProps {
  visitors: Visitor[];
  websiteName?: string;
  websiteDomain?: string;
}

export function StatsSection({
  visitors,
  websiteName,
  websiteDomain,
}: StatsSectionProps) {
  const referrers = useMemo(
    () =>
      Array.from(new Set(visitors.map((v) => v.referrerDomain || "Direct")))
        .slice(0, 5)
        .map((ref) => ({
          name: ref,
          count: visitors.filter((v) => (v.referrerDomain || "Direct") === ref)
            .length,
        })),
    [visitors],
  );

  const countries = useMemo(
    () =>
      Array.from(new Set(visitors.map((v) => v.country)))
        .slice(0, 5)
        .map((country) => ({
          code: country,
          count: visitors.filter((v) => v.country === country).length,
        })),
    [visitors],
  );

  const devices = useMemo(
    () =>
      Array.from(new Set(visitors.map((v) => v.device))).map((device) => ({
        name: device,
        count: visitors.filter((v) => v.device === device).length,
      })),
    [visitors],
  );

  const browsers = useMemo(
    () =>
      Array.from(new Set(visitors.map((v) => v.browser)))
        .slice(0, 5)
        .map((browser) => ({
          name: browser,
          count: visitors.filter((v) => v.browser === browser).length,
        })),
    [visitors],
  );

  const topReferrer = useMemo(() => {
    const nonDirectReferrers = referrers.filter((r) => r.name !== "Direct");
    if (nonDirectReferrers.length === 0) return null;
    return nonDirectReferrers[0];
  }, [referrers]);

  return (
    <>
      <div className="mt-2 flex flex-wrap items-center gap-x-1.5 text-sm md:mt-3">
        <span className="mx-0 relative inline-flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75"></span>
          <span className="relative inline-flex size-2 rounded-full bg-secondary"></span>
        </span>
        <span className="font-semibold">{visitors.length}</span>
        <span className="text-base-secondary">visitors on</span>
        {websiteDomain ? (
          <span className="flex items-center gap-1">
            <DomainLogo
              domain={websiteDomain}
              size={14}
              className="size-3.5 shrink-0 rounded"
            />
            <a
              href={`https://${websiteDomain}?ref=postmetric-realtime-map`}
              target="_blank"
              rel="noopener noreferrer"
              className="max-w-[150px] truncate font-semibold hover:underline"
            >
              {websiteDomain}
            </a>
          </span>
        ) : topReferrer ? (
          <span className="flex items-center gap-1">
            <img
              src={`https://icons.duckduckgo.com/ip3/${topReferrer.name}.ico`}
              alt={topReferrer.name}
              width={14}
              height={14}
              className="size-3.5 shrink-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
            <a
              href={`https://${topReferrer.name}?ref=postmetric-realtime-map`}
              target="_blank"
              rel="noopener noreferrer"
              className="max-w-[150px] truncate font-semibold hover:underline"
            >
              {topReferrer.name}
            </a>
          </span>
        ) : (
          <span className="font-semibold">{websiteName || "your site"}</span>
        )}
      </div>
      <div className="relative mt-2 border-t border-base-content/5 pb-1.5 pt-2 md:mt-3 md:pt-3">
        <div className="grid grid-cols-[65px_1fr]">
          <div className="my-0.5 py-0.5">
            <div className="text-xs text-base-content/60">Referrers</div>
          </div>
          <div className="hide-scrollbar flex max-h-[54px] overflow-x-auto overflow-y-hidden overscroll-x-contain pb-0.5 pr-3 md:pb-1">
            {referrers.map((ref) => (
              <div
                key={ref.name}
                title={`${ref.name}: ${ref.count} visitor${
                  ref.count !== 1 ? "s" : ""
                }`}
                className="my-0.5 mr-1 flex flex-none animate-opacity cursor-pointer select-none items-center gap-1.5 rounded px-1.5 py-0.5 transition-all duration-200 bg-base-300 hover:bg-primary/10"
              >
                {ref.name === "Direct" ? (
                  <Link2 className="size-3 shrink-0 opacity-60" />
                ) : (
                  <img
                    src={`https://icons.duckduckgo.com/ip3/${ref.name}.ico`}
                    alt={ref.name}
                    className="size-3 shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                )}
                <span className="max-w-[100px] truncate text-xs">
                  {ref.name}
                </span>
                <span className="text-xs opacity-60">({ref.count})</span>
              </div>
            ))}
          </div>

          <div className="my-0.5 py-0.5">
            <div className="text-xs text-base-content/60">Countries</div>
          </div>
          <div className="hide-scrollbar flex max-h-[54px] overflow-x-auto overflow-y-hidden overscroll-x-contain pb-0.5 pr-3 md:pb-1">
            {countries.map((country) => (
              <div
                key={country.code}
                title={`${country.code}: ${country.count} visitor${
                  country.count !== 1 ? "s" : ""
                }`}
                className="my-0.5 mr-1 flex flex-none animate-opacity cursor-pointer select-none items-center gap-1 rounded px-1.5 py-0.5 transition-all duration-200 bg-base-300 hover:bg-primary/10"
              >
                <div
                  className="inline-flex shrink-0 overflow-hidden rounded-sm shadow-sm h-[10px] w-[15px]"
                  title={country.code}
                >
                  <img
                    src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${country.code}.svg`}
                    alt={`${country.code} flag`}
                    className="h-full w-full saturate-[0.9]"
                    loading="lazy"
                  />
                </div>
                <span className="whitespace-nowrap text-xs">
                  {country.code}{" "}
                  <span className="text-xs opacity-60">({country.count})</span>
                </span>
              </div>
            ))}
          </div>

          <div className="my-0.5 py-0.5">
            <div className="text-xs text-base-content/60">Devices</div>
          </div>
          <div className="hide-scrollbar flex max-h-[54px] overflow-x-auto overflow-y-hidden overscroll-x-contain pb-0.5 pr-3 md:pb-1">
            {devices.map((device) => (
              <div
                key={device.name}
                title={`${device.name}: ${device.count} visitor${
                  device.count !== 1 ? "s" : ""
                }`}
                className="my-0.5 mr-1 flex flex-none animate-opacity cursor-pointer select-none items-center gap-1 rounded px-1.5 py-0.5 transition-all duration-200 bg-base-300 hover:bg-primary/10"
              >
                <img
                  src={getDeviceIcon(device.name)}
                  alt={device.name}
                  className="h-3 w-3 shrink-0"
                  loading="lazy"
                />
                <span className="text-xs capitalize">{device.name}</span>
                <span className="text-xs opacity-60">({device.count})</span>
              </div>
            ))}
          </div>

          <div className="my-0.5 py-0.5">
            <div className="text-xs text-base-content/60">Browsers</div>
          </div>
          <div className="hide-scrollbar flex max-h-[54px] overflow-x-auto overflow-y-hidden overscroll-x-contain pb-0.5 pr-3 md:pb-1">
            {browsers.map((browser) => (
              <div
                key={browser.name}
                title={`${browser.name}: ${browser.count} visitor${
                  browser.count !== 1 ? "s" : ""
                }`}
                className="my-0.5 mr-1 flex flex-none animate-opacity cursor-pointer select-none items-center gap-1 rounded px-1.5 py-0.5 transition-all duration-200 bg-base-300 hover:bg-primary/10"
              >
                <img
                  src={getBrowserIcon(browser.name)}
                  alt={browser.name}
                  className="h-3 w-3 shrink-0"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
                <span className="text-xs">{browser.name}</span>
                <span className="text-xs opacity-60">({browser.count})</span>
              </div>
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-base-100 to-transparent"></div>
      </div>
    </>
  );
}
