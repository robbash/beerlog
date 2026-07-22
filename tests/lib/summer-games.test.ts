import {
  currentIsoYearWeek,
  dateIsInIsoWeek,
  isoWeekDateRange,
  isWithinSummerGames,
  resolveSummerGamesPeriod,
  toDateString,
} from '@/lib/shared/summer-games';

describe('summer-games shared lib', () => {
  describe('resolveSummerGamesPeriod', () => {
    it('returns null when startDate is missing', () => {
      const p = resolveSummerGamesPeriod({
        startDate: null,
        durationWeeks: 6,
        feeCents: 500,
      });
      expect(p).toBeNull();
    });

    it('returns null when startDate is invalid', () => {
      const p = resolveSummerGamesPeriod({
        startDate: 'not-a-date',
        durationWeeks: 6,
        feeCents: 500,
      });
      expect(p).toBeNull();
    });

    it('snaps to the ISO week containing the start date and spans N weeks', () => {
      // 2026-07-15 (Wed) → ISO week starts Mon 2026-07-13, 6-week span
      // ends Sun 2026-08-23
      const p = resolveSummerGamesPeriod({
        startDate: '2026-07-15',
        durationWeeks: 6,
        feeCents: 500,
      });
      expect(p).not.toBeNull();
      expect(toDateString(p!.startDate)).toBe('2026-07-13');
      expect(toDateString(p!.endDate)).toBe('2026-08-23');
    });

    it('coerces duration < 1 up to 1', () => {
      const p = resolveSummerGamesPeriod({
        startDate: '2026-07-15',
        durationWeeks: 0,
        feeCents: 500,
      });
      expect(p!.durationWeeks).toBe(1);
      // Single week: 2026-07-13 – 2026-07-19
      expect(toDateString(p!.endDate)).toBe('2026-07-19');
    });
  });

  describe('isWithinSummerGames', () => {
    const period = resolveSummerGamesPeriod({
      startDate: '2026-07-15',
      durationWeeks: 6,
      feeCents: 500,
    })!;

    it('is false before the period', () => {
      expect(isWithinSummerGames(period, new Date('2026-07-12T23:59:59'))).toBe(false);
    });

    it('is true on the first day', () => {
      expect(isWithinSummerGames(period, new Date('2026-07-13T00:00:00'))).toBe(true);
    });

    it('is true on the last day', () => {
      expect(isWithinSummerGames(period, new Date('2026-08-23T23:59:00'))).toBe(true);
    });

    it('is false just after the period', () => {
      expect(isWithinSummerGames(period, new Date('2026-08-24T00:00:00'))).toBe(false);
    });

    it('is false when period is null', () => {
      expect(isWithinSummerGames(null, new Date('2026-07-15'))).toBe(false);
    });
  });

  describe('isoWeekDateRange / dateIsInIsoWeek', () => {
    it('returns the Mon–Sun range for a given ISO week', () => {
      // 2026 ISO week 29 → 2026-07-13 to 2026-07-19
      const r = isoWeekDateRange(2026, 29);
      expect(r.start).toBe('2026-07-13');
      expect(r.end).toBe('2026-07-19');
    });

    it('identifies a date inside a given ISO week', () => {
      expect(dateIsInIsoWeek('2026-07-15', 2026, 29)).toBe(true);
      expect(dateIsInIsoWeek('2026-07-13', 2026, 29)).toBe(true);
      expect(dateIsInIsoWeek('2026-07-19', 2026, 29)).toBe(true);
    });

    it('rejects a date outside a given ISO week', () => {
      expect(dateIsInIsoWeek('2026-07-12', 2026, 29)).toBe(false);
      expect(dateIsInIsoWeek('2026-07-20', 2026, 29)).toBe(false);
    });
  });

  describe('currentIsoYearWeek', () => {
    it('returns the correct ISO year and week for a given now', () => {
      const { isoYear, isoWeek } = currentIsoYearWeek(new Date('2026-07-15T10:00:00'));
      expect(isoYear).toBe(2026);
      expect(isoWeek).toBe(29);
    });
  });
});
