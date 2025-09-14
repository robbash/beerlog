import { DashboardStats } from '@/components/dashboard-stats';
import { DashboardTable } from '@/components/dashboard-table';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, subMonths } from 'date-fns';
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('pages.dashboard');
  const session = await auth();

  if (!session) {
    return <>{t('loginHint')}</>;
  }

  const logsTotal = await prisma.beerLog.findMany({
    where: { userId: +session.user!.id! },
    orderBy: { date: 'desc' },
  });
  const quantityTotal = (
    await prisma.beerLog.aggregate({
      where: { userId: +session.user!.id! },
      orderBy: { date: 'desc' },
      _sum: { quantity: true },
    })
  )._sum.quantity!;
  const quantityPrevMonth = (
    await prisma.beerLog.aggregate({
      where: {
        userId: +session.user!.id!,
        date: { gte: subMonths(startOfMonth(new Date()), 1), lt: startOfMonth(new Date()) },
      },
      _sum: { quantity: true },
    })
  )._sum.quantity!;
  const quantityThisMonth = (
    await prisma.beerLog.aggregate({
      where: { userId: +session.user!.id!, date: { gte: startOfMonth(new Date()) } },
      _sum: { quantity: true },
    })
  )._sum.quantity!;

  let trendThisMonth = ((quantityThisMonth - quantityPrevMonth) / (quantityPrevMonth || 0)) * 100;
  if (trendThisMonth === Infinity) {
    trendThisMonth = 100;
  }

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

      <DashboardTable logs={logsTotal.slice(0, 10)} />
    </div>
  );
}
