import { type TimeZone } from "timezones-list";
import {
  toZonedTime,
  fromZonedTime,
  getTimezoneOffset as getTzOffsetMs,
} from "date-fns-tz";
import { startOfDay, endOfDay } from "date-fns";

export function convertUTCTimezoneToLocal(
  datetime_in_utc: Date,
  local_timezone: TimeZone,
): Date {
  if (!(datetime_in_utc instanceof Date) || isNaN(datetime_in_utc.getTime()))
    throw new Error("Invalid date");
  if (!local_timezone?.tzCode) throw new Error("Invalid timezone");
  return toZonedTime(datetime_in_utc, local_timezone.tzCode);
}

export function utcToZonedTime(date: Date, timeZone: string): Date {
  if (!(date instanceof Date) || isNaN(date.getTime()))
    throw new Error("Invalid date");
  return toZonedTime(date, timeZone);
}

export function getTimezoneOffset(timezone: string, date: Date): number {
  return getTzOffsetMs(timezone, date);
}

export function getTimezoneComponents(
  utcDate: Date,
  timezone: string,
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const zoned = toZonedTime(utcDate, timezone);
  return {
    year: zoned.getFullYear(),
    month: zoned.getMonth() + 1,
    day: zoned.getDate(),
    hour: zoned.getHours(),
    minute: zoned.getMinutes(),
  };
}

export function startOfDayInTimezone(date: Date, timezone: string): Date {
  const zoned = toZonedTime(date, timezone);
  const start = startOfDay(zoned);
  return fromZonedTime(start, timezone);
}

export function endOfDayInTimezone(date: Date, timezone: string): Date {
  const zoned = toZonedTime(date, timezone);
  const end = endOfDay(zoned);
  return fromZonedTime(end, timezone);
}

export function createUTCDateFromTimezoneComponents(
  year: number,
  month: number,
  day: number,
  hour: number,
  timezone: string,
): Date {
  const arbitrary = new Date(0);
  const zoned = toZonedTime(arbitrary, timezone);
  zoned.setFullYear(year);
  zoned.setMonth(month - 1);
  zoned.setDate(day);
  zoned.setHours(hour, 0, 0, 0);
  return fromZonedTime(zoned, timezone);
}

export function getTimezoneOffsetString(timezone: string, date: Date): string {
  const offsetMs = getTimezoneOffset(timezone, date);
  const offsetHours = Math.floor(Math.abs(offsetMs) / (60 * 60 * 1000));
  const offsetMinutes = Math.floor(
    (Math.abs(offsetMs) % (60 * 60 * 1000)) / (60 * 1000),
  );
  const sign = offsetMs >= 0 ? "+" : "-";
  return `${sign}${String(offsetHours).padStart(2, "0")}:${String(offsetMinutes).padStart(2, "0")}`;
}

export function getDateRangeForPeriod(
  period: string,
  timezone: TimeZone["tzCode"],
  _website?: { createdAt?: Date },
  earliestDataPoint?: Date | null,
): { startDate: Date; endDate: Date } {
  if (period.startsWith("custom:")) {
    const parts = period.split(":");
    if (parts.length === 3) {
      return {
        startDate: new Date(parts[1] + "T00:00:00"),
        endDate: new Date(parts[2] + "T23:59:59"),
      };
    }
  }

  const periodLower = period.toLowerCase();
  const now = new Date();

  let startDate: Date;
  let endDate: Date;

  switch (periodLower) {
    case "today":
      startDate = startOfDayInTimezone(now, timezone);
      endDate = endOfDayInTimezone(now, timezone);
      break;
    case "yesterday": {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      startDate = startOfDayInTimezone(yesterday, timezone);
      endDate = endOfDayInTimezone(yesterday, timezone);
      break;
    }
    case "last24h":
    case "last 24 hours":
      endDate = new Date();
      startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      break;
    case "last7d":
    case "last7days":
    case "last 7 days":
      endDate = endOfDayInTimezone(now, timezone);
      startDate = startOfDayInTimezone(
        new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        timezone,
      );
      break;
    case "last30d":
    case "last30days":
    case "last 30 days":
      endDate = endOfDayInTimezone(now, timezone);
      startDate = startOfDayInTimezone(
        new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        timezone,
      );
      break;
    case "last12m":
    case "last12months":
    case "last 12 months":
      endDate = endOfDayInTimezone(now, timezone);
      const twelveMonthsAgo = new Date(now);
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      twelveMonthsAgo.setDate(1);
      startDate = startOfDayInTimezone(twelveMonthsAgo, timezone);
      break;
    case "week":
    case "week to date":
      endDate = endOfDayInTimezone(now, timezone);
      const nowInTz = new Date(
        now.toLocaleString("en-US", { timeZone: timezone }),
      );
      const dayOfWeek = nowInTz.getDay();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - dayOfWeek);
      startDate = startOfDayInTimezone(weekStart, timezone);
      break;
    case "month":
    case "month to date":
      endDate = endOfDayInTimezone(now, timezone);
      const monthStart = new Date(now);
      monthStart.setDate(1);
      startDate = startOfDayInTimezone(monthStart, timezone);
      break;
    case "year":
    case "year to date":
      endDate = endOfDayInTimezone(now, timezone);
      const yearStart = new Date(now);
      yearStart.setMonth(0);
      yearStart.setDate(1);
      startDate = startOfDayInTimezone(yearStart, timezone);
      break;
    case "all":
    case "all time":
      endDate = endOfDayInTimezone(now, timezone);
      const maxYearsBack = 5;
      const maxDate = new Date(
        now.getTime() - maxYearsBack * 365 * 24 * 60 * 60 * 1000,
      );
      if (earliestDataPoint) {
        const earliest = new Date(earliestDataPoint);
        startDate = earliest > maxDate ? earliest : maxDate;
      } else {
        startDate = maxDate;
      }
      const startMonth = new Date(startDate);
      startMonth.setDate(1);
      startMonth.setHours(0, 0, 0, 0);
      startDate = startOfDayInTimezone(startMonth, timezone);
      break;
    default:
      startDate = startOfDayInTimezone(now, timezone);
      endDate = endOfDayInTimezone(now, timezone);
  }

  return { startDate, endDate };
}
