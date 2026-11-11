import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { runDueLogReminders } from '@/lib/server/log-reminders';

export const dynamic = 'force-dynamic';

function isAuthorised(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;

  // Without a configured secret the endpoint stays shut rather than open.
  if (!secret) return false;

  const header = request.headers.get('authorization') ?? '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';

  const a = Buffer.from(provided);
  const b = Buffer.from(secret);

  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Invoked by the Kubernetes CronJob. Sends every nag that is due and
 * reschedules it; safe to call more often than the reminder interval.
 */
export async function POST(request: NextRequest) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  }

  try {
    const result = await runDueLogReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('[cron/log-reminders] error:', error);
    return NextResponse.json({ ok: false, error: 'failed' }, { status: 500 });
  }
}
