import {
  addWeeks,
  endOfISOWeek,
  format,
  getISOWeek,
  getISOWeekYear,
  startOfDay,
  startOfISOWeek,
} from 'date-fns';
import { dateFormat } from '@/lib/constants';

export interface SummerGamesPeriod {
  startDate: Date;
  endDate: Date; // inclusive (last day of the last ISO week within the period)
  durationWeeks: number;
  feeCents: number;
}

export interface SummerGamesConfigInput {
  startDate: string | null;
  durationWeeks: number;
  feeCents: number;
}

/**
 * Resolve the configured summer games period.
 * Returns null when start date is not configured.
 * The period spans exactly `durationWeeks` ISO weeks starting from the ISO week
 * that contains the configured start date.
 */
export function resolveSummerGamesPeriod(
  config: SummerGamesConfigInput,
): SummerGamesPeriod | null {
  if (!config.startDate) return null;

  const configuredStart = new Date(`${config.startDate}T00:00:00`);
  if (isNaN(configuredStart.getTime())) return null;

  const periodStart = startOfISOWeek(configuredStart);
  const lastWeekStart = addWeeks(periodStart, Math.max(1, config.durationWeeks) - 1);
  const periodEnd = endOfISOWeek(lastWeekStart);

  return {
    startDate: periodStart,
    endDate: periodEnd,
    durationWeeks: Math.max(1, config.durationWeeks),
    feeCents: Math.max(0, config.feeCents),
  };
}

/**
 * True when the given moment falls within the configured summer games period.
 */
export function isWithinSummerGames(
  period: SummerGamesPeriod | null,
  at: Date = new Date(),
): boolean {
  if (!period) return false;
  const t = at.getTime();
  return t >= period.startDate.getTime() && t <= period.endDate.getTime();
}

/**
 * Return the ISO year + week for a given date. Uses the same rules as
 * date-fns (Mon–Sun, ISO-8601).
 */
export function isoYearWeekOf(date: Date): { isoYear: number; isoWeek: number } {
  return { isoYear: getISOWeekYear(date), isoWeek: getISOWeek(date) };
}

/**
 * Given an ISO year/week, return the range [Mon 00:00, Sun 23:59:59.999]
 * as `yyyy-MM-dd` strings.
 */
export function isoWeekDateRange(isoYear: number, isoWeek: number): {
  start: string;
  end: string;
} {
  // Reference date inside the target ISO week: 4th of January of that year
  // is always in ISO week 1, so shift by (week - 1) weeks.
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4Local = new Date(jan4.getUTCFullYear(), jan4.getUTCMonth(), jan4.getUTCDate());
  const weekStart = startOfISOWeek(addWeeks(jan4Local, isoWeek - 1));
  const weekEnd = endOfISOWeek(weekStart);
  return {
    start: format(weekStart, dateFormat),
    end: format(weekEnd, dateFormat),
  };
}

/**
 * Format a date as `yyyy-MM-dd`.
 */
export function toDateString(date: Date): string {
  return format(date, dateFormat);
}

/**
 * Return true when the given `yyyy-MM-dd` date falls inside the given ISO week.
 */
export function dateIsInIsoWeek(dateStr: string, isoYear: number, isoWeek: number): boolean {
  const { start, end } = isoWeekDateRange(isoYear, isoWeek);
  return dateStr >= start && dateStr <= end;
}

/**
 * Return today's ISO year/week using local time.
 */
export function currentIsoYearWeek(now: Date = new Date()): { isoYear: number; isoWeek: number } {
  return isoYearWeekOf(startOfDay(now));
}

/**
 * Human-friendly period label like "14 Jul – 25 Aug 2026".
 * Kept locale-agnostic (numeric only) to be safe outside of a next-intl scope.
 */
export function periodLabel(period: SummerGamesPeriod): string {
  const start = format(period.startDate, 'dd.MM.yyyy');
  const end = format(period.endDate, 'dd.MM.yyyy');
  return `${start} – ${end}`;
}

