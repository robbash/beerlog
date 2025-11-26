'use client';

import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Trophy, UserRound, UsersRound } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

export type ViewType = 'all' | 'own' | 'ranking';

interface Props {
  available: ViewType[];
  current: ViewType;
}

export function DashboardToggle(props: Props) {
  const { available, current } = props;

  const locale = useLocale();
  const t = useTranslations('components.dashboardToggle');

  return (
    <ToggleGroup variant="outline" type="single" value={current} className="w-full">
      {available.includes('ranking') && (
        <ToggleGroupItem
          value="ranking"
          aria-label={t('showRanking')}
          onClick={() => (window.location.href = `/${locale}`)}
          className="flex-1"
        >
          <Trophy className="h-4 w-4" />
        </ToggleGroupItem>
      )}

      {available.includes('own') && (
        <ToggleGroupItem
          value="own"
          aria-label={t('showOwn')}
          onClick={() => (window.location.href = `/${locale}?show-own`)}
          className="flex-1"
        >
          <UserRound className="h-4 w-4" />
        </ToggleGroupItem>
      )}

      {available.includes('all') && (
        <ToggleGroupItem
          value="all"
          aria-label={t('showAll')}
          onClick={() => (window.location.href = `/${locale}?show-all`)}
          className="flex-1"
        >
          <UsersRound className="h-4 w-4" />
        </ToggleGroupItem>
      )}
    </ToggleGroup>
  );
}
