import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BeerLog } from '@prisma/client';
import { IconCurrencyEuro, IconCurrencyEuroOff, IconEdit } from '@tabler/icons-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Button } from './ui/button';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils/date';

interface Props {
  logs: BeerLog[];
}

export async function DashboardTable(props: Props) {
  const { logs = [] } = props;

  const locale = await getLocale();

  const t = await getTranslations('components.dashboardTable');

  return (
    <Table>
      <TableCaption>{t('caption')}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">{t('headers.date')}</TableHead>
          <TableHead>{t('headers.quantity')}</TableHead>
          <TableHead>{t('headers.status')}</TableHead>
          <TableHead className="text-right">{t('headers.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => {
          return (
            <TableRow key={log.id}>
              <TableCell className="font-medium">{formatDateTime(log.date)}</TableCell>
              <TableCell>{log.quantity}</TableCell>
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
                    <Link href={`/${locale}/log/${log.id}`}>
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
