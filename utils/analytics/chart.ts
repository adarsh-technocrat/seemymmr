interface ChartDataPoint {
  date: string;
  fullDate?: string;
  timestamp?: string;
}

/**
 * Format date display for tooltip: "Today [time]" if today, otherwise use fullDate
 * @param data - Chart data point with date information
 * @returns Formatted date string
 */
export function formatDateDisplay(data: {
  date: string;
  fullDate?: string;
  timestamp?: string;
}): string {
  if (!data.timestamp) {
    return data.fullDate || data.date;
  }

  const dataDate = new Date(data.timestamp);
  const today = new Date();
  const isToday =
    dataDate.getFullYear() === today.getFullYear() &&
    dataDate.getMonth() === today.getMonth() &&
    dataDate.getDate() === today.getDate();

  if (isToday) {
    const hour = dataDate.getHours();
    const hour12 = hour % 12 || 12;
    const ampm = hour < 12 ? "AM" : "PM";
    return `Today ${hour12} ${ampm}`;
  }

  return data.fullDate || data.date;
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

export interface BarShapeProps {
  payload?: {
    revenueNew?: number;
    revenueRenewal?: number;
    revenueRefund?: number;
    [key: string]: any;
  };
  value?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  [key: string]: any;
}

/**
 * Determine if revenueNew bar should have rounded corners
 * @param props - Bar shape props from Recharts
 * @returns true if the bar should have rounded top corners
 */
export function shouldHaveRadiusForNew(props: BarShapeProps): boolean {
  const { payload, value } = props;
  if (!payload || value === undefined || value <= 0) return false;

  const hasRevenueNew = (payload.revenueNew || 0) > 0;
  const hasRevenueRenewal = (payload.revenueRenewal || 0) > 0;
  const hasRevenueRefund = (payload.revenueRefund || 0) > 0;

  const barCount = [hasRevenueNew, hasRevenueRenewal, hasRevenueRefund].filter(
    Boolean
  ).length;

  // If only one bar exists, it should have radius
  if (barCount === 1 && hasRevenueNew) return true;

  // revenueNew is only topmost if it's the only bar
  return false;
}

/**
 * Determine if revenueRenewal bar should have rounded corners
 * @param props - Bar shape props from Recharts
 * @returns true if the bar should have rounded top corners
 */
export function shouldHaveRadiusForRenewal(props: BarShapeProps): boolean {
  const { payload, value } = props;
  if (!payload || value === undefined || value <= 0) return false;

  const hasRevenueNew = (payload.revenueNew || 0) > 0;
  const hasRevenueRenewal = (payload.revenueRenewal || 0) > 0;
  const hasRevenueRefund = (payload.revenueRefund || 0) > 0;

  const barCount = [hasRevenueNew, hasRevenueRenewal, hasRevenueRefund].filter(
    Boolean
  ).length;

  // If only one bar exists, it should have radius
  if (barCount === 1 && hasRevenueRenewal) return true;

  // revenueRenewal is topmost if refund doesn't exist
  if (barCount > 1 && hasRevenueRenewal && !hasRevenueRefund) return true;

  return false;
}

/**
 * Determine if revenueRefund bar should have rounded corners
 * @param props - Bar shape props from Recharts
 * @returns true if the bar should have rounded top corners
 */
export function shouldHaveRadiusForRefund(props: BarShapeProps): boolean {
  const { payload, value } = props;
  if (!payload || value === undefined || value <= 0) return false;

  const hasRevenueNew = (payload.revenueNew || 0) > 0;
  const hasRevenueRenewal = (payload.revenueRenewal || 0) > 0;
  const hasRevenueRefund = (payload.revenueRefund || 0) > 0;

  const barCount = [hasRevenueNew, hasRevenueRenewal, hasRevenueRefund].filter(
    Boolean
  ).length;

  // If only one bar exists, it should have radius
  if (barCount === 1 && hasRevenueRefund) return true;

  // revenueRefund is always topmost if it exists
  if (barCount > 1 && hasRevenueRefund) return true;

  return false;
}

/**
 * Create an SVG path for a rectangle with only the top corners rounded
 * @param x - X coordinate of the rectangle
 * @param y - Y coordinate of the rectangle (top edge)
 * @param width - Width of the rectangle
 * @param height - Height of the rectangle
 * @param radius - Radius for the rounded corners
 * @returns SVG path string
 */
export function createRoundedTopRectPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): string {
  // Clamp radius to not exceed half the width or height
  const r = Math.min(radius, width / 2, height);

  // If height is very small or width is too narrow, use a simple rect
  if (height <= r || width < r * 2) {
    return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${
      y + height
    } L ${x} ${y + height} Z`;
  }

  // Path for rectangle with only top corners rounded
  // Start from bottom-left, go clockwise: bottom-right, top-right (with rounded corner), top-left (with rounded corner), close
  // Q command: Q controlX controlY endX endY
  return `M ${x} ${y + height} 
          L ${x + width} ${y + height} 
          L ${x + width} ${y + r} 
          Q ${x + width} ${y} ${x + width - r} ${y} 
          L ${x + r} ${y} 
          Q ${x} ${y} ${x} ${y + r} 
          Z`;
}
