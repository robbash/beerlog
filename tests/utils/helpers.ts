import { prisma } from '@/lib/server/prisma';

export async function resetDatabase() {
  await prisma.logReminderTarget.deleteMany();
  await prisma.logReminder.deleteMany();
  await prisma.paymentAllocation.deleteMany();
  await prisma.payment.deleteMany({});
  await prisma.beerLog.deleteMany();
  await prisma.summerGamesParticipation.deleteMany();
  await prisma.summerGamesSession.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.systemLog.deleteMany();
}
