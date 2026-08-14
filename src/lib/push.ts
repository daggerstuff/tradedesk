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

export async function sendReferralRewardPush(
  userId: string,
  refereeName: string,
  rewardMonths: number
): Promise<void> {
  await sendPushNotification(
    userId,
    '🎁 Referral Reward Earned!',
    `${refereeName} subscribed — you earned ${rewardMonths} free month${rewardMonths > 1 ? 's' : ''}!`,
    { type: 'referral_reward', refereeName, rewardMonths }
  );
}

export async function sendReferralSignupPush(
  userId: string,
  refereeName: string
): Promise<void> {
  await sendPushNotification(
    userId,
    '👋 New Referral Signup',
    `${refereeName} just signed up with your code! You'll earn a free month when they subscribe.`,
    { type: 'referral_signup', refereeName }
  );
}

export async function sendReferralWelcomePush(
  userId: string,
  referrerName: string,
  discountPercent: number
): Promise<void> {
  await sendPushNotification(
    userId,
    '🎉 Welcome to TradeDesk!',
    `${referrerName} sent you ${discountPercent}% off your first 3 months. Tap to claim!`,
    { type: 'referral_welcome', referrerName, discountPercent }
  );
}

export async function sendInvoicePaidPush(
  userId: string,
  invoiceNumber: string,
  amount: number
): Promise<void> {
  await sendPushNotification(
    userId,
    '💰 Invoice Paid!',
    `Invoice ${invoiceNumber} — $${amount.toFixed(0)} received. Nice.`,
    { type: 'invoice_paid', invoiceNumber, amount }
  );
}

export async function sendJobAssignedPush(
  userId: string,
  jobTitle: string,
  scheduledDate: string | null
): Promise<void> {
  const when = scheduledDate ? ` Scheduled ${scheduledDate}.` : '';
  await sendPushNotification(
    userId,
    '🔧 New Job Assigned',
    `"${jobTitle}"${when}`,
    { type: 'job_assigned', jobTitle, scheduledDate }
  );
}

export async function sendComplianceExpiringPush(
  userId: string,
  docName: string,
  daysLeft: number
): Promise<void> {
  await sendPushNotification(
    userId,
    '⚠️ Compliance Expiring',
    `"${docName}" expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Renew now.`,
    { type: 'compliance_expiring', docName, daysLeft }
  );
}
