-- CreateTable
CREATE TABLE "LogReminder" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "label" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogReminderTarget" (
    "id" SERIAL NOT NULL,
    "reminderId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "noDrinksAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogReminderTarget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LogReminder_date_key" ON "LogReminder"("date");

-- CreateIndex
CREATE UNIQUE INDEX "LogReminderTarget_token_key" ON "LogReminderTarget"("token");

-- CreateIndex
CREATE INDEX "LogReminderTarget_nextRunAt_idx" ON "LogReminderTarget"("nextRunAt");

-- CreateIndex
CREATE UNIQUE INDEX "LogReminderTarget_reminderId_userId_key" ON "LogReminderTarget"("reminderId", "userId");

-- AddForeignKey
ALTER TABLE "LogReminder" ADD CONSTRAINT "LogReminder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogReminderTarget" ADD CONSTRAINT "LogReminderTarget_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "LogReminder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogReminderTarget" ADD CONSTRAINT "LogReminderTarget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
