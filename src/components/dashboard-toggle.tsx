'use client';

import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { UserRound, UsersRound } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface Props {
  showAll: boolean;
}

export function DashboardToggle(props: Props) {
  const { showAll } = props;

  const locale = useLocale();
  const t = useTranslations('components.dashboardToggle');

  return (
    <ToggleGroup variant="outline" type="single" value={showAll ? 'all' : 'own'}>
      <ToggleGroupItem
        value="own"
        aria-label={t('showOwn')}
        onClick={() => (window.location.href = `/${locale}`)}
      >
        <UserRound className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="all"
        aria-label={t('showAll')}
        onClick={() => (window.location.href = `/${locale}?show-all`)}
      >
        <UsersRound className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
