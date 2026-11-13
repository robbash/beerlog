import crypto from 'crypto';
import { addHours, format, subMonths } from 'date-fns';
import { prisma } from './prisma';
import { sendEmail } from './email';
import { getLogReminderEmail } from './email-templates';
import { dateFormat } from '@/lib/constants';
import { nextDayAtHour } from '@/lib/shared/timezone';

export const LogReminderDefaults = {
  intervalHours: 4,
  maxCount: 6,
  /** Hour of the day the first reminder may go out, read in `appTimeZone`. */
  firstHour: 8,
  /** How far back `getReminderCandidates` looks when ranking by attendance. */
  rankingMonths: 3,
} as const;

function envInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Interval between two nags, centrally configured via env. */
export function getLogReminderIntervalHours(): number {
  return envInt(process.env.LOG_REMINDER_INTERVAL_HOURS, LogReminderDefaults.intervalHours);
}

/** Hard cap on nags per person, so a campaign always ends by itself. */
export function getLogReminderMaxCount(): number {
  return envInt(process.env.LOG_REMINDER_MAX_COUNT, LogReminderDefaults.maxCount);
}

/**
 * Hour of the day the first reminder may be sent. Unlike the other settings
 * this one may legitimately be 0 (midnight), so it is parsed separately.
 */
export function getLogReminderFirstHour(): number {
  const raw = process.env.LOG_REMINDER_FIRST_HOUR;
  if (!raw) return LogReminderDefaults.firstHour;

  const hour = parseInt(raw, 10);

  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : LogReminderDefaults.firstHour;
}

/**
 * When the first reminder for `date` may go out.
 *
 * Campaigns are usually planned during the event itself, but people log their
 * drinks afterwards, so nagging them on the spot is pointless. The first
 * reminder therefore waits until the morning after the event. A campaign
 * started later than that is already overdue and goes out on the next tick.
 */
export function getFirstReminderRunAt(date: string, now: Date = new Date()): Date {
  const earliest = nextDayAtHour(date, getLogReminderFirstHour());

  return earliest > now ? earliest : now;
}

export interface ReminderCandidate {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  recentLogCount: number;
}

/**
 * Everyone who could plausibly owe a log for `date`: approved users without a
 * BeerLog on that date, most frequent attendee first.
 *
 * The ranking is a convenience for the admin picking attendees — the people who
 * show up every time are the ones most likely to have been there again.
 */
export async function getReminderCandidates(
  date: string,
  now: Date = new Date(),
): Promise<ReminderCandidate[]> {
  const since = format(subMonths(now, LogReminderDefaults.rankingMonths), dateFormat);

  const [users, alreadyLogged, recentLogs] = await Promise.all([
    prisma.user.findMany({
      where: { approved: true },
      select: { id: true, firstName: true, lastName: true, email: true },
    }),
    prisma.beerLog.findMany({ where: { date }, select: { userId: true } }),
    prisma.beerLog.findMany({ where: { date: { gte: since } }, select: { userId: true } }),
  ]);

  const loggedUserIds = new Set(alreadyLogged.map((log) => log.userId));

  const counts = new Map<number, number>();
  for (const log of recentLogs) {
    counts.set(log.userId, (counts.get(log.userId) ?? 0) + 1);
  }

  return users
    .filter((user) => !loggedUserIds.has(user.id))
    .map((user) => ({
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      recentLogCount: counts.get(user.id) ?? 0,
    }))
    .sort(
      (a, b) =>
        b.recentLogCount - a.recentLogCount ||
        a.firstName.localeCompare(b.firstName) ||
        a.lastName.localeCompare(b.lastName),
    );
}

/**
 * Start (or extend) the campaign for an event date. Re-running with more users
 * adds targets; existing targets keep their send history so nobody gets reset
 * back to zero and nagged all over again.
 */
export async function createLogReminder({
  date,
  label,
  userIds,
  actorId,
  now = new Date(),
}: {
  date: string;
  label?: string | null;
  userIds: number[];
  actorId: number;
  now?: Date;
}) {
  const reminder = await prisma.logReminder.upsert({
    where: { date },
    create: { date, label: label ?? null, createdById: actorId, active: true },
    update: { label: label ?? null, active: true },
  });

  const existing = await prisma.logReminderTarget.findMany({
    where: { reminderId: reminder.id },
    select: { userId: true },
  });
  const existingUserIds = new Set(existing.map((target) => target.userId));

  const added = userIds.filter((userId) => !existingUserIds.has(userId));

  // Not before the morning after the event, so nobody is nagged while still
  // there. Already past for an event planned after the fact.
  const nextRunAt = getFirstReminderRunAt(date, now);

  for (const userId of added) {
    await prisma.logReminderTarget.create({
      data: {
        reminderId: reminder.id,
        userId,
        token: crypto.randomBytes(32).toString('hex'),
        nextRunAt,
      },
    });
  }

  return { reminder, addedCount: added.length };
}

