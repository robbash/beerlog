import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  await prisma.setting.upsert({
    where: { key: 'beerPriceCents' },
    update: { value: process.env.DEFAULT_BEER_PRICE_CENTS || '100' },
    create: { key: 'beerPriceCents', value: process.env.DEFAULT_BEER_PRICE_CENTS || '100' },
  });

  const email = 'admin@example.com';
  const ex = await prisma.user.findUnique({ where: { email } });

  if (!ex) {
    const passwordHash = await bcrypt.hash(
      process.env.INITIAL_ADMIN_PASSWORD || 'AdminPassword123$',
      10,
    );

    await prisma.user.create({
      data: {
        firstName: 'Hans',
        lastName: 'Smith',
        email,
        passwordHash,
        role: 'ADMIN',
        approved: true,
      },
    });
    console.log('Admin: admin@example.com / admin123');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
