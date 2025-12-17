import {
  IconBeerFilled,
  IconTrendingUp,
  IconTrendingDown,
  IconCreditCard,
} from '@tabler/icons-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { getBeerPriceCents } from '@/lib/server/settings';
import { Constants } from '@/lib/constants';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface Props {
  beersTotal: number;
  beersPrevMonth: number;
  beersThisMonth: number;
  trendThisMonth: number;
  userBalance: {
    creditCents: number;
    owedCents: number;
    netBalanceCents: number;
  };
  currentUserRank: number | null;
}

export async function DashboardStats(props: Props) {
  const {
    beersTotal,
    beersPrevMonth,
    beersThisMonth,
    trendThisMonth,
    userBalance,
    currentUserRank,
  } = props;
  const pricePerBeer = await getBeerPriceCents();

  const locale = await getLocale();
  const t = await getTranslations('components.dashboardStats');
  const format = await getFormatter();

  const trend = trendThisMonth;
  const isTrendUp = trend > 0;
  const isTrendDown = trend < 0;

  // Determine badge display
  const getRankBadge = (rank: number | null) => {
    if (rank === 1) return { emoji: '🥇', color: 'text-yellow-600 dark:text-yellow-400' };
    if (rank === 2) return { emoji: '🥈', color: 'text-gray-500 dark:text-gray-400' };
    if (rank === 3) return { emoji: '🥉', color: 'text-orange-700 dark:text-orange-500' };
    return null;
  };

  const rankBadge = getRankBadge(currentUserRank);
  const paypalMeId = process.env.PAYPAL_ME_ID;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card py-3">
        <CardHeader>
          <CardDescription className="flex items-center justify-center gap-2">
            {t('cards.total.title')}
          </CardDescription>
          <CardTitle className="flex justify-center text-xl font-semibold md:text-base lg:text-2xl">
            <div className="flex gap-2 align-middle">
              <IconBeerFilled className="my-1 size-5 md:size-4 lg:size-6" /> {beersTotal} /{' '}
              {format.number((beersTotal * pricePerBeer) / 100, {
                style: 'currency',
                currency: Constants.CURRENCY,
              })}
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="@container/card relative py-3">
        <CardHeader>
          <CardDescription className="flex items-center justify-center gap-2">
            {t('cards.thisMonth.title')}
            {rankBadge && (
              <span className={cn('text-2xl', rankBadge.color)} title={`Rank #${currentUserRank}`}>
                {rankBadge.emoji}
              </span>
            )}
          </CardDescription>
          <CardTitle className="flex justify-center text-xl font-semibold tabular-nums md:text-base lg:text-2xl">
            <div className="flex flex-col items-center gap-1">
              <div className="flex gap-2 align-middle">
                <IconBeerFilled className="my-1 size-5 md:size-4 lg:size-6" /> {beersThisMonth} /{' '}
                {format.number((beersThisMonth * pricePerBeer) / 100, {
                  style: 'currency',
                  currency: Constants.CURRENCY,
                })}
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="text-[10px] text-gray-500 dark:text-gray-400">
                  {t('cards.thisMonth.prevMonth')}: {beersPrevMonth} {t('cards.thisMonth.drinks')}
                </div>
                {trend !== 0 && !isNaN(trend) && isFinite(trend) && (
                  <div
                    className={cn(
                      'flex items-center gap-1 text-xs md:text-[10px] lg:text-xs',
                      isTrendUp && 'text-green-600',
                      isTrendDown && 'text-orange-600',
                    )}
                  >
                    {isTrendUp && <IconTrendingUp className="size-3" />}
                    {isTrendDown && <IconTrendingDown className="size-3" />}
                    <span>
                      {Math.abs(trend).toFixed(0)}%{' '}
                      {t(`cards.thisMonth.${isTrendUp ? 'trendUp' : 'trendDown'}`)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="@container/card py-3">
        <CardHeader>
          <CardDescription className="flex items-center justify-center gap-2">
            {t('cards.balance.title')}
          </CardDescription>
          <CardTitle className="flex flex-col items-center justify-center gap-2 text-xl font-semibold tabular-nums md:text-base lg:text-2xl">
            <span
              className={cn(
                'text-2xl font-bold md:text-xl lg:text-3xl',
                userBalance.netBalanceCents < 0 ? 'text-red-600' : 'text-green-600',
              )}
            >
              {format.number(userBalance.netBalanceCents / 100, {
                style: 'currency',
                currency: Constants.CURRENCY,
                signDisplay: 'negative',
              })}
            </span>
            {paypalMeId && (
              <Button size="sm" variant="outline" asChild className="mt-1">
                <Link
                  href={`https://paypal.me/${paypalMeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <IconCreditCard className="size-4" />
                  {t('cards.balance.chargeUp')}
                </Link>
              </Button>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="@container/card border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 py-3 transition-shadow hover:shadow-md dark:border-amber-800 dark:from-amber-950/20 dark:to-orange-950/20">
        <CardHeader>
          <CardTitle className="flex justify-center">
            <Link href={`/${locale}/log/today`} className="group flex flex-col items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl transition-colors group-hover:bg-amber-400/30" />
                <Image
                  src="/beerlog-icon.png"
                  alt="Add drink"
                  width={64}
                  height={64}
                  className="relative drop-shadow-lg transition-transform duration-200 group-hover:scale-110"
                />
              </div>
              <span className="text-sm font-semibold text-amber-900 transition-colors group-hover:text-amber-700 dark:text-amber-100 dark:group-hover:text-amber-200">
                {t('cards.addDrink.title')}
              </span>
            </Link>
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
