/*
  Warnings:

  - A unique constraint covering the columns `[summerGamesParticipationId]` on the table `BeerLog` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "BeerLog" ADD COLUMN     "summerGamesParticipationId" INTEGER;

-- CreateTable
CREATE TABLE "SummerGamesSession" (
    "id" SERIAL NOT NULL,
    "isoYear" INTEGER NOT NULL,
    "isoWeek" INTEGER NOT NULL,
    "sessionDate" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SummerGamesSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SummerGamesParticipation" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SummerGamesParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SummerGamesSession_isoYear_isoWeek_key" ON "SummerGamesSession"("isoYear", "isoWeek");

-- CreateIndex
CREATE UNIQUE INDEX "SummerGamesParticipation_sessionId_userId_key" ON "SummerGamesParticipation"("sessionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "BeerLog_summerGamesParticipationId_key" ON "BeerLog"("summerGamesParticipationId");

-- AddForeignKey
ALTER TABLE "BeerLog" ADD CONSTRAINT "BeerLog_summerGamesParticipationId_fkey" FOREIGN KEY ("summerGamesParticipationId") REFERENCES "SummerGamesParticipation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SummerGamesSession" ADD CONSTRAINT "SummerGamesSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SummerGamesParticipation" ADD CONSTRAINT "SummerGamesParticipation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SummerGamesSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SummerGamesParticipation" ADD CONSTRAINT "SummerGamesParticipation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SummerGamesParticipation" ADD CONSTRAINT "SummerGamesParticipation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
