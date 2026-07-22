'use server';

import { auth } from '@/lib/server/auth';
import { Roles } from '@/lib/constants';
import { prisma } from '@/lib/server/prisma';
import { getSummerGamesState } from '@/lib/server/summer-games';
import {
  currentIsoYearWeek,
  dateIsInIsoWeek,
  isoWeekDateRange,
  toDateString,
} from '@/lib/shared/summer-games';
import { z } from 'zod';
import { dateRegex } from '@/lib/constants';

const participationSchema = z.object({
  userId: z.coerce.number().int().positive().optional(),
  isoYear: z.coerce.number().int().optional(),
  isoWeek: z.coerce.number().int().min(1).max(53).optional(),
  sessionDate: z.string().regex(dateRegex).optional(),
});

export type ParticipationFormData = z.input<typeof participationSchema>;

export type ParticipationResult = {
  ok: boolean;
  errors?: Record<string, string[]>;
  formError?: string;
  values?: ParticipationFormData;
  participationId?: number;
};

/**
 * Log a user's participation in a Summer Games session for a given ISO week.
 *
 * Rules:
 * - Only allowed while today is within the configured Summer Games period.
 * - Regular users can only log for themselves in the current ISO week.
 * - Managers/Admins can log for any user and can backfill any ISO week that
 *   falls within the period.
 * - The first participant of a given ISO week sets the session date (must fall
 *   inside that ISO week). Subsequent participants cannot change the date.
 * - Only one participation per (session, user); attempting again is a no-op
 *   returning ok=true (idempotent-friendly).
 * - A shadow BeerLog is created carrying the current fee snapshot so that
 *   payments, balance and FIFO allocation Just Work.
 */
export async function logParticipation(
  formData: ParticipationFormData,
): Promise<ParticipationResult> {
  const session = await auth();

  if (!session) {
    return { ok: false, errors: { '401': ['not authorized'] } };
  }

  const parsed = participationSchema.safeParse(formData);
  if (!parsed.success) {
    const { fieldErrors, formErrors } = parsed.error.flatten();
    return {
      ok: false,
      errors: fieldErrors,
      formError: formErrors.join(' '),
      values: formData,
    };
  }

  const actor = session.user!;
  const isPrivileged = actor.role !== Roles.User;

  // State check: must be inside the configured period
  const state = await getSummerGamesState();
  if (!state.isActive || !state.period) {
    return { ok: false, formError: 'notActive' };
  }

  // Resolve target user
  const targetUserId =
    !isPrivileged || !parsed.data.userId ? +actor.id : parsed.data.userId;

  if (!isPrivileged && parsed.data.userId && parsed.data.userId !== +actor.id) {
    return { ok: false, formError: 'notAuthorised' };
  }

  // Resolve target ISO week
  const nowWeek = currentIsoYearWeek();
  const isoYear = parsed.data.isoYear ?? nowWeek.isoYear;
  const isoWeek = parsed.data.isoWeek ?? nowWeek.isoWeek;

  const isCurrentWeek = isoYear === nowWeek.isoYear && isoWeek === nowWeek.isoWeek;

  if (!isPrivileged && !isCurrentWeek) {
    return { ok: false, formError: 'onlyCurrentWeek' };
  }

  // The target week must fall inside the configured period
  const { start: weekStart, end: weekEnd } = isoWeekDateRange(isoYear, isoWeek);
  const periodStart = toDateString(state.period.startDate);
  const periodEnd = toDateString(state.period.endDate);
  if (weekEnd < periodStart || weekStart > periodEnd) {
    return { ok: false, formError: 'weekOutsidePeriod' };
  }

  // Resolve/validate session date
  const requestedDate = parsed.data.sessionDate;
  if (requestedDate && !dateIsInIsoWeek(requestedDate, isoYear, isoWeek)) {
    return { ok: false, errors: { sessionDate: ['notInWeek'] } };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Find or create the session for this ISO week — date is locked by the
      // first writer.
      let sgSession = await tx.summerGamesSession.findUnique({
        where: { isoYear_isoWeek: { isoYear, isoWeek } },
      });

      if (!sgSession) {
        const sessionDate =
          requestedDate ??
          (isCurrentWeek ? toDateString(new Date()) : isoWeekDateRange(isoYear, isoWeek).start);
        sgSession = await tx.summerGamesSession.create({
          data: {
            isoYear,
            isoWeek,
            sessionDate,
            createdById: +actor.id,
          },
        });
      }

      // Idempotent participation
      const existing = await tx.summerGamesParticipation.findUnique({
        where: { sessionId_userId: { sessionId: sgSession.id, userId: targetUserId } },
      });

      if (existing) {
        return { participationId: existing.id, alreadyExisted: true };
      }

      const participation = await tx.summerGamesParticipation.create({
        data: {
          sessionId: sgSession.id,
          userId: targetUserId,
          createdById: +actor.id,
        },
      });

      // Shadow BeerLog carrying the fee snapshot
      await tx.beerLog.create({
        data: {
          userId: targetUserId,
          quantity: 1,
          date: sgSession.sessionDate,
          costCentsAtTime: state.feeCents,
          summerGamesParticipationId: participation.id,
          createdById: +actor.id,
          updatedById: +actor.id,
        },
      });

      return { participationId: participation.id, alreadyExisted: false };
    });

    return { ok: true, participationId: result.participationId };
  } catch (error) {
    console.error('[logParticipation] error:', error);
    return {
      ok: false,
      formError: 'saveFailed',
      values: formData,
    };
  }
}

/**
 * Return the Summer Games session for a given ISO week, or null.
 */
export async function getSummerGamesSession(isoYear: number, isoWeek: number) {
  return prisma.summerGamesSession.findUnique({
    where: { isoYear_isoWeek: { isoYear, isoWeek } },
    include: { participations: true },
  });
}
