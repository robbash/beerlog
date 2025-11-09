import { UsersTable } from '@/components/users-table';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserBalanceDetails } from '@/lib/payments';
import { redirect } from 'next/navigation';

export default async function Page() {
  const session = await auth();

  if (!session) {
    return redirect('/');
  }

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

  return <UsersTable users={usersWithBalance} />;
}
