import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BeerLog, User, PaymentAllocation } from '@prisma/client';
import { getLocale, getTranslations } from 'next-intl/server';
import { UserRound, UsersRound } from 'lucide-react';
import { DashboardTableDateGroup } from './dashboard-table-date-group';
import { DashboardTableRow } from './dashboard-table-row';

interface BeerLogWithAllocations extends BeerLog {
  paymentAllocations: PaymentAllocation[];
}

interface Props {
  logs: BeerLogWithAllocations[];
  users?: User[];
  isSingleUser?: boolean;
}

export async function DashboardTable(props: Props) {
  const { logs = [], users } = props;
  const { isSingleUser = users === undefined } = props;

  const locale = await getLocale();

  const t = await getTranslations('components.dashboardTable');

  // Group logs by date when showing all users
  const groupedLogs: Map<string, BeerLogWithAllocations[]> = new Map();
  if (users) {
    logs.forEach((log) => {
      const dateKey = log.date;
      if (!groupedLogs.has(dateKey)) {
        groupedLogs.set(dateKey, []);
      }
      groupedLogs.get(dateKey)!.push(log);
    });
  }

  const renderLogRows = () => {
    if (!users || isSingleUser) {
      return logs.map((log) => (
        <DashboardTableRow
          key={log.id}
          log={log}
          locale={locale}
          user={users?.find((u) => u.id === log.userId)}
        />
      ));
    }

    const rows: React.JSX.Element[] = [];
    const dateKeys = Array.from(groupedLogs.keys());

    dateKeys.forEach((dateKey, index) => {
      const dateLogs = groupedLogs.get(dateKey)!;
      const isLastGroup = index === dateKeys.length - 1;

      rows.push(
        <DashboardTableDateGroup
          key={`group-${dateKey}`}
          dateKey={dateKey}
          dateLogs={dateLogs}
          users={users}
          locale={locale}
          isLastGroup={isLastGroup}
        />,
      );
    });

    return rows;
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 p-2">
        {users ? <UsersRound className="size-4" /> : <UserRound className="size-4" />}
        {t('title')}
      </div>

      <Table>
        <TableCaption>
          {t(`caption.${users ? 'all' : 'own'}`)}
          {users && (
            <div className="text-muted-foreground mt-2 text-xs">
              * {t(`caption.incompleteNote`)}
            </div>
          )}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">{t('headers.date')}</TableHead>
            <TableHead>{t('headers.quantity')}</TableHead>
            {users && <TableHead>{t('headers.user')}</TableHead>}
            <TableHead>{t('headers.status')}</TableHead>
            <TableHead className="text-right">{t('headers.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{renderLogRows()}</TableBody>
      </Table>
    </div>
  );
}
