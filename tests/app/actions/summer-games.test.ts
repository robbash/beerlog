import { format, addDays } from 'date-fns';
import { createUser } from '../../utils/factories';
import { resetDatabase } from '../../utils/helpers';
import { logParticipation } from '@/app/actions/summer-games';
import { getRankings } from '@/app/actions/ranking';
import * as auth from '@/lib/server/auth';
import { dateFormat, Roles } from '@/lib/constants';
import { prisma } from '@/lib/server/prisma';
import { SettingKeys } from '@/lib/server/settings';
import {
  currentIsoYearWeek,
  isoWeekDateRange,
} from '@/lib/shared/summer-games';

vi.mock('@/lib/server/auth', () => ({
  auth: vi.fn(),
}));

const today = format(new Date(), dateFormat);
const { isoYear, isoWeek } = currentIsoYearWeek();
const { start: weekStart } = isoWeekDateRange(isoYear, isoWeek);

async function enableSummerGamesNow(feeCents = 500) {
  // Set start date to today's ISO week Monday
  await prisma.setting.upsert({
    where: { key: SettingKeys.SummerGamesStartDate },
    update: { value: weekStart },
    create: { key: SettingKeys.SummerGamesStartDate, value: weekStart },
  });
  await prisma.setting.upsert({
    where: { key: SettingKeys.SummerGamesDurationWeeks },
    update: { value: '6' },
    create: { key: SettingKeys.SummerGamesDurationWeeks, value: '6' },
  });
  await prisma.setting.upsert({
    where: { key: SettingKeys.SummerGamesFeeCents },
    update: { value: String(feeCents) },
    create: { key: SettingKeys.SummerGamesFeeCents, value: String(feeCents) },
  });
}

async function disableSummerGames() {
  await prisma.setting.deleteMany({ where: { key: SettingKeys.SummerGamesStartDate } });
}

function mockAuth(user: { id: number; role: (typeof Roles)[keyof typeof Roles] }) {
  vi.spyOn(auth, 'auth').mockResolvedValue({
    user: { id: String(user.id), role: user.role },
  } as any);
}

