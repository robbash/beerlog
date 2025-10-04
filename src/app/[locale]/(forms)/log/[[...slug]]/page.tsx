import { BeerLogForm } from '@/components/forms/beerlog-form';
import { auth } from '@/lib/auth';
import { Roles } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';
import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export default async function Page({ params }: Props) {
  const { slug = [] } = await params;
  const id = Number(slug[0] ?? '0');

  const session = await auth();

  if (!session) {
    return redirect('/');
  }

  let users: User[] | undefined = undefined;

  if (session.user.role !== Roles.User) {
    users = await prisma.user.findMany({ orderBy: [{ firstName: 'desc' }, { lastName: 'desc' }] });
  }

  if (id) {
    const beerlog = await prisma.beerLog.findFirst({
      select: { id: true, userId: true, quantity: true, date: true },
      where: { id },
    });

    return (
      <BeerLogForm {...{ ...beerlog, userId: beerlog?.userId ?? +session.user.id }} users={users} />
    );
  }

  return <BeerLogForm users={users} />;
}
