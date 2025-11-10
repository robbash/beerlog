import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { humanDateFormat } from '@/lib/constants';
import { PaymentAllocation, BeerLog } from '@prisma/client';
import { useTranslations } from 'next-intl';

interface PaymentWithDetails {
  id: number;
  userId: number;
  amountCents: number;
  currency: string;
  note: string | null;
  recordedById: number;
  createdAt: Date;
  allocations: (PaymentAllocation & {
    beerLog: BeerLog;
  })[];
  recordedBy: {
    firstName: string;
    lastName: string;
  };
  user: {
    firstName: string;
    lastName: string;
  };
}

interface Props {
  payments: PaymentWithDetails[];
  showUser?: boolean;
}

export function PaymentHistoryTable({ payments, showUser = false }: Props) {
  const t = useTranslations('components.paymentHistoryTable');

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  if (payments.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <p>{t('noPayments')}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableCaption>{t('caption')}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[120px]">{t('headers.date')}</TableHead>
          {showUser && <TableHead>{t('headers.user')}</TableHead>}
          <TableHead className="text-right">{t('headers.amount')}</TableHead>
          <TableHead>{t('headers.note')}</TableHead>
          <TableHead>{t('headers.recordedBy')}</TableHead>
          <TableHead className="text-right">{t('headers.allocated')}</TableHead>
          <TableHead className="text-right">{t('headers.credit')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => {
          const allocatedAmount = payment.allocations.reduce(
            (sum, alloc) => sum + alloc.amountCents,
            0,
          );
          const remainingCredit = payment.amountCents - allocatedAmount;

          return (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">
                {format(new Date(payment.createdAt), humanDateFormat)}
              </TableCell>
              {showUser && (
                <TableCell>
                  {payment.user.firstName} {payment.user.lastName}
                </TableCell>
              )}
              <TableCell className="text-right font-semibold">
                {formatCurrency(payment.amountCents)}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-sm text-gray-600">
                {payment.note || '-'}
              </TableCell>
              <TableCell className="text-sm">
                {payment.recordedBy.firstName} {payment.recordedBy.lastName}
              </TableCell>
              <TableCell className="text-right text-sm">
                {payment.allocations.length > 0 ? (
                  <div className="flex flex-col items-end">
                    <span className="text-gray-600">
                      {payment.allocations.length} {t('logs')}
                    </span>
                    <span className="text-xs text-gray-500">{formatCurrency(allocatedAmount)}</span>
                  </div>
                ) : (
                  <span className="text-gray-400">{t('noAllocations')}</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {remainingCredit > 0 ? (
                  <span className="font-medium text-green-600">
                    {formatCurrency(remainingCredit)}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
