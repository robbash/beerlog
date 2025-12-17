import { prisma } from './prisma';

export async function getBeerPriceCents() {
  const s = await prisma.setting.findUnique({ where: { key: 'beerPriceCents' } });

  return s ? parseInt(s.value || '100', 10) : 100;
}

export async function setBeerPriceCents(v: number) {
  await prisma.setting.upsert({
    where: { key: 'beerPriceCents' },
    update: { value: String(v) },
    create: { key: 'beerPriceCents', value: String(v) },
  });
}
