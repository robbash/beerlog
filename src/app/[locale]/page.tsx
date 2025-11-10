import { DashboardStats } from '@/components/dashboard-stats';
import { DashboardTable } from '@/components/dashboard-table';
import { DashboardToggle } from '@/components/dashboard-toggle';
import { DashboardUserFilter } from '@/components/dashboard-user-filter';
import { DashboardLoadMore } from '@/components/dashboard-load-more';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/auth';
import { dateFormat, logFormNewForUser, Roles } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { getUserBalanceDetails } from '@/lib/payments';
import { format, startOfMonth, subMonths } from 'date-fns';
import { Plus } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const t = await getTranslations('pages.dashboard');
  const locale = await getLocale();
  const session = await auth();

  if (!session) {
    return <>{t('loginHint')}</>;
  }

  const params = await searchParams;
  const allowShowAll = session.user.role !== Roles.User;
  const isShowAll = session.user.role !== Roles.User && 'show-all' in params;
  const currentMonthStart = format(startOfMonth(new Date()), dateFormat);

  // Get filter parameters
  const filterUserId = params.userId ? +params.userId : null;
  const limit = params.limit ? +params.limit : isShowAll ? 50 : 10;

  // Determine which user to show data for
  let userIdFilter: { userId?: number } = {};
  if (isShowAll && filterUserId) {
    // Manager/admin viewing specific user
    userIdFilter = { userId: filterUserId };
  } else if (!isShowAll) {
    // Regular user viewing own data
    userIdFilter = { userId: +session.user.id };
  }
  // If isShowAll && !filterUserId, show all users (empty filter)

  const logsTotal = await prisma.beerLog.findMany({
    where: { ...userIdFilter },
    include: {
      paymentAllocations: true,
    },
    orderBy: { date: 'desc' },
    take: limit + 1, // Fetch one extra to check if there are more
  });

  const hasMore = logsTotal.length > limit;
  const logs = hasMore ? logsTotal.slice(0, limit) : logsTotal;
  const quantityTotal = (
    await prisma.beerLog.aggregate({
      where: { ...userIdFilter },
      orderBy: { date: 'desc' },
      _sum: { quantity: true },
    })
  )._sum.quantity!;
  const quantityPrevMonth =
    (
      await prisma.beerLog.aggregate({
        where: {
          ...userIdFilter,
          date: {
            gte: format(subMonths(startOfMonth(new Date()), 1), dateFormat),
            lt: currentMonthStart,
          },
        },
        _sum: { quantity: true },
      })
    )._sum.quantity || 0;
  const quantityThisMonth = (
    await prisma.beerLog.aggregate({
      where: { ...userIdFilter, date: { gte: format(startOfMonth(new Date()), dateFormat) } },
      _sum: { quantity: true },
    })
  )._sum.quantity!;

  let trendThisMonth = ((quantityThisMonth - quantityPrevMonth) / (quantityPrevMonth || 0)) * 100;
  if (trendThisMonth === Infinity) {
    trendThisMonth = 100;
  }

  const users = isShowAll
    ? await prisma.user.findMany({
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      })
    : undefined;

  // Get user balance (for the filtered user or current user)
  const balanceUserId = filterUserId || +session.user.id;
  const userBalance = await getUserBalanceDetails(balanceUserId);

  // Get current month leaderboard
  const leaderboard = await prisma.beerLog.groupBy({
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

  // Find current user's rank in this month's leaderboard
  const userRank = leaderboard.findIndex((entry) => entry.userId === balanceUserId);
  const currentUserRank = userRank !== -1 ? userRank + 1 : null;

  return (
    <div>
      <div className="-mx-4 flex flex-col gap-4 py-4 md:-mx-6 md:gap-6 md:py-6">
        <DashboardStats
          beersTotal={quantityTotal}
          beersPrevMonth={quantityPrevMonth}
          beersThisMonth={quantityThisMonth}
          trendThisMonth={trendThisMonth}
          userBalance={userBalance}
          currentUserRank={currentUserRank}
        />
      </div>

      {allowShowAll && (
        <>
          <div className="mb-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <DashboardToggle showAll={isShowAll} />

              {isShowAll && (
                <Button variant={'outline'} asChild>
                  <Link href={`/${locale}/log/${logFormNewForUser}`}>
                    <Plus /> {t('logForOthers')}
                  </Link>
                </Button>
              )}
            </div>

            {isShowAll && users && <DashboardUserFilter users={users} />}
          </div>
        </>
      )}

      <DashboardTable users={users} logs={logs} />

      <DashboardLoadMore hasMore={hasMore} currentLimit={limit} />
    </div>
  );
}
