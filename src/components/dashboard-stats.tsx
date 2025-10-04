import { IconBeerFilled, IconPlus } from '@tabler/icons-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { getBeerPriceCents } from '@/lib/settings';
import { Constants } from '@/lib/constants';
import Link from 'next/link';

interface Props {
  beersTotal: number;
  beersPrevMonth: number;
  beersThisMonth: number;
  trendThisMonth: number;
}

export async function DashboardStats(props: Props) {
  const { beersTotal, beersPrevMonth, beersThisMonth } = props;
  const pricePerBeer = await getBeerPriceCents();

  const locale = await getLocale();
  const t = await getTranslations('components.dashboardStats');
  const format = await getFormatter();

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card py-3">
        <CardHeader>
          <CardDescription>{t('cards.total.title')}</CardDescription>
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

      <Card className="@container/card py-3">
        <CardHeader>
          <CardDescription>{t('cards.prevMonth.title')}</CardDescription>
          <CardTitle className="flex justify-center text-2xl font-semibold tabular-nums md:text-base lg:text-2xl">
            <div className="flex gap-2 align-middle">
              <IconBeerFilled className="my-1 size-5 md:size-4 lg:size-6" /> {beersPrevMonth} /{' '}
              {format.number((beersPrevMonth * pricePerBeer) / 100, {
                style: 'currency',
                currency: Constants.CURRENCY,
              })}
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="@container/card py-3">
        <CardHeader>
          <CardDescription>{t('cards.thisMonth.title')}</CardDescription>
          <CardTitle className="flex justify-center text-xl font-semibold tabular-nums md:text-base lg:text-2xl">
            <div className="flex gap-2 align-middle">
              <IconBeerFilled className="my-1 size-5 md:size-4 lg:size-6" /> {beersThisMonth} /{' '}
              {format.number((beersThisMonth * pricePerBeer) / 100, {
                style: 'currency',
                currency: Constants.CURRENCY,
              })}
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="@container/card py-3">
        <CardHeader>
          <CardTitle className="flex justify-center">
            <Link href={`/${locale}/log/today`}>
              <IconPlus className="size-8 md:size-12 lg:size-16" />
            </Link>
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
