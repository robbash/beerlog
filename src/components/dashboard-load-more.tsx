'use client';

import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
  hasMore: boolean;
  currentLimit: number;
}

export function DashboardLoadMore({ hasMore, currentLimit }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('components.dashboardLoadMore');
  const [requestedLimit, setRequestedLimit] = useState<number | null>(null);

  // Still loading as long as the limit we navigated to has not arrived as a prop yet
  const isLoading = requestedLimit !== null && requestedLimit !== currentLimit;

  if (!hasMore) {
    return null;
  }

  const handleLoadMore = () => {
    const params = new URLSearchParams(searchParams.toString());
    const newLimit = currentLimit + 20;
    params.set('limit', String(newLimit));
    setRequestedLimit(newLimit);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex justify-center py-6">
      <Button
        variant="outline"
        onClick={handleLoadMore}
        disabled={isLoading}
        className="min-w-[150px]"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" />
            {t('loading')}
          </>
        ) : (
          t('loadMore')
        )}
      </Button>
    </div>
  );
}
