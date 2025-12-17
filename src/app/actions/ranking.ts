import { prisma } from '@/lib/server/prisma';
import { getCurrentMonthStart } from '@/lib/utils/date';

export async function getCurrentRank(userId: number) {
  const currentMonthStart = getCurrentMonthStart();

  const rankingData = await prisma.beerLog.groupBy({
    by: ['userId'],
    where: {
      date: { gte: currentMonthStart },
    },
    _sum: {
      quantity: true,
    },
    orderBy: [
      {
        _sum: {
          quantity: 'desc',
        },
      },
      {
        userId: 'asc', // Stable secondary sort
      },
    ],
  });

  if (rankingData.length === 0) {
    return null;
  }

  // Calculate rank with proper tie handling
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

  // Find user's rank (top 3 only get medal)
  const userRanking = rankings.find((r) => r.userId === userId);
  if (!userRanking) return null;

  // Only return rank if in top 3
  return userRanking.rank <= 3 ? userRanking.rank : null;
}

export async function getRankings() {
  const currentMonthStart = getCurrentMonthStart();

  const rankingData = await prisma.beerLog.groupBy({
    by: ['userId'],
    where: {
      date: { gte: currentMonthStart },
    },
    _sum: {
      quantity: true,
    },
    orderBy: [
      {
        _sum: {
          quantity: 'desc',
        },
      },
      {
        userId: 'asc', // Stable secondary sort
      },
    ],
  });

  if (rankingData.length === 0) {
    return [];
  }

  // Fetch user details for the ranking
  const rankingUserIds = rankingData.map((entry) => entry.userId);
  const rankingUsers = await prisma.user.findMany({
    where: { id: { in: rankingUserIds } },
    select: { id: true, firstName: true, lastName: true },
  });

  // Calculate rank with proper tie handling (competition ranking)
  let currentRank = 1;
  const rankings = rankingData.map((entry, index) => {
    // When quantity changes, update rank to current position + 1
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

  // Return top 10 entries
  return rankings.slice(0, 10);
}
