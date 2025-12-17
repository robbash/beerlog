import { UsersTable } from '@/components/users-table';
import { auth } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { getUserBalanceDetails } from '@/lib/server/payments';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Roles } from '@/lib/constants';

export default async function Page() {
  const session = await auth();

  if (!session || session.user?.role !== Roles.Admin) {
    return redirect('/');
  }

  const t = await getTranslations('pages.users');

  const users = await prisma.user.findMany({
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  });

  // Get balance for each user
  const usersWithBalance = await Promise.all(
    users.map(async (user) => ({
      ...user,
      balance: await getUserBalanceDetails(user.id),
    })),
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-gray-600">{t('description')}</p>
      </div>

      <UsersTable users={usersWithBalance} />
    </div>
  );
}
