import { prisma } from '@/lib/server/prisma';
import { getCurrentMonthStart } from '@/lib/utils/date';
import { getSummerGamesState } from '@/lib/server/summer-games';
import { toDateString } from '@/lib/shared/summer-games';

export type RankingMode = 'monthly' | 'summerGames';

export interface RankingEntry {
  userId: number;
  userName: string;
  quantity: number;
  rank: number;
}

export interface RankingsResult {
  mode: RankingMode;
  entries: RankingEntry[];
}

async function computeRankingRows(mode: RankingMode) {
  if (mode === 'summerGames') {
    const state = await getSummerGamesState();
    if (!state.period) return [];

    const start = toDateString(state.period.startDate);
    const end = toDateString(state.period.endDate);

    // Count participations per user within the period via the joined session.
    const participations = await prisma.summerGamesParticipation.findMany({
      where: {
        session: {
          sessionDate: { gte: start, lte: end },
        },
      },
      select: { userId: true },
    });

    const counts = new Map<number, number>();
    for (const p of participations) {
      counts.set(p.userId, (counts.get(p.userId) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([userId, count]) => ({ userId, _sum: { quantity: count } }))
      .sort((a, b) => {
        const q = (b._sum.quantity ?? 0) - (a._sum.quantity ?? 0);
        return q !== 0 ? q : a.userId - b.userId;
      });
  }

  // Monthly drink ranking — exclude Summer Games rows so the two systems
  // don't cross-pollute.
  return prisma.beerLog.groupBy({
    by: ['userId'],
    where: {
      date: { gte: getCurrentMonthStart() },
      summerGamesParticipationId: null,
    },
    _sum: { quantity: true },
    orderBy: [{ _sum: { quantity: 'desc' } }, { userId: 'asc' }],
  });
}

async function resolveMode(): Promise<RankingMode> {
  const state = await getSummerGamesState();
  return state.isActive ? 'summerGames' : 'monthly';
}

export async function getCurrentRank(userId: number): Promise<number | null> {
  const mode = await resolveMode();
  const rankingData = await computeRankingRows(mode);
  if (rankingData.length === 0) return null;

  let currentRank = 1;
  const rankings = rankingData.map((entry, index) => {
    if (index > 0 && entry._sum.quantity !== rankingData[index - 1]._sum.quantity) {
      currentRank = index + 1;
    }
    return {
      userId: entry.userId,
      rank: currentRank,
      quantity: entry._sum.quantity || 0,
    };
  });

  const userRanking = rankings.find((r) => r.userId === userId);
  if (!userRanking) return null;
  return userRanking.rank <= 3 ? userRanking.rank : null;
}

export async function getRankings(): Promise<RankingsResult> {
  const mode = await resolveMode();
  const rankingData = await computeRankingRows(mode);

  if (rankingData.length === 0) {
    return { mode, entries: [] };
  }

  const rankingUserIds = rankingData.map((entry) => entry.userId);
  const rankingUsers = await prisma.user.findMany({
    where: { id: { in: rankingUserIds } },
    select: { id: true, firstName: true, lastName: true },
  });

  let currentRank = 1;
  const rankings: RankingEntry[] = rankingData.map((entry, index) => {
    if (index > 0 && entry._sum.quantity !== rankingData[index - 1]._sum.quantity) {
      currentRank = index + 1;
    }

    const user = rankingUsers.find((u) => u.id === entry.userId);

    return {
      userId: entry.userId,
      userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
      quantity: entry._sum.quantity || 0,
      rank: currentRank,
    };
  });

  return { mode, entries: rankings.slice(0, 10) };
}
