import { PaymentForm } from '@/components/forms/payment-form';
import { auth } from '@/lib/auth';
import { Roles } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const session = await auth();

  if (!session) {
    return redirect('/');
  }

  // Only managers and admins can access this page
  if (session.user?.role === Roles.User) {
    return redirect('/');
  }

  const params = await searchParams;
  const selectedUserId = params.userId ? parseInt(params.userId) : undefined;

  const users = await prisma.user.findMany({
    where: {
      approved: true,
    },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  });

  return (
    <div className="flex justify-center p-4">
      <div className="w-full max-w-md">
        <PaymentForm users={users} selectedUserId={selectedUserId} />
      </div>
    </div>
  );
}
