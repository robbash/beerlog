import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BeerLog, User } from '@prisma/client';
import { IconCurrencyEuro, IconCurrencyEuroOff, IconEdit } from '@tabler/icons-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Button } from './ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { humanDateFormat } from '@/lib/constants';

interface Props {
  logs: BeerLog[];
  users?: User[];
}

export async function DashboardTable(props: Props) {
  const { logs = [], users } = props;

  const locale = await getLocale();

  const t = await getTranslations('components.dashboardTable');

  return (
    <Table>
      <TableCaption>{t('caption')}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">{t('headers.date')}</TableHead>
          {users && <TableHead>{t('headers.user')}</TableHead>}
          <TableHead>{t('headers.quantity')}</TableHead>
          <TableHead>{t('headers.status')}</TableHead>
          <TableHead className="text-right">{t('headers.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => {
          const user = users?.find((user) => user.id === log.userId);
          const editLink = `/${locale}/log/${users ? log.id : log.date}`;

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
                {log.isPaidFor ? (
                  <IconCurrencyEuro />
                ) : (
                  <IconCurrencyEuroOff className="text-gray-300" />
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
  );
}
