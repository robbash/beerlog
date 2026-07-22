import { prisma } from '@/lib/server/prisma';

export async function resetDatabase() {
  await prisma.paymentAllocation.deleteMany();
  await prisma.payment.deleteMany({});
  await prisma.beerLog.deleteMany();
  await prisma.summerGamesParticipation.deleteMany();
  await prisma.summerGamesSession.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();
  await prisma.auditLog.deleteMany();
}
