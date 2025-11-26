import { DashboardStats } from '@/components/dashboard-stats';
import { DashboardTable } from '@/components/dashboard-table';
import { DashboardToggle, ViewType } from '@/components/dashboard-toggle';
import { DashboardUserFilter } from '@/components/dashboard-user-filter';
import { DashboardLoadMore } from '@/components/dashboard-load-more';
import { DashboardRanking } from '@/components/dashboard-ranking';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/auth';
import { dateFormat, logFormNewForUser, Roles } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { getUserBalanceDetails } from '@/lib/payments';
import { format, startOfMonth, subMonths } from 'date-fns';
import { Plus } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { getCurrentMonthStart } from '@/lib/utils/date';
import { getCurrentRank, getRankings } from '../actions/ranking';

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
  const currentMonthStart = getCurrentMonthStart();

  let selectedView: 'ranking' | 'all' | 'own' = 'ranking';
  if (session.user.role !== Roles.User && 'show-all' in params) {
    selectedView = 'all';
  }
  if ('show-own' in params) {
    selectedView = 'own';
  }

  // Get filter parameters
  const filterUserId = params.userId ? +params.userId : null;
  const limit = params.limit ? +params.limit : selectedView === 'all' ? 50 : 10;

  // Determine which user to show data for
  let userIdFilter: { userId?: number } = {};
  if (selectedView === 'all' && filterUserId) {
    // Manager/admin viewing specific user
    userIdFilter = { userId: filterUserId };
  } else if (selectedView === 'own') {
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

  const users =
    selectedView === 'all'
      ? await prisma.user.findMany({
          orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        })
      : undefined;

  // Get user balance (for the filtered user or current user)
  const balanceUserId = filterUserId || +session.user.id;
  const userBalance = await getUserBalanceDetails(filterUserId || +session.user.id);

  const currentUserRank = await getCurrentRank(balanceUserId);
  const availableViews = ['own', 'ranking'] as ViewType[];
  if (allowShowAll) {
    availableViews.push('all');
  }

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

      <div className="mb-4 flex flex-col gap-4">
        <DashboardToggle current={selectedView} available={availableViews} />
        <div className="flex items-center justify-between">
          {selectedView === 'all' && (
            <>
              <DashboardUserFilter users={users!} />

              <Button variant={'outline'} asChild>
                <Link href={`/${locale}/log/${logFormNewForUser}`}>
                  <Plus /> <span className="hidden sm:inline">{t('logForOthers')}</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {selectedView === 'ranking' && (
        <div className="mb-6">
          <DashboardRanking
            rankings={await getRankings()}
            currentUserId={balanceUserId}
            isAdminOrManager={allowShowAll}
          />
        </div>
      )}

      {selectedView !== 'ranking' && (
        <>
          <DashboardTable users={users} logs={logs} />

          <DashboardLoadMore hasMore={hasMore} currentLimit={limit} />
        </>
      )}
    </div>
  );
}
