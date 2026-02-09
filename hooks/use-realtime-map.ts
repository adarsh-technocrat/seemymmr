import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
  transitionDuration?: number;
  transitionEasing?: (t: number) => number;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const POLL_INTERVAL = 5000; // 5 seconds

interface UseRealtimeMapProps {
  open: boolean;
  websiteId: string;
  shareId?: string; // Optional shareId for public access
}

export function useRealtimeMap({
  open,
  websiteId,
  shareId,
}: UseRealtimeMapProps) {
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

  const [isRotating, setIsRotating] = useState(false);
  const [focusedVisitorId, setFocusedVisitorId] = useState<string | null>(null);
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(
    null,
  );
  const animationFrameRef = useRef<number | null>(null);

  const onViewportChange = useCallback((evt: { viewState: ViewState }) => {
    setViewState(evt.viewState);
    // Stop rotation on any user interaction
    setIsRotating(false);
  }, []);

  const toggleRotation = useCallback(() => {
    setViewState((prev) => {
      const currentZoom = prev.zoom || 2.5;
      const idealZoom = 2.5;

      // If turning rotation ON and zoomed in, first zoom out to ideal position
      if (!isRotating && currentZoom > idealZoom + 0.1) {
        // Animate zoom out first
        const duration = 800; // 0.8 seconds for zoom animation
        const startTime = Date.now();
        const startZoom = currentZoom;

        const animateZoom = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          const currentZoomValue = startZoom + (idealZoom - startZoom) * eased;

          setViewState((current) => ({
            ...current,
            zoom: currentZoomValue,
            longitude: current.longitude,
            latitude: current.latitude,
            bearing: current.bearing || 0,
            pitch: current.pitch || 0,
          }));

          if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(animateZoom);
          } else {
            // Zoom complete, now start rotation
            setIsRotating(true);
            animationFrameRef.current = null;
          }
        };

        animationFrameRef.current = requestAnimationFrame(animateZoom);
      } else {
        // Just toggle rotation (either already at ideal zoom, or turning off)
        setIsRotating((prev) => !prev);
      }

      return prev;
    });
  }, [isRotating]);

  const focusOnVisitor = useCallback(
    (visitorId: string, userId?: string) => {
      const visitor = visitors.find(
        (v) => v.visitorId === visitorId || (userId && v.userId === userId),
      );

      if (visitor) {
        const [targetLongitude, targetLatitude] =
          getVisitorCoordinates(visitor);
        setFocusedVisitorId(visitor.userId || visitor.visitorId);

        setIsRotating(false);

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        setViewState((prev) => {
          const currentLongitude = prev.longitude;
          const currentLatitude = prev.latitude;
          const currentZoom = prev.zoom || 2.5;

          // Calculate shortest rotation path (considering globe wraps around)
          let rotationDistance = targetLongitude - currentLongitude;

          // Normalize to -180 to 180 range
          if (rotationDistance > 180) {
            rotationDistance -= 360;
          } else if (rotationDistance < -180) {
            rotationDistance += 360;
          }

          const duration = 2000; // 2 seconds for rotation
          const startTime = Date.now();
          const startLongitude = currentLongitude;
          const startLatitude = currentLatitude;
          const startZoom = currentZoom;
          const targetZoom = Math.max(currentZoom, 4);

          // Easing function (ease in out cubic)
          const easeInOutCubic = (t: number) => {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          };

          // Animate rotation
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeInOutCubic(progress);

            // Calculate current longitude
            let currentLng = startLongitude + rotationDistance * eased;

            while (currentLng > 180) currentLng -= 360;
            while (currentLng < -180) currentLng += 360;

            // Calculate interpolated latitude and zoom
            const currentLat =
              startLatitude + (targetLatitude - startLatitude) * eased;
            const currentZoomValue =
              startZoom + (targetZoom - startZoom) * eased;

            // Update view state during animation
            setViewState({
              longitude: currentLng,
              latitude: currentLat,
              zoom: currentZoomValue,
              bearing: prev.bearing || 0,
              pitch: prev.pitch || 0,
            });

            if (progress < 1) {
              animationFrameRef.current = requestAnimationFrame(animate);
            } else {
              // Final position - ensure we're exactly at target
              setViewState({
                longitude: targetLongitude,
                latitude: targetLatitude,
                zoom: targetZoom,
                bearing: prev.bearing || 0,
                pitch: prev.pitch || 0,
              });

              animationFrameRef.current = null;

              // Clear focus after a brief display period
              setTimeout(() => {
                setFocusedVisitorId(null);
              }, 1500);
            }
          };

          // Start animation
          animationFrameRef.current = requestAnimationFrame(animate);

          return prev;
        });
      }
    },
    [visitors],
  );

  // Cleanup animation on unmount or when dialog closes
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  // Simulate progress for loading
  useEffect(() => {
    if (!open) {
      setProgress(0);
      setIsMapLoaded(false);
      setIsLoading(true);
      // Cancel any ongoing animation when dialog closes
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
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
        // Use unified endpoint - supports both authenticated and public (via shareId)
        const endpoint = shareId
          ? `/api/websites/${websiteId}/realtime/visitors?shareId=${shareId}`
          : `/api/websites/${websiteId}/realtime/visitors`;
        const response = await fetch(endpoint);
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
        }
        setIsLoading(false);
        setProgress(100); // Complete when visitors are loaded
      } catch (error) {
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

  // Auto-rotate map (rotate around the globe)
  useEffect(() => {
    if (!open || !isMapLoaded || !isRotating) return;

    let rotationId: number;
    let isPaused = false;
    let lastInteractionTime = Date.now();
    const ROTATION_SPEED = 0.05; // degrees per frame (slower rotation for smoother effect)
    const PAUSE_DURATION = 3000; // 3 seconds

    const rotate = () => {
      if (isPaused) {
        rotationId = requestAnimationFrame(rotate);
        return;
      }

      setViewState((prev: ViewState) => ({
        ...prev,
        longitude: (prev.longitude + ROTATION_SPEED) % 360,
        bearing: prev.bearing || 0,
        zoom: prev.zoom || 2.5,
      }));

      rotationId = requestAnimationFrame(rotate);
    };

    const handleInteraction = () => {
      isPaused = true;
      lastInteractionTime = Date.now();

      const checkResume = () => {
        if (Date.now() - lastInteractionTime >= PAUSE_DURATION) {
          isPaused = false;
        } else {
          setTimeout(checkResume, 100);
        }
      };

      checkResume();
    };

    rotationId = requestAnimationFrame(rotate);

    window.addEventListener("mousedown", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);
    window.addEventListener("wheel", handleInteraction);

    return () => {
      cancelAnimationFrame(rotationId);
      window.removeEventListener("mousedown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("wheel", handleInteraction);
    };
  }, [open, isMapLoaded, isRotating]);

  const selectVisitor = useCallback((visitorId: string, userId?: string) => {
    const key = userId || visitorId;
    setSelectedVisitorId(key);
  }, []);

  const clearSelectedVisitor = useCallback(() => {
    setSelectedVisitorId(null);
  }, []);

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
    isRotating,
    toggleRotation,
    focusedVisitorId,
    focusOnVisitor,
    selectedVisitorId,
    selectVisitor,
    clearSelectedVisitor,
  };
}
