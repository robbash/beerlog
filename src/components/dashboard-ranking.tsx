import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getTranslations } from 'next-intl/server';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

interface RankingEntry {
  userId: number;
  userName: string;
  quantity: number;
  rank: number;
}

interface Props {
  rankings: RankingEntry[];
  currentUserId: number;
}

export async function DashboardRanking({ rankings, currentUserId }: Props) {
  const t = await getTranslations('components.dashboardRanking');

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const censorName = (name: string) => {
    // Blur the name by replacing characters with dots
    return '•'.repeat(Math.min(name.length, 10));
  };

  return (
    <div className="w-full">
      <div className="p-2">
        <div className="flex items-center gap-2">
          <Trophy className="size-4" />
          {t('title')}
        </div>
        <div className="text-muted-foreground text-sm">{t('description')}</div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">{t('headers.rank')}</TableHead>
            <TableHead>{t('headers.name')}</TableHead>
            <TableHead className="text-right">{t('headers.drinks')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rankings.map((entry) => {
            const isCurrentUser = entry.userId === currentUserId;
            const rankIcon = getRankIcon(entry.rank);

            return (
              <TableRow
                key={entry.userId}
                className={cn(isCurrentUser && 'bg-primary/5 font-medium')}
              >
                <TableCell className="font-semibold">
                  <div className="flex items-center gap-1">
                    {rankIcon && <span className="text-lg">{rankIcon}</span>}
                    <span>{entry.rank}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {isCurrentUser ? (
                    <span className={cn(isCurrentUser && 'font-semibold')}>
                      {entry.userName}
                      {isCurrentUser && (
                        <span className="text-muted-foreground ml-2 text-xs">({t('you')})</span>
                      )}
                    </span>
                  ) : (
                    <span className="blur-sm select-none">{censorName(entry.userName)}</span>
                  )}
                </TableCell>
                <TableCell className="text-right">{entry.quantity}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
