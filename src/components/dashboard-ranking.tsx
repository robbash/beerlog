'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Eye, Trophy, Volleyball } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface RankingEntry {
  userId: number;
  userName: string;
  quantity: number;
  rank: number;
}

interface Props {
  rankings: RankingEntry[];
  currentUserId: number;
  isAdminOrManager?: boolean;
  mode?: 'monthly' | 'summerGames';
}

export function DashboardRanking({
  rankings,
  currentUserId,
  isAdminOrManager = false,
  mode = 'monthly',
}: Props) {
  const t = useTranslations('components.dashboardRanking');
  const [isRevealing, setIsRevealing] = useState(false);
  const isSummer = mode === 'summerGames';

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
        <div className="flex items-center justify-between">
          <div>
            <div className={cn('flex items-center gap-2', isSummer && 'text-green-700')}>
              {isSummer ? <Volleyball className="size-4" /> : <Trophy className="size-4" />}
              {isSummer ? t('summerGames.title') : t('title')}
            </div>
            <div className="text-muted-foreground text-sm">
              {isSummer ? t('summerGames.description') : t('description')}
            </div>
            {isSummer && (
              <div className="mt-1 text-xs text-green-700/70 italic">
                {t('summerGames.subtitle')}
              </div>
            )}
          </div>

          {isAdminOrManager && (
            <Button
              variant="outline"
              size="sm"
              onMouseDown={() => setIsRevealing(true)}
              onMouseUp={() => setIsRevealing(false)}
              onMouseLeave={() => setIsRevealing(false)}
              onTouchStart={() => setIsRevealing(true)}
              onTouchEnd={() => setIsRevealing(false)}
              className="gap-2"
            >
              <Eye className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">{t('headers.rank')}</TableHead>
            <TableHead>{t('headers.name')}</TableHead>
            <TableHead className="text-right">
              {isSummer ? t('summerGames.headers.participations') : t('headers.drinks')}
            </TableHead>
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
                  {isCurrentUser || isRevealing ? (
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
