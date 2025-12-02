import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAnalytics } from "@/store/slices/analyticsSlice";

export function useAnalytics(websiteId: string) {
  const dispatch = useAppDispatch();
  const analytics = useAppSelector((state) => state.analytics);
  const selectedPeriod = useAppSelector((state) => state.ui.selectedPeriod);
  const selectedGranularity = useAppSelector(
    (state) => state.ui.selectedGranularity
  );

  const getDateRange = (period: string) => {
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case "Last 7 days":
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "Last 30 days":
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "Last 90 days":
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "Last year":
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate };
  };

  const getGranularity = (
    granularity: string
  ): "hourly" | "daily" | "weekly" | "monthly" => {
    switch (granularity.toLowerCase()) {
      case "hourly":
        return "hourly";
      case "daily":
        return "daily";
      case "weekly":
        return "weekly";
      case "monthly":
        return "monthly";
      default:
        return "daily";
    }
  };

  useEffect(() => {
    if (!websiteId) return;

    const { startDate, endDate } = getDateRange(selectedPeriod);
    const granularity = getGranularity(selectedGranularity);

    dispatch(
      fetchAnalytics({
        websiteId,
        startDate,
        endDate,
        granularity,
      })
    );
  }, [websiteId, selectedPeriod, selectedGranularity, dispatch]);

  return {
    ...analytics,
    refetch: () => {
      if (!websiteId) return;
      const { startDate, endDate } = getDateRange(selectedPeriod);
      const granularity = getGranularity(selectedGranularity);
      dispatch(
        fetchAnalytics({
          websiteId,
          startDate,
          endDate,
          granularity,
        })
      );
    },
  };
}
