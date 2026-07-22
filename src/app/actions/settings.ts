'use server';

import { auth } from '@/lib/server/auth';
import { Roles, dateRegex } from '@/lib/constants';
import { SettingKeys, setSetting } from '@/lib/server/settings';
import { z } from 'zod';

const settingsSchema = z.object({
  beerPriceCents: z.coerce.number().int().min(0),
  summerGamesStartDate: z
    .union([z.string().regex(dateRegex), z.literal('')])
    .transform((v) => (v === '' ? null : v))
    .nullable(),
  summerGamesDurationWeeks: z.coerce.number().int().min(1).max(52),
  summerGamesFeeCents: z.coerce.number().int().min(0),
});

export type SettingsFormData = z.input<typeof settingsSchema>;

export type SettingsResult = {
  ok: boolean;
  errors?: Record<string, string[]>;
  formError?: string;
  values?: SettingsFormData;
};

export async function saveSettings(formData: SettingsFormData): Promise<SettingsResult> {
  const session = await auth();

  if (!session) {
    return { ok: false, errors: { '401': ['not authorized'] } };
  }

  if (session.user?.role !== Roles.Admin) {
    return { ok: false, errors: { '403': ['insufficient permissions'] } };
  }

  const parsed = settingsSchema.safeParse(formData);
  if (!parsed.success) {
    const { fieldErrors, formErrors } = parsed.error.flatten();
    return {
      ok: false,
      errors: fieldErrors,
      formError: formErrors.join(' '),
      values: formData,
    };
  }

  try {
    await Promise.all([
      setSetting(SettingKeys.BeerPriceCents, String(parsed.data.beerPriceCents)),
      setSetting(SettingKeys.SummerGamesStartDate, parsed.data.summerGamesStartDate ?? ''),
      setSetting(
        SettingKeys.SummerGamesDurationWeeks,
        String(parsed.data.summerGamesDurationWeeks),
      ),
      setSetting(SettingKeys.SummerGamesFeeCents, String(parsed.data.summerGamesFeeCents)),
    ]);

    return { ok: true };
  } catch (error) {
    console.error('[saveSettings] error:', error);
    return { ok: false, formError: 'saveFailed', values: formData };
  }
}
