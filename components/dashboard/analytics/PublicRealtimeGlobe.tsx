"use client";

import { useCallback, useState } from "react";
import Map from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Music, RefreshCw } from "lucide-react";
import { useRealtimeMap } from "@/hooks/use-realtime-map";
import { Logo } from "@/components/landing/Logo";
import {
  StatsSection,
  ActivityFeed,
  VisitorMarker,
  MusicPlayer,
  SoundwaveIcon,
} from "./realtime-map";

interface PublicRealtimeGlobeProps {
  websiteId: string;
  shareId: string;
  websiteName?: string;
}

export function PublicRealtimeGlobe({
  websiteId,
  shareId,
  websiteName = "PostMetric",
}: PublicRealtimeGlobeProps) {
  const {
    visitors,
    paymentEvents,
    pageViewEvents,
    isLoading,
    isMapLoaded,
    progress,
    viewState,
    onViewportChange,
    mapStyle,
    mapboxToken,
    isRotating,
    toggleRotation,
    focusedVisitorId,
    focusOnVisitor,
    selectedVisitorId,
    selectVisitor,
    clearSelectedVisitor,
  } = useRealtimeMap({
    open: true,
    websiteId,
    shareId,
  });

  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isMusicPlayerActive, setIsMusicPlayerActive] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.7);

  const toggleMusic = useCallback(() => {
    if (!isMusicPlayerActive) {
      // First time clicking - activate the player and start playing
      setIsMusicPlayerActive(true);
      setIsMusicPlaying(true);
    } else {
      // Toggle play/pause
      setIsMusicPlaying((prev) => !prev);
    }
  }, [isMusicPlayerActive]);

  const handleVolumeChange = useCallback((volume: number) => {
    setMusicVolume(volume);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-50">
      <div className="h-full w-full overflow-hidden relative">
        <div className="absolute left-0 top-0 z-10 w-full max-w-full md:left-4 md:top-4 md:w-96 md:rounded-box custom-card border border-base-content/10 bg-base-100 p-4 pb-0 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-start gap-2 text-base-secondary">
            <div className="flex items-center gap-1.5">
              <Logo textSize="md" iconSize="md" />
            </div>
            <div className="text-xs opacity-30 md:text-sm">|</div>
            <div className="mt-0.5 text-xs font-medium uppercase tracking-wide md:text-sm">
              Real-time
            </div>
            <div className="ml-auto flex items-center gap-1 max-md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 ${
                  isMusicPlaying
                    ? "!border-primary/10 !bg-primary/10 !text-primary"
                    : ""
                }`}
                title={
                  !isMusicPlayerActive
                    ? "Start radio"
                    : isMusicPlaying
                      ? "Pause radio"
                      : "Play radio"
                }
                onClick={toggleMusic}
              >
                {isMusicPlaying ? (
                  <span
                    className="inline-block size-3.5"
                    style={{ verticalAlign: "middle" }}
                  >
                    <SoundwaveIcon />
                  </span>
                ) : (
                  <Music className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 ${
                  isRotating
                    ? "!border-primary/10 !bg-primary/10 !text-primary"
                    : ""
                }`}
                title={isRotating ? "Stop auto-panning" : "Start auto-panning"}
                onClick={toggleRotation}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isRotating ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
          <StatsSection visitors={visitors} websiteName={websiteName} />
          {isMusicPlayerActive && (
            <MusicPlayer
              isPlaying={isMusicPlaying}
              onToggle={toggleMusic}
              onVolumeChange={handleVolumeChange}
              volume={musicVolume}
            />
          )}
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
            {visitors.map((visitor) => {
              const visitorKey = visitor.userId || visitor.visitorId;
              return (
                <VisitorMarker
                  key={visitorKey}
                  visitor={visitor}
                  isFocused={focusedVisitorId === visitorKey}
                  onSelect={selectVisitor}
                />
              );
            })}
          </Map>
        )}

        {(!isMapLoaded || isLoading) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-6 w-full max-w-md px-8">
              <div className="w-full space-y-3">
                <div className="relative w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-300 ease-out progress-glow"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-700 text-center">
                  {!isMapLoaded ? "Loading map..." : "Loading visitors..."}
                </p>
              </div>
            </div>
          </div>
        )}

        <ActivityFeed
          visitors={visitors}
          paymentEvents={paymentEvents}
          pageViewEvents={pageViewEvents}
          selectedVisitorId={selectedVisitorId}
          onVisitorClick={selectVisitor}
          onClearSelection={clearSelectedVisitor}
        />
      </div>
    </div>
  );
}
