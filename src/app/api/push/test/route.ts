import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sendPushNotification } from '@/lib/push';
import { unauthorized } from '@/lib/api-errors';

/**
 * Send a test push notification to verify setup.
 */
export async function POST() {
  const session = await getSession();
  if (!session) return unauthorized();

  await sendPushNotification(
    session.userId,
    'Test Notification',
    'Your push notifications are working!',
    { type: 'test' }
  );

  return NextResponse.json({ ok: true });
}
