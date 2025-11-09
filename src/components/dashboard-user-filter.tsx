'use client';

import { User } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface Props {
  users: User[];
}

export function DashboardUserFilter({ users }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('components.dashboardUserFilter');

  const currentUserId = searchParams.get('userId') || 'all';

  const handleUserChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === 'all') {
      params.delete('userId');
    } else {
      params.set('userId', value);
    }

    // Keep show-all param
    if (searchParams.has('show-all')) {
      params.set('show-all', '');
    }

    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="user-filter" className="text-sm font-medium">
        {t('label')}:
      </label>
      <Select value={currentUserId} onValueChange={handleUserChange}>
        <SelectTrigger id="user-filter" className="w-[200px]">
          <SelectValue placeholder={t('placeholder')} />
        </SelectTrigger>
        <SelectContent className="bg-white">
          <SelectItem value="all">{t('allUsers')}</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={String(user.id)}>
              {user.firstName} {user.lastName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
