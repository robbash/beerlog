'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { updateUserLocale } from '@/app/actions/user';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

interface LanguageSelectorProps {
  userId?: number;
}

export function LanguageSelector({ userId }: LanguageSelectorProps) {
  const t = useTranslations('settings.language');
  const locale = useLocale();
  const pathname = usePathname();

  const changeLanguage = async (newLocale: string) => {
    if (newLocale === locale) return;

    if (userId) {
      await updateUserLocale(userId, newLocale);
      toast.success(t('updated'));
    }

    // Navigate to the new locale - use window.location for a full page reload
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
    window.location.href = newPathname;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Languages className="h-4 w-4" />
          <span className="ml-2 hidden md:inline">{t(locale as 'en' | 'de')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLanguage('en')}>{t('en')}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('de')}>{t('de')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
