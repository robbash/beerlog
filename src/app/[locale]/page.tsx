import { DashboardStats } from '@/components/dashboard-stats';
import { DashboardTable } from '@/components/dashboard-table';
import { DashboardToggle } from '@/components/dashboard-toggle';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/auth';
import { dateFormat, logFormNewForUser, Roles } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
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

  const allowShowAll = session.user.role !== Roles.User;
  const isShowAll = session.user.role !== Roles.User && 'show-all' in (await searchParams);

  const userIdFilter = isShowAll ? {} : { userId: +session.user.id };

  const logsTotal = await prisma.beerLog.findMany({
    where: { ...userIdFilter },
    orderBy: { date: 'desc' },
  });
  const quantityTotal = (
    await prisma.beerLog.aggregate({
      where: { ...userIdFilter },
      orderBy: { date: 'desc' },
      _sum: { quantity: true },
    })
  )._sum.quantity!;
  const quantityPrevMonth = (
    await prisma.beerLog.aggregate({
      where: {
        ...userIdFilter,
        date: {
          gte: format(subMonths(startOfMonth(new Date()), 1), dateFormat),
          lt: format(startOfMonth(new Date()), dateFormat),
        },
      },
      _sum: { quantity: true },
    })
  )._sum.quantity!;
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

  const users = isShowAll ? await prisma.user.findMany() : undefined;

  return (
    <div>
      <div className="-mx-4 flex flex-col gap-4 py-4 md:-mx-6 md:gap-6 md:py-6">
        <DashboardStats
          beersTotal={quantityTotal}
          beersPrevMonth={quantityPrevMonth}
          beersThisMonth={quantityThisMonth}
          trendThisMonth={trendThisMonth}
        />
      </div>

      {allowShowAll && (
        <>
          <div className="flex justify-between">
            <DashboardToggle showAll={isShowAll} />

            {isShowAll && (
              <Button variant={'outline'} asChild>
                <Link href={`/${locale}/log/${logFormNewForUser}`}>
                  <Plus />
                </Link>
              </Button>
            )}
          </div>
        </>
      )}

      <DashboardTable users={users} logs={logsTotal.slice(0, isShowAll ? 50 : 10)} />
    </div>
  );
}
