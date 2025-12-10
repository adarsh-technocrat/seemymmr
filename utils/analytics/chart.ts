interface ChartDataPoint {
  date: string;
}

/**
 * Calculate the current time index for forecast line rendering
 * @param data - Array of chart data points with date strings
 * @returns The index of the current hour in the data, or null if not hourly data
 */
export function getCurrentTimeIndex(data: ChartDataPoint[]): number | null {
  if (!data || data.length === 0) return null;

  const now = new Date();
  const currentHour = now.getHours();

  // Check if data is hourly format (e.g., "12am", "1am", etc.)
  const firstDate = data[0]?.date;
  if (firstDate && (firstDate.includes("am") || firstDate.includes("pm"))) {
    // Find the index of the current hour in the data
    const hour12 = currentHour % 12 || 12;
    const ampm = currentHour < 12 ? "am" : "pm";
    const formattedHour = `${hour12}${ampm}`;

    const exactIndex = data.findIndex((d) => d.date === formattedHour);
    if (exactIndex !== -1) {
      return exactIndex;
    }

    // Find the closest hour
    const hourValues = data.map((d, idx) => {
      const hourStr = d.date.replace(/[^0-9]/g, "");
      const hour = parseInt(hourStr) || 12;
      const isPM = d.date.includes("pm");
      const hour24 = hour === 12 ? (isPM ? 12 : 0) : hour + (isPM ? 12 : 0);
      return {
        index: idx,
        hour24: hour24,
      };
    });

    const closest = hourValues.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.hour24 - currentHour);
      const currDiff = Math.abs(curr.hour24 - currentHour);
      return currDiff < prevDiff ? curr : prev;
    });

    return closest.index;
  }

  // For non-hourly data, return null (no forecast)
  return null;
}
