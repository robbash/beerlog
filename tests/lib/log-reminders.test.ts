import { addHours, format, subDays, subMonths } from 'date-fns';
import { createBeerLog, createUser } from '../utils/factories';
import { resetDatabase } from '../utils/helpers';
import { dateFormat } from '@/lib/constants';
import { prisma } from '@/lib/server/prisma';
import {
  createLogReminder,
  getReminderCandidates,
  markNoDrinks,
  runDueLogReminders,
} from '@/lib/server/log-reminders';
import * as email from '@/lib/server/email';

vi.mock('@/lib/server/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

// next-intl's getTranslations needs a request context, which node tests don't
// have — the reminder body itself is covered by the translation files.
vi.mock('@/lib/server/email-templates', () => ({
  getLogReminderEmail: vi.fn().mockResolvedValue({ subject: 'subject', body: 'body' }),
}));

const eventDate = '2026-03-14';

function sentTo() {
  return vi.mocked(email.sendEmail).mock.calls.map((call) => call[0]);
}

describe('getReminderCandidates', () => {
  afterEach(async () => {
    await resetDatabase();
    vi.clearAllMocks();
  });

  it('excludes users who already logged for that date', async () => {
    const logged = await createUser({ firstName: 'Logged' });
    const missing = await createUser({ firstName: 'Missing' });

    await createBeerLog({ userId: logged.id, date: eventDate });

    const candidates = await getReminderCandidates(eventDate);

    expect(candidates.map((c) => c.userId)).toEqual([missing.id]);
  });

  it('excludes unapproved users', async () => {
    const user = await createUser();
    await prisma.user.update({ where: { id: user.id }, data: { approved: false } });

    expect(await getReminderCandidates(eventDate)).toEqual([]);
  });

  it('ranks by number of logs in the last three months', async () => {
    const now = new Date();
    const rare = await createUser({ firstName: 'Rare' });
    const regular = await createUser({ firstName: 'Regular' });

    await createBeerLog({ userId: rare.id, date: format(subDays(now, 5), dateFormat) });
    await createBeerLog({ userId: regular.id, date: format(subDays(now, 3), dateFormat) });
    await createBeerLog({ userId: regular.id, date: format(subDays(now, 10), dateFormat) });

    // Too old to count towards the ranking.
    await createBeerLog({ userId: rare.id, date: format(subMonths(now, 8), dateFormat) });

    const candidates = await getReminderCandidates(eventDate, now);

    expect(candidates.map((c) => [c.firstName, c.recentLogCount])).toEqual([
      ['Regular', 2],
      ['Rare', 1],
    ]);
  });
});

describe('createLogReminder', () => {
  afterEach(async () => {
    await resetDatabase();
    vi.clearAllMocks();
  });

  it('creates one target per user with a unique token', async () => {
    const actor = await createUser({ role: 'ADMIN' });
    const a = await createUser();
    const b = await createUser();

    const { reminder, addedCount } = await createLogReminder({
      date: eventDate,
      label: 'Party',
      userIds: [a.id, b.id],
      actorId: actor.id,
    });

    expect(addedCount).toBe(2);
    expect(reminder.label).toBe('Party');

    const targets = await prisma.logReminderTarget.findMany({
      where: { reminderId: reminder.id },
    });

    expect(targets).toHaveLength(2);
    expect(new Set(targets.map((t) => t.token)).size).toBe(2);
    expect(targets.every((t) => /^[a-f0-9]{64}$/.test(t.token))).toBe(true);
  });

  it('keeps the history of existing targets when adding more people', async () => {
    const actor = await createUser({ role: 'ADMIN' });
    const first = await createUser();
    const second = await createUser();

    const { reminder } = await createLogReminder({
      date: eventDate,
      userIds: [first.id],
      actorId: actor.id,
    });

    await prisma.logReminderTarget.updateMany({
      where: { reminderId: reminder.id },
      data: { sentCount: 3 },
    });

    const { addedCount } = await createLogReminder({
      date: eventDate,
      userIds: [first.id, second.id],
      actorId: actor.id,
    });

    expect(addedCount).toBe(1);

    const existing = await prisma.logReminderTarget.findFirst({
      where: { reminderId: reminder.id, userId: first.id },
    });

    expect(existing?.sentCount).toBe(3);
  });

  it('reactivates a stopped campaign for the same date', async () => {
    const actor = await createUser({ role: 'ADMIN' });
    const user = await createUser();

    const { reminder } = await createLogReminder({
      date: eventDate,
      userIds: [user.id],
      actorId: actor.id,
    });
    await prisma.logReminder.update({ where: { id: reminder.id }, data: { active: false } });

    const second = await createLogReminder({
      date: eventDate,
      userIds: [user.id],
      actorId: actor.id,
    });

    expect(second.reminder.id).toBe(reminder.id);
    expect(second.reminder.active).toBe(true);
  });
});

describe('runDueLogReminders', () => {
  afterEach(async () => {
    await resetDatabase();
    vi.clearAllMocks();
  });

  async function startCampaign(userIds: number[], now = new Date()) {
    const actor = await createUser({ role: 'ADMIN' });
    return createLogReminder({ date: eventDate, userIds, actorId: actor.id, now });
  }

  it('sends a nag to every due target', async () => {
    const a = await createUser({ email: 'a@example.com' });
    const b = await createUser({ email: 'b@example.com' });
    await startCampaign([a.id, b.id]);

    const result = await runDueLogReminders();

    expect(result.sent).toBe(2);
    expect(sentTo().sort()).toEqual(['a@example.com', 'b@example.com']);
  });

  it('does not send again before the interval has elapsed', async () => {
    const user = await createUser();
    await startCampaign([user.id]);

    await runDueLogReminders();
    const second = await runDueLogReminders();

    expect(second.sent).toBe(0);
    expect(email.sendEmail).toHaveBeenCalledTimes(1);
  });

  it('sends again once the interval has elapsed', async () => {
    const user = await createUser();
    await startCampaign([user.id]);

    const now = new Date();
    await runDueLogReminders(now);
    const second = await runDueLogReminders(addHours(now, 5));

    expect(second.sent).toBe(1);
    expect(email.sendEmail).toHaveBeenCalledTimes(2);
  });

  it('resolves a target once a log exists for the event date', async () => {
    const user = await createUser();
    await startCampaign([user.id]);

    await createBeerLog({ userId: user.id, date: eventDate });

    const result = await runDueLogReminders();

    expect(result.resolved).toBe(1);
    expect(result.sent).toBe(0);
    expect(email.sendEmail).not.toHaveBeenCalled();

    const target = await prisma.logReminderTarget.findFirst({ where: { userId: user.id } });
    expect(target?.resolvedAt).not.toBeNull();
  });

  it('closes the campaign when every target is done', async () => {
    const user = await createUser();
    const { reminder } = await startCampaign([user.id]);

    await createBeerLog({ userId: user.id, date: eventDate });

    const result = await runDueLogReminders();

    expect(result.campaignsClosed).toBe(1);

    const updated = await prisma.logReminder.findUnique({ where: { id: reminder.id } });
    expect(updated?.active).toBe(false);
  });

  it('gives up after the configured maximum', async () => {
    vi.stubEnv('LOG_REMINDER_MAX_COUNT', '2');

    const user = await createUser();
    await startCampaign([user.id]);

    const now = new Date();
    await runDueLogReminders(now);
    await runDueLogReminders(addHours(now, 5));
    const third = await runDueLogReminders(addHours(now, 10));

    expect(third.sent).toBe(0);
    expect(email.sendEmail).toHaveBeenCalledTimes(2);

    vi.unstubAllEnvs();
  });

  it('skips targets that declared they had no drinks', async () => {
    const user = await createUser();
    const { reminder } = await startCampaign([user.id]);

    const target = await prisma.logReminderTarget.findFirstOrThrow({
      where: { reminderId: reminder.id },
    });

    await markNoDrinks(target.token);

    const result = await runDueLogReminders();

    expect(result.sent).toBe(0);
    expect(email.sendEmail).not.toHaveBeenCalled();
  });

  it('ignores stopped campaigns', async () => {
    const user = await createUser();
    const { reminder } = await startCampaign([user.id]);

    await prisma.logReminder.update({ where: { id: reminder.id }, data: { active: false } });

    expect((await runDueLogReminders()).sent).toBe(0);
  });

  it('still reschedules when a send fails', async () => {
    vi.mocked(email.sendEmail).mockRejectedValueOnce(new Error('smtp down'));

    const user = await createUser();
    const { reminder } = await startCampaign([user.id]);

    const now = new Date();
    const result = await runDueLogReminders(now);

    expect(result.failed).toBe(1);
    expect(result.sent).toBe(0);

    const target = await prisma.logReminderTarget.findFirstOrThrow({
      where: { reminderId: reminder.id },
    });

    expect(target.sentCount).toBe(1);
    expect(target.nextRunAt.getTime()).toBe(addHours(now, 4).getTime());
  });
});

describe('markNoDrinks', () => {
  afterEach(async () => {
    await resetDatabase();
    vi.clearAllMocks();
  });

  it('marks the target and reports the event date', async () => {
    const actor = await createUser({ role: 'ADMIN' });
    const user = await createUser();

    const { reminder } = await createLogReminder({
      date: eventDate,
      userIds: [user.id],
      actorId: actor.id,
    });

    const target = await prisma.logReminderTarget.findFirstOrThrow({
      where: { reminderId: reminder.id },
    });

    expect(await markNoDrinks(target.token)).toEqual({ ok: true, date: eventDate });

    const updated = await prisma.logReminderTarget.findUnique({ where: { id: target.id } });
    expect(updated?.noDrinksAt).not.toBeNull();
  });

  it('is idempotent', async () => {
    const actor = await createUser({ role: 'ADMIN' });
    const user = await createUser();

    const { reminder } = await createLogReminder({
      date: eventDate,
      userIds: [user.id],
      actorId: actor.id,
    });

    const target = await prisma.logReminderTarget.findFirstOrThrow({
      where: { reminderId: reminder.id },
    });

    const first = await markNoDrinks(target.token, new Date(2026, 0, 1));
    const second = await markNoDrinks(target.token, new Date(2026, 0, 2));

    expect(first.ok && second.ok).toBe(true);

    const updated = await prisma.logReminderTarget.findUnique({ where: { id: target.id } });
    expect(updated?.noDrinksAt).toEqual(new Date(2026, 0, 1));
  });

  it('rejects an unknown token', async () => {
    expect(await markNoDrinks('f'.repeat(64))).toEqual({ ok: false });
  });
});
