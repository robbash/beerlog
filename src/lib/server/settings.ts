import { prisma } from './prisma';

export async function getSetting(key: string): Promise<string | null> {
  const s = await prisma.setting.findUnique({ where: { key } });
  return s?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

async function getSettingInt(key: string, fallback: number): Promise<number> {
  const raw = await getSetting(key);
  if (raw === null) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export const SettingKeys = {
  BeerPriceCents: 'beerPriceCents',
  SummerGamesStartDate: 'summerGamesStartDate',
  SummerGamesDurationWeeks: 'summerGamesDurationWeeks',
  SummerGamesFeeCents: 'summerGamesFeeCents',
} as const;

export const SummerGamesDefaults = {
  durationWeeks: 6,
  feeCents: 500,
} as const;

export async function getBeerPriceCents(): Promise<number> {
  return getSettingInt(SettingKeys.BeerPriceCents, 100);
}

export async function setBeerPriceCents(v: number): Promise<void> {
  await setSetting(SettingKeys.BeerPriceCents, String(v));
}

export interface SummerGamesConfig {
  startDate: string | null; // 'yyyy-MM-dd'
  durationWeeks: number;
  feeCents: number;
}

export async function getSummerGamesConfig(): Promise<SummerGamesConfig> {
  const [startDate, durationWeeks, feeCents] = await Promise.all([
    getSetting(SettingKeys.SummerGamesStartDate),
    getSettingInt(SettingKeys.SummerGamesDurationWeeks, SummerGamesDefaults.durationWeeks),
    getSettingInt(SettingKeys.SummerGamesFeeCents, SummerGamesDefaults.feeCents),
  ]);

  return {
    startDate: startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? startDate : null,
    durationWeeks: durationWeeks > 0 ? durationWeeks : SummerGamesDefaults.durationWeeks,
    feeCents: feeCents >= 0 ? feeCents : SummerGamesDefaults.feeCents,
  };
}
