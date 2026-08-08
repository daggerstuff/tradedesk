import { queryOne } from './db';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

/**
 * Send a push notification to a user via Expo Push API.
 * Looks up the user's push_token and push_enabled flag.
 * Returns silently if user has no token or push disabled.
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const user = await queryOne<{ push_token: string | null; push_enabled: boolean }>(
    'SELECT push_token, push_enabled FROM users WHERE id = $1',
    [userId]
  );

  if (!user?.push_token || !user.push_enabled) {
    return; // No token or push disabled — skip silently
  }

  const message = {
    to: user.push_token,
    title,
    body,
    data: data || {},
    sound: 'default',
    priority: 'high' as const,
  };

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const tickets: PushTicket[] = await res.json();
    if (tickets[0]?.status === 'error') {
      console.error('[push] send failed:', tickets[0].message);
    }
  } catch (err) {
    console.error('[push] send error:', err);
  }
}
