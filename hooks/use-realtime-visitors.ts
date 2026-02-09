"use client";

import { useEffect, useState, useRef } from "react";

interface RealtimeData {
  type: "connected" | "update" | "error";
  visitorsNow?: number;
  timestamp?: string;
  message?: string;
}

export function useRealtimeVisitors(websiteId: string | null) {
  const [visitorsNow, setVisitorsNow] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!websiteId) return;

    // Create EventSource connection
    const eventSource = new EventSource(`/api/websites/${websiteId}/realtime`);

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: RealtimeData = JSON.parse(event.data);

        if (data.type === "connected") {
          setIsConnected(true);
        } else if (data.type === "update" && data.visitorsNow !== undefined) {
          setVisitorsNow(data.visitorsNow);
          setError(null);
        } else if (data.type === "error") {
          setError(data.message || "An error occurred");
        }
      } catch (err) {
        setError("Failed to parse real-time data");
      }
    };

    eventSource.onerror = (err) => {
      setIsConnected(false);
      setError("Connection lost. Reconnecting...");

      // EventSource will automatically reconnect
      // But we can also manually reconnect if needed
      setTimeout(() => {
        if (eventSource.readyState === EventSource.CLOSED) {
          eventSource.close();
          eventSourceRef.current = null;
        }
      }, 5000);
    };

    eventSourceRef.current = eventSource;

    // Cleanup on unmount
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [websiteId]);

  return {
    visitorsNow,
    isConnected,
    error,
  };
}
