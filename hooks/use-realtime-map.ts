import { useEffect, useState, useMemo, useCallback } from "react";
import {
  type Visitor,
  type PaymentEvent,
  type PageViewEvent,
  DEFAULT_COORDS,
  getVisitorCoordinates,
} from "@/utils/realtime-map";

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const POLL_INTERVAL = 5000; // 5 seconds

interface UseRealtimeMapProps {
  open: boolean;
  websiteId: string;
}

export function useRealtimeMap({ open, websiteId }: UseRealtimeMapProps) {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [paymentEvents, setPaymentEvents] = useState<PaymentEvent[]>([]);
  const [pageViewEvents, setPageViewEvents] = useState<PageViewEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [viewState, setViewState] = useState<ViewState>({
    longitude: 0, // Center on prime meridian
    latitude: 0, // Center on equator for centered globe
    zoom: 2.5, // Slightly zoomed in for better scale
    bearing: 0, // Start with north up
    pitch: 0,
  });

  const mapStyle = useMemo(() => {
    return "mapbox://styles/adarsh433/clyzsaedz00fs01p6ap634sgi";
  }, []);

  const onViewportChange = useCallback((evt: { viewState: ViewState }) => {
    setViewState(evt.viewState);
  }, []);

  // Simulate progress for loading
  useEffect(() => {
    if (!open) {
      setProgress(0);
      setIsMapLoaded(false);
      setIsLoading(true);
      return;
    }
    if (isMapLoaded && !isLoading) {
      setProgress(100);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev; // Cap at 90% until fully loaded
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [open, isMapLoaded, isLoading]);

  // Mark map as loaded after a short delay when dialog opens
  useEffect(() => {
    if (!open) {
      setIsMapLoaded(false);
      return;
    }

    // Simulate map loading
    const timer = setTimeout(() => {
      setIsMapLoaded(true);
      setProgress(95);
    }, 500);

    return () => clearTimeout(timer);
  }, [open]);

  // Fetch visitors
  useEffect(() => {
    if (!open || !websiteId) {
      setIsLoading(true);
      setVisitors([]);
      return;
    }

    let isMounted = true;

    const fetchVisitors = async () => {
      try {
        const response = await fetch(
          `/api/websites/${websiteId}/realtime/visitors`
        );
        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          // API now returns one entry per visitor (already grouped)
          // But we still deduplicate by visitorId/userId as a safety measure
          const visitorsList = data.visitors || [];
          const paymentEventsList = data.paymentEvents || [];
          const pageViewEventsList = data.pageViewEvents || [];

          const visitorMap = new Map<string, Visitor>();
          visitorsList.forEach((visitor: Visitor) => {
            // Use userId for grouping if available, otherwise visitorId
            const groupKey = visitor.userId || visitor.visitorId;
            const existing = visitorMap.get(groupKey);
            if (
              !existing ||
              new Date(visitor.lastSeenAt) > new Date(existing.lastSeenAt)
            ) {
              visitorMap.set(groupKey, visitor);
            }
          });

          // Convert map back to array
          const uniqueVisitors = Array.from(visitorMap.values());

          setVisitors(uniqueVisitors);
          setPaymentEvents(paymentEventsList);
          setPageViewEvents(pageViewEventsList);
        } else {
          console.error("Failed to fetch visitors:", response.status);
        }
        setIsLoading(false);
        setProgress(100); // Complete when visitors are loaded
      } catch (error) {
        console.error("Error fetching visitors:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchVisitors();
    const interval = setInterval(fetchVisitors, POLL_INTERVAL);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [open, websiteId]);

  // Auto-rotate map (rotate around the globe) - DISABLED
  // useEffect(() => {
  //   if (!open || !isMapLoaded) return;

  //   let rotationId: number;
  //   let isPaused = false;
  //   let lastInteractionTime = Date.now();
  //   const ROTATION_SPEED = 0.05; // degrees per frame (slower rotation for smoother effect)
  //   const PAUSE_DURATION = 3000; // 3 seconds

  //   const rotate = () => {
  //     if (isPaused) {
  //       rotationId = requestAnimationFrame(rotate);
  //       return;
  //     }

  //     setViewState((prev: ViewState) => ({
  //       ...prev,
  //       longitude: (prev.longitude + ROTATION_SPEED) % 360, // Rotate around the globe
  //       bearing: prev.bearing || 0, // Keep bearing stable for globe rotation
  //       pitch: prev.pitch || 45, // Maintain 3D pitch
  //     }));

  //     rotationId = requestAnimationFrame(rotate);
  //   };

  //   const handleInteraction = () => {
  //     isPaused = true;
  //     lastInteractionTime = Date.now();

  //     const checkResume = () => {
  //       if (Date.now() - lastInteractionTime >= PAUSE_DURATION) {
  //         isPaused = false;
  //       } else {
  //         setTimeout(checkResume, 100);
  //       }
  //     };

  //     checkResume();
  //   };

  //   rotationId = requestAnimationFrame(rotate);

  //   // Pause on user interaction
  //   window.addEventListener("mousedown", handleInteraction);
  //   window.addEventListener("touchstart", handleInteraction);
  //   window.addEventListener("wheel", handleInteraction);

  //   return () => {
  //     cancelAnimationFrame(rotationId);
  //     window.removeEventListener("mousedown", handleInteraction);
  //     window.removeEventListener("touchstart", handleInteraction);
  //     window.removeEventListener("wheel", handleInteraction);
  //   };
  // }, [open, isMapLoaded]);

  return {
    visitors,
    paymentEvents,
    pageViewEvents,
    isLoading,
    isMapLoaded,
    progress,
    viewState,
    onViewportChange,
    mapStyle,
    mapboxToken: MAPBOX_TOKEN,
  };
}
