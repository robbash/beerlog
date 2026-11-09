import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

const DEFAULT_ADMIN_PASSWORD = 'AdminPassword123$';

async function main() {
  await prisma.setting.upsert({
    where: { key: 'beerPriceCents' },
    update: { value: process.env.DEFAULT_BEER_PRICE_CENTS || '100' },
    create: { key: 'beerPriceCents', value: process.env.DEFAULT_BEER_PRICE_CENTS || '100' },
  });

  const email = 'admin@example.com';
  const ex = await prisma.user.findUnique({ where: { email } });

  if (!ex) {
    const password = process.env.INITIAL_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
    const passwordHash = await bcrypt.hash(password, 10);

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

    // Report the password that was actually set, but never echo a custom one.
    const shown = process.env.INITIAL_ADMIN_PASSWORD
      ? 'the value of INITIAL_ADMIN_PASSWORD'
      : password;

    console.log(`Admin created: ${email} / ${shown}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
