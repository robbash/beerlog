import { auth } from '@/lib/server/auth';
import { Roles, logFormNewForUser } from '@/lib/constants';
import { prisma } from '@/lib/server/prisma';
import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { getSummerGamesState } from '@/lib/server/summer-games';
import {
  currentIsoYearWeek,
  isoWeekDateRange,
  toDateString,
} from '@/lib/shared/summer-games';
import { SummerGamesParticipationForm } from '@/components/forms/summer-games-participation-form';

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export default async function Page({ params }: Props) {
  const { slug = [] } = await params;
  const selector = slug[0];

  const locale = await getLocale();

  const session = await auth();
  if (!session) {
    return redirect(
      `/${locale}/login?redirect-uri=${encodeURIComponent(`/${locale}/log-participation`)}`,
    );
  }

  const state = await getSummerGamesState();
  if (!state.isActive || !state.period) {
    return redirect(`/${locale}`);
  }

  const t = await getTranslations('pages.summerGames');
  const isPrivileged = session.user.role !== Roles.User;

  // Resolve target user
  let targetUserId = +session.user.id;
  let users = undefined as
    | Array<{ id: number; firstName: string; lastName: string }>
    | undefined;

  if (isPrivileged) {
    if (selector === logFormNewForUser || !selector) {
      users = await prisma.user.findMany({
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        select: { id: true, firstName: true, lastName: true },
      });
      if (selector === logFormNewForUser) {
        targetUserId = 0; // let user pick
      }
    } else if (!Number.isNaN(Number(selector))) {
      targetUserId = Number(selector);
    }
  }

  // Current ISO week + existing session (if any)
  const { isoYear, isoWeek } = currentIsoYearWeek();
  const existingSession = await prisma.summerGamesSession.findUnique({
    where: { isoYear_isoWeek: { isoYear, isoWeek } },
    include: { participations: { select: { userId: true } } },
  });

  const { start: weekStart, end: weekEnd } = isoWeekDateRange(isoYear, isoWeek);
  const suggestedDate = existingSession?.sessionDate ?? toDateString(new Date());

  return (
    <SummerGamesParticipationForm
      title={t('title')}
      description={t('description')}
      submitLabel={t('button.submit')}
      cancelLabel={t('button.cancel')}
      successLabel={t('success')}
      errorTitle={t('error.title')}
      dateLabel={t('form.date')}
      dateHint={
        existingSession ? t('form.dateLocked') : t('form.dateFirstUserHint')
      }
      feeLabel={t('form.fee')}
      userLabel={t('form.userId')}
      userPlaceholder={t('form.userIdPlaceholder')}
      alreadyLoggedLabel={t('alreadyLogged')}
      feeCents={state.feeCents}
      isoYear={isoYear}
      isoWeek={isoWeek}
      weekStart={weekStart}
      weekEnd={weekEnd}
      suggestedDate={suggestedDate}
      dateLocked={Boolean(existingSession)}
      targetUserId={targetUserId}
      users={users}
      alreadyLoggedUserIds={existingSession?.participations.map((p) => p.userId) ?? []}
    />
  );
}
