import { auth } from '@/lib/server/auth';
import { Roles } from '@/lib/constants';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getBeerPriceCents, getSummerGamesConfig } from '@/lib/server/settings';
import { AdminSettingsForm } from '@/components/forms/admin-settings-form';

export default async function Page() {
  const session = await auth();

  if (!session || session.user?.role !== Roles.Admin) {
    return redirect('/');
  }

  const t = await getTranslations('pages.admin.settings');

  const [beerPriceCents, summerGamesConfig] = await Promise.all([
    getBeerPriceCents(),
    getSummerGamesConfig(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-gray-600">{t('description')}</p>
      </div>

      <AdminSettingsForm
        defaults={{
          beerPriceCents,
          summerGamesStartDate: summerGamesConfig.startDate ?? '',
          summerGamesDurationWeeks: summerGamesConfig.durationWeeks,
          summerGamesFeeCents: summerGamesConfig.feeCents,
        }}
      />
    </div>
  );
}
