import { BeerLogForm } from '@/components/forms/beerlog-form';
import { auth } from '@/lib/auth';
import { dateFormat, dateRegex, logFormNewForUser, logFormToday, Roles } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export default async function Page({ params }: Props) {
  const { slug = [] } = await params;

  const session = await auth();
  if (!session) {
    return redirect('/');
  }

  const selector = slug[0] ?? logFormToday;

  let id = 0;
  let date: string | undefined;

  if (dateRegex.test(selector)) {
    date = selector;
  } else if (selector === logFormToday) {
    date = format(new Date(), dateFormat);
  } else if (selector === logFormNewForUser) {
    // do nothing, keep id=0
  } else if (Number.isNaN(Number(selector))) {
    return redirect('/');
  } else {
    id = Number(selector);
  }

  const userId = +session.user.id;
  const beerlog = await prisma.beerLog.findFirst({
    select: { id: true, userId: true, quantity: true, date: true },
    where: date ? { date, userId } : { id },
  });

  if (beerlog) {
    return <BeerLogForm {...beerlog} lockDate={id > 0} />;
  }

  let users: User[] | undefined = undefined;
  if (session.user.role !== Roles.User && selector === logFormNewForUser) {
    users = await prisma.user.findMany({ orderBy: [{ firstName: 'desc' }, { lastName: 'desc' }] });
  }

  return <BeerLogForm date={date} users={users} userId={userId} />;
}
