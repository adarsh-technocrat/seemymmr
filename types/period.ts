export const Period = {
  Today: "today",
  Yesterday: "yesterday",
  Last24Hours: "last24h",
  Last7Days: "last7d",
  Last30Days: "last30d",
  Last12Months: "last12m",
  WeekToDate: "week_to_date",
  MonthToDate: "month_to_date",
  YearToDate: "year_to_date",
  AllTime: "all_time",
  Custom: "custom",
} as const;

export type PeriodValue = (typeof Period)[keyof typeof Period];

export const PERIOD_DISPLAY: Record<PeriodValue, string> = {
  [Period.Today]: "Today",
  [Period.Yesterday]: "Yesterday",
  [Period.Last24Hours]: "Last 24 hours",
  [Period.Last7Days]: "Last 7 days",
  [Period.Last30Days]: "Last 30 days",
  [Period.Last12Months]: "Last 12 months",
  [Period.WeekToDate]: "Week to date",
  [Period.MonthToDate]: "Month to date",
  [Period.YearToDate]: "Year to date",
  [Period.AllTime]: "All time",
  [Period.Custom]: "Custom",
};

const DISPLAY_TO_PERIOD: Record<string, PeriodValue> = Object.fromEntries(
  (Object.entries(PERIOD_DISPLAY) as [PeriodValue, string][]).map(
    ([value, label]) => [label, value],
  ),
);

const PERIOD_VALUES = new Set<string>(Object.values(Period));

export function toPeriodValue(input: string): PeriodValue | string {
  const trimmed = input.trim();
  if (trimmed.startsWith("custom:")) return trimmed;
  if (PERIOD_VALUES.has(trimmed)) return trimmed as PeriodValue;
  return DISPLAY_TO_PERIOD[trimmed] ?? Period.Today;
}

export function toPeriodDisplay(value: PeriodValue): string {
  return PERIOD_DISPLAY[value];
}

export const PERIOD_OPTIONS: PeriodValue[] = [
  Period.Today,
  Period.Yesterday,
  Period.Last24Hours,
  Period.Last7Days,
  Period.Last30Days,
  Period.Last12Months,
  Period.WeekToDate,
  Period.MonthToDate,
  Period.YearToDate,
  Period.AllTime,
  Period.Custom,
];
