export const PERIOD_OPTIONS = [
  "Today",
  "Yesterday",
  "Last 24 hours",
  "Last 7 days",
  "Last 30 days",
  "Last 12 months",
  "Week to date",
  "Month to date",
  "Year to date",
  "All time",
  "Custom",
] as const;

export type PeriodOption = (typeof PERIOD_OPTIONS)[number];

export function toApiPeriod(uiPeriod: string): string {
  if (uiPeriod === "Custom") return "Custom";
  return uiPeriod.toLowerCase();
}
