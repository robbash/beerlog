import { UsersTable } from '@/components/users-table';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function Page() {
  const session = await auth();

  if (!session) {
    return redirect('/');
  }

  const users = await prisma.user.findMany({
    orderBy: [{ firstName: 'desc' }, { lastName: 'desc' }],
  });

  return <UsersTable users={users} />;
}
