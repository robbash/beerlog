import { appTimeZone } from '@/lib/constants';

/**
 * How far `timeZone` is ahead of UTC at `instant`, in milliseconds.
 *
 * Derived from Intl rather than a fixed offset, so DST is handled by the
 * runtime's own tz data instead of being hard coded.
 */
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  const asUtc = Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    // Some runtimes render midnight as hour 24.
    value('hour') % 24,
    value('minute'),
    value('second'),
  );

  // The parts carry no milliseconds, so compare against whole seconds.
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/**
 * The instant at which the clock in `timeZone` reads `hour` on `date`
 * (a plain `yyyy-MM-dd` day, as stored on events and logs).
 *
 * Dates have no timezone of their own, and the server runs in UTC while the
 * team reads the app in `appTimeZone`, so a boundary like "the next morning"
 * has to be resolved against that clock or it drifts by an hour with DST.
 */
export function zonedHourToUtc(date: string, hour: number, timeZone = appTimeZone): Date {
  const [year, month, day] = date.split('-').map(Number);
  const wallClock = Date.UTC(year, month - 1, day, hour);

  // Two passes: the offset at the naive guess can belong to the wrong side of
  // a DST switch, so re-read it at the corrected instant.
  const firstPass = wallClock - zoneOffsetMs(new Date(wallClock), timeZone);

  return new Date(wallClock - zoneOffsetMs(new Date(firstPass), timeZone));
}

/** Same as {@link zonedHourToUtc}, for the day after `date`. */
export function nextDayAtHour(date: string, hour: number, timeZone = appTimeZone): Date {
  const [year, month, day] = date.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);

  return zonedHourToUtc(next, hour, timeZone);
}
