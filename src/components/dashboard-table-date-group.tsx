'use client';

import { useState } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { format } from 'date-fns';
import { humanDateFormat } from '@/lib/constants';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { BeerLog, User, PaymentAllocation } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { DashboardTableRow } from './dashboard-table-row';

interface BeerLogWithAllocations extends BeerLog {
  paymentAllocations: PaymentAllocation[];
}

interface Props {
  dateKey: string;
  dateLogs: BeerLogWithAllocations[];
  users: User[];
  locale: string;
  isLastGroup: boolean;
}

export function DashboardTableDateGroup({ dateKey, dateLogs, users, locale, isLastGroup }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslations('components.dashboardTable');
  const dateTotal = dateLogs.reduce((sum, log) => sum + log.quantity, 0);

  return (
    <>
      <TableRow
        className="hover:bg-muted/30 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <TableCell className="py-4 font-medium">
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            {format(new Date(dateKey), humanDateFormat)}
          </div>
        </TableCell>
        <TableCell>
          {dateTotal}
          {isLastGroup && <span className="text-muted-foreground ml-2 text-xs">*</span>}
        </TableCell>
        <TableCell colSpan={3} className="text-muted-foreground text-sm">
          {dateLogs.length} {t(`entries.${dateLogs.length === 1 ? 'single' : 'multiple'}`)}
        </TableCell>
      </TableRow>

      {isExpanded &&
        dateLogs.map((log) => (
          <DashboardTableRow
            key={log.id}
            log={log}
            locale={locale}
            user={users.find((u) => u.id === log.userId)}
            isGrouped
          />
        ))}
    </>
  );
}
