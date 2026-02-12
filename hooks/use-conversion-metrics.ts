import { useState, useEffect, useCallback } from "react";
import type {
  ConversionMetricsPayload,
  ConversionMetricsResponse,
} from "@/types/conversion-metrics";

export function useConversionMetrics(websiteId: string | null) {
  const [data, setData] = useState<ConversionMetricsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!websiteId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/websites/${websiteId}/conversion-metrics`);
      if (!res.ok) {
        throw new Error("Failed to fetch conversion metrics");
      }
      const json: ConversionMetricsResponse = await res.json();
      setData(json.conversionMetrics);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [websiteId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { conversionMetrics: data, loading, error, refetch: fetchMetrics };
}
