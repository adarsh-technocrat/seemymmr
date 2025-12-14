"use client";

import { useCallback, useMemo, useState } from "react";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Share2, Music, Maximize, Eye } from "lucide-react";
import Image from "next/image";
import {
  formatTimeAgo,
  generateVisitorName,
  getDeviceIcon,
  getBrowserIcon,
  createPopupContent,
  getAvatarUrl,
  getConversionScoreColor,
  type Visitor,
  getVisitorCoordinates,
} from "@/utils/realtime-map";
import { useRealtimeMap } from "@/hooks/use-realtime-map";

interface RealtimeMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  websiteId: string;
  websiteName?: string;
}

function StatsSection({ visitors }: { visitors: Visitor[] }) {
  const referrers = useMemo(
    () =>
      Array.from(new Set(visitors.map((v) => v.referrerDomain || "Direct")))
        .slice(0, 5)
        .map((ref) => ({
          name: ref,
          count: visitors.filter((v) => (v.referrerDomain || "Direct") === ref)
            .length,
        })),
    [visitors]
  );

  const countries = useMemo(
    () =>
      Array.from(new Set(visitors.map((v) => v.country)))
        .slice(0, 5)
        .map((country) => ({
          code: country,
          count: visitors.filter((v) => v.country === country).length,
        })),
    [visitors]
  );

  const devices = useMemo(
    () =>
      Array.from(new Set(visitors.map((v) => v.device))).map((device) => ({
        name: device,
        count: visitors.filter((v) => v.device === device).length,
      })),
    [visitors]
  );

  const browsers = useMemo(
    () =>
      Array.from(new Set(visitors.map((v) => v.browser)))
        .slice(0, 5)
        .map((browser) => ({
          name: browser,
          count: visitors.filter((v) => v.browser === browser).length,
        })),
    [visitors]
  );

  return (
    <div className="mt-3 grid grid-cols-[65px_1fr] gap-2 border-t border-base-content/5 pb-1.5 pt-2 md:mt-3 md:pt-3">
      <div className="my-0.5 py-0.5">
        <div className="text-xs text-base-content/60">Referrers</div>
      </div>
      <div className="hide-scrollbar flex max-h-[54px] overflow-x-auto overflow-y-hidden overscroll-x-contain pb-0.5 pr-3 md:pb-1">
        {referrers.map((ref) => (
          <div
            key={ref.name}
            className="my-0.5 mr-1 flex flex-none animate-opacity cursor-pointer select-none items-center gap-1.5 rounded px-1.5 py-0.5 transition-all duration-200 bg-base-300 hover:bg-primary/10"
          >
            <span className="max-w-[100px] truncate text-xs">{ref.name}</span>
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
            className="my-0.5 mr-1 flex flex-none animate-opacity cursor-pointer select-none items-center gap-1 rounded px-1.5 py-0.5 transition-all duration-200 bg-base-300 hover:bg-primary/10"
          >
            <div className="inline-flex shrink-0 overflow-hidden rounded-sm shadow-sm h-[10px] w-[15px]">
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
            className="my-0.5 mr-1 flex flex-none animate-opacity cursor-pointer select-none items-center gap-1 rounded px-1.5 py-0.5 transition-all duration-200 bg-base-300 hover:bg-primary/10"
          >
            <img
              src={getBrowserIcon(browser.name)}
              alt={browser.name}
              className="h-3 w-3 shrink-0 rounded"
              loading="lazy"
              onError={(e) => {
                // Fallback to default icon if image fails to load
                const target = e.target as HTMLImageElement;
                target.src = getBrowserIcon("default");
              }}
            />
            <span className="max-w-[80px] truncate text-xs">
              {browser.name}
            </span>
            <span className="text-xs opacity-60">({browser.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityFeed({ visitors }: { visitors: Visitor[] }) {
  const recentVisitors = useMemo(() => visitors.slice(0, 10), [visitors]);

  return (
    <div className="absolute bottom-0 left-0 z-10 max-h-[20vh] w-full max-w-full overflow-hidden bg-zinc-900/60 py-3 text-gray-400 ring-1 ring-base-content/10 backdrop-blur-sm dark:bg-zinc-900/40 md:bottom-4 md:left-4 md:max-h-[30vh] md:w-96 md:rounded-box">
      <div className="hide-scrollbar max-h-[calc(20vh-40px)] overflow-y-auto md:mt-2 md:max-h-[calc(30vh-40px)]">
        <div className="space-y-1">
          {recentVisitors.map((visitor) => (
            <div
              key={visitor.sessionId}
              className="flex items-start gap-1.5 py-1 text-xs cursor-pointer px-3 duration-100 hover:bg-zinc-600/20"
            >
              <div className="mt-0.5 shrink-0">
                <Eye className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-medium text-gray-100">
                  {generateVisitorName(visitor.visitorId, visitor.userId)}
                </span>
                <span> from </span>
                <span className="inline-flex items-baseline gap-1 truncate font-medium text-gray-100">
                  <div className="inline-flex shrink-0 overflow-hidden rounded-sm shadow-sm h-[10px] w-[15px]">
                    <img
                      src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${visitor.country}.svg`}
                      alt={`${visitor.country} flag`}
                      className="h-full w-full saturate-[0.9]"
                      loading="lazy"
                    />
                  </div>
                  <span className="font-medium text-gray-100">
                    {visitor.country}
                  </span>
                </span>
                <span> visited </span>
                <span
                  className="-mx-1 -my-0.5 ml-0 rounded bg-zinc-900/70 px-1 py-0.5 font-mono text-[11px]! font-medium text-gray-100 backdrop-blur-sm"
                  title={`Path: ${visitor.currentPath || "/"} | Session: ${
                    visitor.sessionId
                  }`}
                >
                  {visitor.currentPath || "/"}
                </span>
                <div className="mt-0 text-[10px] opacity-60">
                  {formatTimeAgo(visitor.lastSeenAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VisitorMarker({ visitor }: { visitor: Visitor }) {
  const [showPopup, setShowPopup] = useState(false);
  const [lng, lat] = getVisitorCoordinates(visitor);
  const visitorName = generateVisitorName(visitor.visitorId, visitor.userId);
  const avatarUrl = getAvatarUrl(visitor.visitorId, visitor.country);
  const scoreColor = getConversionScoreColor(visitor.conversionScore);

  return (
    <>
      <Marker
        longitude={lng}
        latitude={lat}
        anchor="bottom"
        onClick={(e) => {
          e.originalEvent.stopPropagation();
          setShowPopup(true);
        }}
      >
        <div className="relative cursor-pointer">
          <div
            className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-base-100 shadow-sm"
            style={{ backgroundColor: scoreColor }}
          />
          <img
            src={avatarUrl}
            alt={visitorName}
            className="rounded-full ring-1 transition-all duration-100 bg-base-200 shadow-lg ring-base-content/10 dark:ring-base-content/20 size-14 object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = `data:image/svg+xml;utf8,${encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="50" fill="#8dcdff" />
                  <text x="50" y="50" text-anchor="middle" dominant-baseline="central" font-size="40" fill="white">${visitorName
                    .charAt(0)
                    .toUpperCase()}</text>
                </svg>`
              )}`;
            }}
          />
        </div>
      </Marker>
      {showPopup && (
        <Popup
          longitude={lng}
          latitude={lat}
          anchor="bottom"
          onClose={() => setShowPopup(false)}
          closeButton={true}
          closeOnClick={true}
          className="mapbox-popup-custom"
          offset={25}
        >
          <div
            dangerouslySetInnerHTML={{
              __html: createPopupContent(visitor),
            }}
            className="min-w-[200px]"
          />
        </Popup>
      )}
    </>
  );
}

export function RealtimeMapDialog({
  open,
  onOpenChange,
  websiteId,
  websiteName = "PostMetric",
}: RealtimeMapDialogProps) {
  const {
    visitors,
    isLoading,
    isMapLoaded,
    progress,
    viewState,
    onViewportChange,
    mapStyle,
    mapboxToken,
  } = useRealtimeMap({
    open,
    websiteId,
  });

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none max-h-none w-screen h-screen p-0 m-0 rounded-none border-0 bg-gray-700 overflow-hidden left-0 top-0 translate-x-0 translate-y-0 [&>button]:hidden">
        <DialogTitle className="sr-only">
          Real-time Visitor Map - {websiteName}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Interactive map showing real-time visitor locations, referrers,
          countries, and devices. View visitor activity and their current paths.
        </DialogDescription>
        <div className="relative w-full h-full overflow-hidden">
          <div className="absolute right-2 top-2 z-50 md:right-4 md:top-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-transparent hover:bg-gray-600"
              onClick={handleClose}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="h-full w-full overflow-hidden relative">
            <div className="absolute left-0 top-0 z-10 w-full max-w-full md:left-4 md:top-4 md:w-96 md:rounded-box custom-card border border-base-content/10 bg-base-100 p-4 pb-0 shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-start gap-2 text-base-secondary">
                <div className="flex items-center gap-1.5">
                  <Image
                    src="/icon.svg"
                    alt={`${websiteName} logo`}
                    width={28}
                    height={28}
                    className="size-4 md:size-6"
                  />
                  <a
                    href="/"
                    className="text-sm font-bold text-base-content hover:underline md:text-base"
                  >
                    {websiteName}
                  </a>
                </div>
                <div className="text-xs opacity-30 md:text-sm">|</div>
                <div className="mt-0.5 text-xs font-medium uppercase tracking-wide md:text-sm">
                  Real-time
                </div>
                <div className="ml-auto flex items-center gap-1 max-md:hidden">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Share2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Music className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Maximize className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <StatsSection visitors={visitors} />
            </div>

            {mapboxToken && (
              <Map
                {...viewState}
                onMove={onViewportChange}
                mapStyle={mapStyle}
                mapboxAccessToken={mapboxToken}
                style={{ width: "100%", height: "100%" }}
                attributionControl={false}
                reuseMaps={true}
              >
                {visitors.map((visitor) => (
                  <VisitorMarker
                    key={visitor.userId || visitor.visitorId}
                    visitor={visitor}
                  />
                ))}
              </Map>
            )}

            {(!isMapLoaded || isLoading) && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-700/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-6 w-full max-w-md px-8">
                  <div className="w-full space-y-3">
                    <div className="relative w-full h-2.5 bg-gray-600/30 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-300 ease-out progress-glow"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-300 text-center">
                      {!isMapLoaded ? "Loading map..." : "Loading visitors..."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <ActivityFeed visitors={visitors} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
