import { PaymentHistoryTable } from '@/components/payment-history-table';
import { auth } from '@/lib/server/auth';
import { Roles } from '@/lib/constants';
import { prisma } from '@/lib/server/prisma';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const session = await auth();

  if (!session) {
    return redirect('/');
  }

  // Only managers and admins can view payment history
  const isManagerOrAdmin =
    session.user?.role === Roles.Manager || session.user?.role === Roles.Admin;

  if (!isManagerOrAdmin) {
    return redirect('/');
  }

  const t = await getTranslations('pages.paymentHistory');

  // Get all payments with related data
  const payments = await prisma.payment.findMany({
    include: {
      allocations: {
        include: {
          beerLog: true,
        },
      },
      recordedBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-gray-600">{t('description')}</p>
      </div>

      <PaymentHistoryTable payments={payments} showUser={true} />
    </div>
  );
}
