/*
  Warnings:

  - A unique constraint covering the columns `[userId,date]` on the table `BeerLog` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "BeerLog_userId_date_key" ON "BeerLog"("userId", "date");
