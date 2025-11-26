import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BeerLog, User, PaymentAllocation } from '@prisma/client';
import { IconCurrencyEuro, IconCurrencyEuroOff, IconEdit } from '@tabler/icons-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Button } from './ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { humanDateFormat } from '@/lib/constants';
import { getLogPaymentStatus } from '@/lib/payments';
import { UserRound, UsersRound } from 'lucide-react';

interface BeerLogWithAllocations extends BeerLog {
  paymentAllocations: PaymentAllocation[];
}

interface Props {
  logs: BeerLogWithAllocations[];
  users?: User[];
}

export async function DashboardTable(props: Props) {
  const { logs = [], users } = props;

  const locale = await getLocale();

  const t = await getTranslations('components.dashboardTable');

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 p-2">
        {users ? <UsersRound className="size-4" /> : <UserRound className="size-4" />}
        {t('title')}
      </div>

      <Table>
        <TableCaption>{t(`caption.${users ? 'all' : 'own'}`)}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">{t('headers.date')}</TableHead>
            <TableHead>{t('headers.quantity')}</TableHead>
            {users && <TableHead>{t('headers.user')}</TableHead>}
            <TableHead>{t('headers.status')}</TableHead>
            <TableHead className="text-right">{t('headers.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const user = users?.find((user) => user.id === log.userId);
            const editLink = `/${locale}/log/${users ? log.id : log.date}`;
            const paymentStatus = getLogPaymentStatus(log);

            return (
              <TableRow key={log.id}>
                <TableCell className="font-medium">
                  {format(new Date(log.date), humanDateFormat)}
                </TableCell>
                <TableCell>{log.quantity}</TableCell>
                {users && (
                  <TableCell>
                    {user?.firstName} {user?.lastName}
                  </TableCell>
                )}
                <TableCell>
                  {paymentStatus === 'paid' && (
                    <IconCurrencyEuro className="text-green-600" title="Fully paid" />
                  )}
                  {paymentStatus === 'partial' && (
                    <IconCurrencyEuro
                      className="text-orange-500"
                      title={`Partially paid: ${log.paymentAllocations?.reduce((sum: number, a) => sum + a.amountCents, 0) || 0}/${log.costCentsAtTime} cents`}
                    />
                  )}
                  {paymentStatus === 'unpaid' && (
                    <IconCurrencyEuroOff className="text-gray-300" title="Unpaid" />
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {log.isPaidFor ? (
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
          })}
        </TableBody>
      </Table>
    </div>
  );
}
