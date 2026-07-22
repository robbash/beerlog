'use client';

import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from './ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { humanDateFormat } from '@/lib/constants';
import { getLogPaymentStatus } from '@/lib/shared/payments';
import { IconCurrencyEuro, IconCurrencyEuroOff, IconEdit } from '@tabler/icons-react';
import { Volleyball } from 'lucide-react';
import { BeerLog, PaymentAllocation, User } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface BeerLogWithAllocations extends BeerLog {
  paymentAllocations: PaymentAllocation[];
}

interface Props {
  locale: string;
  log: BeerLogWithAllocations;
  isGrouped?: boolean;
  user?: User;
}

export function DashboardTableRow({ log, locale, user, isGrouped = false }: Props) {
  const t = useTranslations('components.dashboardTable');

  const editLink = `/${locale}/log/${log.date}`;
  const paymentStatus = getLogPaymentStatus(log);
  const isSummerGames = log.summerGamesParticipationId != null;

  return (
    <TableRow className={isGrouped ? 'text-muted-foreground' : ''}>
      <TableCell className={cn('py-4 font-medium', isGrouped ? 'pl-8' : '')}>
        {format(new Date(log.date), humanDateFormat)}
      </TableCell>
      <TableCell>
        {isSummerGames ? (
          <span className="inline-flex items-center gap-1 text-green-700" title={t('summerGames')}>
            <Volleyball className="size-4" />
            <span className="text-xs uppercase">{t('summerGames')}</span>
          </span>
        ) : (
          log.quantity
        )}
      </TableCell>
      {user && (
        <TableCell>
          {user?.firstName} {user?.lastName}
        </TableCell>
      )}
      <TableCell>
        {paymentStatus === 'paid' && (
          <IconCurrencyEuro className="text-green-600" title={t('paymentStatus.paid')} />
        )}
        {paymentStatus === 'partial' && (
          <IconCurrencyEuro
            className="text-orange-500"
            title={t('paymentStatus.partial', {
              allocated:
                log.paymentAllocations?.reduce((sum: number, a) => sum + a.amountCents, 0) || 0,
              total: log.costCentsAtTime,
            })}
          />
        )}
        {paymentStatus === 'unpaid' && (
          <IconCurrencyEuroOff className="text-gray-300" title={t('paymentStatus.unpaid')} />
        )}
      </TableCell>
      <TableCell className="text-right">
        {log.isPaidFor || isSummerGames ? (
          <Button variant="outline" disabled>
            <IconEdit />
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <Link href={editLink}>
              <IconEdit />
            </Link>
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
