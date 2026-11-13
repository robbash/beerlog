import { nextDayAtHour, zonedHourToUtc } from '@/lib/shared/timezone';

// Europe/Berlin is UTC+1 in winter and UTC+2 in summer. In 2026 it switches to
// summer time on 29 March and back on 25 October.
describe('zonedHourToUtc', () => {
  it('resolves a winter morning as CET', () => {
    expect(zonedHourToUtc('2026-11-14', 8).toISOString()).toBe('2026-11-14T07:00:00.000Z');
  });

  it('resolves a summer morning as CEST', () => {
    expect(zonedHourToUtc('2026-07-14', 8).toISOString()).toBe('2026-07-14T06:00:00.000Z');
  });

  it('resolves midnight', () => {
    expect(zonedHourToUtc('2026-11-14', 0).toISOString()).toBe('2026-11-13T23:00:00.000Z');
  });

  it('uses the offset in force on the day summer time starts', () => {
    // 08:00 on the switch day is already CEST, so UTC+2.
    expect(zonedHourToUtc('2026-03-29', 8).toISOString()).toBe('2026-03-29T06:00:00.000Z');
  });

  it('uses the offset in force on the day summer time ends', () => {
    // The clocks go back at 03:00, so 08:00 is CET again, UTC+1.
    expect(zonedHourToUtc('2026-10-25', 8).toISOString()).toBe('2026-10-25T07:00:00.000Z');
  });

  it('honours an explicit timezone', () => {
    expect(zonedHourToUtc('2026-11-14', 8, 'UTC').toISOString()).toBe('2026-11-14T08:00:00.000Z');
  });
});

describe('nextDayAtHour', () => {
  it('moves to the following day', () => {
    expect(nextDayAtHour('2026-11-13', 8).toISOString()).toBe('2026-11-14T07:00:00.000Z');
  });

  it('crosses a month boundary', () => {
    expect(nextDayAtHour('2026-11-30', 8).toISOString()).toBe('2026-12-01T07:00:00.000Z');
  });

  it('crosses a year boundary', () => {
    expect(nextDayAtHour('2026-12-31', 8).toISOString()).toBe('2027-01-01T07:00:00.000Z');
  });

  it('handles a leap day', () => {
    expect(nextDayAtHour('2028-02-28', 8).toISOString()).toBe('2028-02-29T07:00:00.000Z');
  });

  it('crosses the start of summer time', () => {
    // Event on the Saturday, first reminder on the Sunday the clocks go forward.
    expect(nextDayAtHour('2026-03-28', 8).toISOString()).toBe('2026-03-29T06:00:00.000Z');
  });
});