describe('logParticipation action', () => {
  afterEach(async () => {
    await resetDatabase();
    vi.restoreAllMocks();
  });

  it('rejects unauthenticated requests', async () => {
    vi.spyOn(auth, 'auth').mockResolvedValueOnce(null as any);
    const result = await logParticipation({});
    expect(result).toEqual({ ok: false, errors: { '401': ['not authorized'] } });
  });

  it('rejects when Summer Games are not active', async () => {
    const user = await createUser();
    await disableSummerGames();
    mockAuth({ id: user.id, role: Roles.User });

    const result = await logParticipation({});
    expect(result.ok).toBe(false);
    expect(result.formError).toBe('notActive');
  });

  it('creates a session + participation + shadow BeerLog for the first user', async () => {
    const user = await createUser();
    await enableSummerGamesNow(500);
    mockAuth({ id: user.id, role: Roles.User });

    const result = await logParticipation({ sessionDate: today });
    expect(result.ok).toBe(true);

    const session = await prisma.summerGamesSession.findFirst();
    expect(session).not.toBeNull();
    expect(session!.sessionDate).toBe(today);

    const parts = await prisma.summerGamesParticipation.findMany();
    expect(parts).toHaveLength(1);
    expect(parts[0].userId).toBe(user.id);

    const logs = await prisma.beerLog.findMany();
    expect(logs).toHaveLength(1);
    expect(logs[0].summerGamesParticipationId).toBe(parts[0].id);
    expect(logs[0].costCentsAtTime).toBe(500);
    expect(logs[0].quantity).toBe(1);
    expect(logs[0].date).toBe(today);
  });

  it('locks session date after the first participant', async () => {
    const first = await createUser();
    const second = await createUser();
    await enableSummerGamesNow();

    mockAuth({ id: first.id, role: Roles.User });
    await logParticipation({ sessionDate: weekStart });

    // Second user tries a different date within the same ISO week
    mockAuth({ id: second.id, role: Roles.User });
    const differentDate = format(addDays(new Date(weekStart), 2), dateFormat);
    const result = await logParticipation({ sessionDate: differentDate });
    expect(result.ok).toBe(true);

    const session = await prisma.summerGamesSession.findFirst();
    // Locked to the first user's date
    expect(session!.sessionDate).toBe(weekStart);

    const logs = await prisma.beerLog.findMany({ orderBy: { id: 'asc' } });
    expect(logs).toHaveLength(2);
    // Both shadow BeerLogs use the locked session date
    expect(logs[1].date).toBe(weekStart);
  });

  it('is idempotent when the same user logs twice in the same week', async () => {
    const user = await createUser();
    await enableSummerGamesNow();
    mockAuth({ id: user.id, role: Roles.User });

    await logParticipation({ sessionDate: today });
    const second = await logParticipation({ sessionDate: today });

    expect(second.ok).toBe(true);
    const parts = await prisma.summerGamesParticipation.findMany();
    expect(parts).toHaveLength(1);
    const logs = await prisma.beerLog.findMany();
    expect(logs).toHaveLength(1);
  });

  it('rejects a session date outside the ISO week', async () => {
    const user = await createUser();
    await enableSummerGamesNow();
    mockAuth({ id: user.id, role: Roles.User });

    // A day just before the ISO week
    const outside = format(addDays(new Date(weekStart), -1), dateFormat);
    const result = await logParticipation({ sessionDate: outside });
    expect(result.ok).toBe(false);
    expect(result.errors?.sessionDate).toEqual(['notInWeek']);
  });

  it('forbids regular users from logging for other users', async () => {
    const actor = await createUser({ role: 'USER' });
    const other = await createUser();
    await enableSummerGamesNow();
    mockAuth({ id: actor.id, role: Roles.User });

    const result = await logParticipation({ userId: other.id, sessionDate: today });
    expect(result.ok).toBe(false);
    expect(result.formError).toBe('notAuthorised');
  });

  it('allows managers to log for other users', async () => {
    const manager = await createUser({ role: 'MANAGER' });
    const other = await createUser();
    await enableSummerGamesNow();
    mockAuth({ id: manager.id, role: Roles.Manager });

    const result = await logParticipation({ userId: other.id, sessionDate: today });
    expect(result.ok).toBe(true);

    const parts = await prisma.summerGamesParticipation.findMany();
    expect(parts[0].userId).toBe(other.id);
    expect(parts[0].createdById).toBe(manager.id);
  });
});

describe('getRankings during Summer Games', () => {
  afterEach(async () => {
    await resetDatabase();
    vi.restoreAllMocks();
  });

  it('switches to participation counts when Summer Games are active', async () => {
    const alice = await createUser({ firstName: 'Alice' });
    const bob = await createUser({ firstName: 'Bob' });

    await enableSummerGamesNow();

    // Alice: 1 participation, Bob: also 1
    mockAuth({ id: alice.id, role: Roles.User });
    await logParticipation({ sessionDate: today });
    mockAuth({ id: bob.id, role: Roles.User });
    await logParticipation({ sessionDate: today });

    // Bob also drinks a load of beers — must NOT count during summer games
    await prisma.beerLog.create({
      data: {
        userId: bob.id,
        quantity: 99,
        date: today,
        costCentsAtTime: 9900,
      },
    });

    const result = await getRankings();
    expect(result.mode).toBe('summerGames');
    expect(result.entries).toHaveLength(2);
    // Both tied at 1
    expect(result.entries.every((e) => e.quantity === 1)).toBe(true);
  });

  it('falls back to monthly drink counts when Summer Games are not active', async () => {
    const alice = await createUser({ firstName: 'Alice' });
    await disableSummerGames();

    await prisma.beerLog.create({
      data: { userId: alice.id, quantity: 3, date: today, costCentsAtTime: 300 },
    });

    const result = await getRankings();
    expect(result.mode).toBe('monthly');
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].quantity).toBe(3);
  });
});