export async function stopLogReminder(id: number) {
  return prisma.logReminder.update({ where: { id }, data: { active: false } });
}

export async function deleteLogReminder(id: number) {
  return prisma.logReminder.delete({ where: { id } });
}

export async function getLogReminders() {
  return prisma.logReminder.findMany({
    orderBy: { date: 'desc' },
    include: {
      targets: {
        orderBy: { id: 'asc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
  });
}

/** Read-only token lookup, used to render the "I didn't drink" page. */
export async function findLogReminderTargetByToken(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;

  return prisma.logReminderTarget.findUnique({
    where: { token },
    include: { reminder: true },
  });
}

/**
 * Resolve a target via the tokenised "I didn't drink" link. Idempotent, so a
 * second click (or a mail client prefetching the page) is harmless.
 */
export async function markNoDrinks(token: string, now: Date = new Date()) {
  const target = await prisma.logReminderTarget.findUnique({
    where: { token },
    include: { reminder: true },
  });

  if (!target) return { ok: false as const };

  if (!target.noDrinksAt) {
    await prisma.logReminderTarget.update({
      where: { id: target.id },
      data: { noDrinksAt: now },
    });
  }

  return { ok: true as const, date: target.reminder.date };
}

async function logSystemEvent(level: string, message: string, meta?: object) {
  try {
    await prisma.systemLog.create({ data: { level, message, meta: meta ?? undefined } });
  } catch {
    // Never let bookkeeping break the send loop.
  }
}

export interface RunDueResult {
  sent: number;
  failed: number;
  resolved: number;
  campaignsClosed: number;
}

/**
 * Send every nag that is currently due and reschedule it.
 *
 * Safe to call concurrently: each target is claimed with a conditional update
 * on `nextRunAt` before the mail goes out, so a doubled cron trigger cannot
 * send twice.
 */
export async function runDueLogReminders(now: Date = new Date()): Promise<RunDueResult> {
  const intervalHours = getLogReminderIntervalHours();
  const maxCount = getLogReminderMaxCount();

  const result: RunDueResult = { sent: 0, failed: 0, resolved: 0, campaignsClosed: 0 };

  const reminders = await prisma.logReminder.findMany({
    where: { active: true },
    include: {
      targets: {
        where: { resolvedAt: null, noDrinksAt: null },
        include: { user: true },
      },
    },
  });

  for (const reminder of reminders) {
    // Anyone who logged in the meantime is done, no matter who entered it.
    const logs = await prisma.beerLog.findMany({
      where: {
        date: reminder.date,
        userId: { in: reminder.targets.map((target) => target.userId) },
      },
      select: { userId: true },
    });
    const loggedUserIds = new Set(logs.map((log) => log.userId));

    const pending = [];

    for (const target of reminder.targets) {
      if (loggedUserIds.has(target.userId)) {
        await prisma.logReminderTarget.update({
          where: { id: target.id },
          data: { resolvedAt: now },
        });
        result.resolved++;
        continue;
      }
      pending.push(target);
    }

    for (const target of pending) {
      if (target.sentCount >= maxCount) continue;
      if (target.nextRunAt > now) continue;

      // Claim the slot first; if someone else already moved nextRunAt we skip.
      const claim = await prisma.logReminderTarget.updateMany({
        where: { id: target.id, nextRunAt: { lte: now } },
        data: {
          nextRunAt: addHours(now, intervalHours),
          lastSentAt: now,
          sentCount: { increment: 1 },
        },
      });

      if (claim.count !== 1) continue;

      const locale = target.user.locale === 'de' ? 'de' : 'en';
      const baseUrl = process.env.APP_BASE_URL ?? '';

      try {
        const email = await getLogReminderEmail({
          firstName: target.user.firstName,
          eventDate: reminder.date,
          eventLabel: reminder.label,
          logLink: `${baseUrl}/${locale}/log/${reminder.date}`,
          noDrinksLink: `${baseUrl}/${locale}/no-drinks/${target.token}`,
          locale,
        });

        await sendEmail(target.user.email, email.subject, email.body);
        result.sent++;
      } catch (error) {
        result.failed++;
        console.error('[runDueLogReminders] send failed:', error);
        await logSystemEvent('error', 'log reminder send failed', {
          targetId: target.id,
          userId: target.userId,
          date: reminder.date,
          error: (error as Error).message,
        });
      }
    }

    // Close the campaign once nobody is left to nag.
    const outstanding = await prisma.logReminderTarget.count({
      where: {
        reminderId: reminder.id,
        resolvedAt: null,
        noDrinksAt: null,
        sentCount: { lt: maxCount },
      },
    });

    if (outstanding === 0) {
      await prisma.logReminder.update({
        where: { id: reminder.id },
        data: { active: false },
      });
      result.campaignsClosed++;
    }
  }

  if (result.sent || result.failed || result.resolved) {
    await logSystemEvent('info', 'log reminder run', { ...result });
  }

  return result;
}
