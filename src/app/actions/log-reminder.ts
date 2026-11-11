'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/server/auth';
import { isAdminOrManager } from '@/lib/server/authz';
import { dateRegex } from '@/lib/constants';
import {
  createLogReminder,
  deleteLogReminder,
  getReminderCandidates,
  markNoDrinks,
  stopLogReminder,
  type ReminderCandidate,
} from '@/lib/server/log-reminders';
import { prisma } from '@/lib/server/prisma';

const startSchema = z.object({
  date: z.string().regex(dateRegex, 'invalid'),
  label: z.string().trim().max(100).optional(),
  userIds: z.array(z.coerce.number().int().positive()).min(1, 'noSelection'),
});

export type StartReminderFormData = z.input<typeof startSchema>;

export type ReminderResult = {
  ok: boolean;
  errors?: Record<string, string[]>;
  formError?: string;
  addedCount?: number;
};

async function requirePrivileged() {
  const session = await auth();

  if (!session?.user || !isAdminOrManager(session.user)) {
    return null;
  }

  return session.user;
}

export async function loadReminderCandidates(date: string): Promise<ReminderCandidate[]> {
  const actor = await requirePrivileged();
  if (!actor) return [];

  if (!dateRegex.test(date)) return [];

  return getReminderCandidates(date);
}

export async function startLogReminder(formData: StartReminderFormData): Promise<ReminderResult> {
  const actor = await requirePrivileged();
  if (!actor) return { ok: false, formError: 'notAuthorised' };

  const parsed = startSchema.safeParse(formData);

  if (!parsed.success) {
    const { fieldErrors, formErrors } = parsed.error.flatten();
    return { ok: false, errors: fieldErrors, formError: formErrors.join(' ') };
  }

  try {
    const { addedCount } = await createLogReminder({
      date: parsed.data.date,
      label: parsed.data.label || null,
      userIds: parsed.data.userIds,
      actorId: +actor.id,
    });

    revalidatePath('/[locale]/reminders', 'page');

    return { ok: true, addedCount };
  } catch (error) {
    console.error('[startLogReminder] error:', error);
    return { ok: false, formError: 'saveFailed' };
  }
}

export async function setLogReminderActive(id: number, active: boolean): Promise<boolean> {
  const actor = await requirePrivileged();
  if (!actor) return false;

  try {
    if (active) {
      await prisma.logReminder.update({ where: { id }, data: { active: true } });
    } else {
      await stopLogReminder(id);
    }

    revalidatePath('/[locale]/reminders', 'page');
    return true;
  } catch (error) {
    console.error('[setLogReminderActive] error:', error);
    return false;
  }
}

export async function removeLogReminder(id: number): Promise<boolean> {
  const actor = await requirePrivileged();
  if (!actor) return false;

  try {
    await deleteLogReminder(id);
    revalidatePath('/[locale]/reminders', 'page');
    return true;
  } catch (error) {
    console.error('[removeLogReminder] error:', error);
    return false;
  }
}

/**
 * Public, token-authenticated: the recipient of a nag mail declares they had
 * nothing to drink. Deliberately no session required so the link works from
 * any mail client.
 */
export async function confirmNoDrinks(token: string): Promise<{ ok: boolean; date?: string }> {
  if (!/^[a-f0-9]{64}$/.test(token)) return { ok: false };

  const result = await markNoDrinks(token);

  return result.ok ? { ok: true, date: result.date } : { ok: false };
}
