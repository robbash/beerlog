import { prisma } from '@/lib/server/prisma';

export async function resetDatabase() {
  await prisma.paymentAllocation.deleteMany();
  await prisma.payment.deleteMany({});
  await prisma.beerLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.auditLog.deleteMany();
}
