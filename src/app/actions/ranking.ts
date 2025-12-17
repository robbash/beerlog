import { prisma } from '@/lib/server/prisma';
import { getCurrentMonthStart } from '@/lib/utils/date';

export async function getCurrentRank(userId: number) {
  const currentMonthStart = getCurrentMonthStart();

  const top3 = await prisma.beerLog.groupBy({
    by: ['userId'],
    where: {
      date: { gte: currentMonthStart },
    },
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: {
        quantity: 'desc',
      },
    },
    take: 3,
  });

  const userRank = top3.findIndex((entry) => entry.userId === userId);

  return userRank !== -1 ? userRank + 1 : null;
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
    orderBy: {
      _sum: {
        quantity: 'desc',
      },
    },
    take: 10,
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

  // Create ranking entries with user names
  return rankingData.map((entry, index) => {
    const user = rankingUsers.find((u) => u.id === entry.userId);

    return {
      userId: entry.userId,
      userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
      quantity: entry._sum.quantity || 0,
      rank: index + 1,
    };
  });
}
