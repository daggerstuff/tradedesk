/**
 * Referral Rewards System
 * 
 * Reward Model:
 * - Referrer: 1 free month on current plan when referred user subscribes
 * - Referred: 20% off first 3 months on any paid plan
 * - Rewards stack (max 12 free months accumulated)
 * - Rewards only trigger on successful subscription payment
 */

import { query, queryOne } from '@/lib/db';
import { sendEmail, referralRewardEarnedEmail, referralSignupEmail } from '@/lib/resend';
import { sendReferralRewardPush, sendReferralWelcomePush } from '@/lib/push';

export interface ReferralReward {
  id: string;
  user_id: string;
  type: 'free_month' | 'discount_percent' | 'credit';
  value: number;           // months for free_month, percent for discount, cents for credit
  source_referral_id: string;
  status: 'pending' | 'active' | 'used' | 'expired';
  expires_at: string | null;
  created_at: string;
  applied_at: string | null;
}

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingRewards: number;
  freeMonthsEarned: number;
  freeMonthsUsed: number;
  nextReward: { type: string; value: number } | null;
}

export const REWARD_CONFIG = {
  // Referrer rewards
  REFERRER_FREE_MONTHS: 1,           // Free months per successful referral
  REFERRER_MAX_FREE_MONTHS: 12,      // Cap on accumulated free months
  
  // Referred user rewards
  REFERRED_DISCOUNT_PERCENT: 20,     // % off first payment
  REFERRED_DISCOUNT_MONTHS: 3,       // Applies to first N months
  
  // Status transitions
  REFERRAL_STATUSES: {
    SIGNED_UP: 'signed_up',           // User registered with code
    SUBSCRIBED: 'subscribed',         // User started paid subscription
    REWARDED: 'rewarded',             // Rewards distributed
  } as const,
} as const;

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  // Get all referrals by this user
  const referrals = await query<any>(
    `SELECT r.*, u.plan 
     FROM referrals r
     LEFT JOIN users u ON r.referred_id = u.id
     WHERE r.referrer_id = $1
     ORDER BY r.created_at DESC`,
    [userId]
  );
  
  // Get pending/active rewards
  const rewards = await query<ReferralReward>(
    `SELECT * FROM referral_rewards 
     WHERE user_id = $1 AND status IN ('pending', 'active')
     ORDER BY created_at DESC`,
    [userId]
  );
  
  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter(r => r.status === 'subscribed' || r.status === 'rewarded').length;
  const pendingRewards = rewards.filter(r => r.status === 'pending').length;
  
  // Calculate free months earned/used
  const freeMonthRewards = rewards.filter(r => r.type === 'free_month');
  const freeMonthsEarned = freeMonthRewards.reduce((sum, r) => sum + r.value, 0);
  const freeMonthsUsed = freeMonthRewards
    .filter(r => r.status === 'used')
    .reduce((sum, r) => sum + r.value, 0);
  
  // Next reward preview
  const nextSubscribedNotRewarded = referrals.find(
    r => r.status === 'subscribed' && !r.reward_sent
  );
  
  let nextReward: ReferralStats['nextReward'] = null;
  if (nextSubscribedNotRewarded) {
    nextReward = { type: 'free_month', value: REWARD_CONFIG.REFERRER_FREE_MONTHS };
  }
  
  return {
    totalReferrals,
    activeReferrals,
    pendingRewards,
    freeMonthsEarned,
    freeMonthsUsed,
    nextReward,
  };
}

export async function processReferralReward(referralId: string): Promise<void> {
  // Get referral details with email/name for notifications
  const referral = await queryOne<any>(
    `SELECT r.*, u.email as referrer_email, u.name as referrer_name, u.plan as referrer_plan,
            u2.email as referred_email, u2.name as referred_name, u2.plan as referred_plan
     FROM referrals r
     JOIN users u ON r.referrer_id = u.id
     LEFT JOIN users u2 ON r.referred_id = u2.id
     WHERE r.id = $1`,
    [referralId]
  );
  
  if (!referral || referral.reward_sent) return;
  
  // Only reward on subscription (not just signup)
  if (referral.status !== 'subscribed') return;
  
  try {
    // 1. Create reward for referrer (free month)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year expiry
    
    await query(
      `INSERT INTO referral_rewards (user_id, type, value, source_referral_id, status, expires_at)
       VALUES ($1, 'free_month', $2, $3, 'pending', $4)`,
      [referral.referrer_id, REWARD_CONFIG.REFERRER_FREE_MONTHS, referralId, expiresAt.toISOString()]
    );
    
    // 2. Create discount reward for referred user
    if (referral.referred_id) {
      const discountExpires = new Date();
      discountExpires.setMonth(discountExpires.getMonth() + REWARD_CONFIG.REFERRED_DISCOUNT_MONTHS);
      
      await query(
        `INSERT INTO referral_rewards (user_id, type, value, source_referral_id, status, expires_at)
         VALUES ($1, 'discount_percent', $2, $3, 'active', $4)`,
        [referral.referred_id, REWARD_CONFIG.REFERRED_DISCOUNT_PERCENT, referralId, discountExpires.toISOString()]
      );
    }
    
    // 3. Mark referral as rewarded
    await query(
      `UPDATE referrals SET reward_sent = true, status = 'rewarded' WHERE id = $1`,
      [referralId]
    );

    // 4. Send notifications
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://tradedesk.app'}/dashboard/referrals`;

    // Referrer gets reward earned notification
    if (referral.referrer_email && referral.referred_name) {
      try {
        await sendEmail({
          to: referral.referrer_email,
          subject: `🎁 You earned ${REWARD_CONFIG.REFERRER_FREE_MONTHS} free month${REWARD_CONFIG.REFERRER_FREE_MONTHS > 1 ? 's' : ''}!`,
          html: referralRewardEarnedEmail(
            referral.referrer_name || 'there',
            referral.referred_name,
            REWARD_CONFIG.REFERRER_FREE_MONTHS,
            REWARD_CONFIG.REFERRED_DISCOUNT_PERCENT,
            dashboardUrl
          ),
        });
      } catch (e) {
        console.error('[referral] Failed to send reward email:', e);
      }

      // Push notification for referrer
      try {
        await sendReferralRewardPush(referral.referrer_id, referral.referred_name, REWARD_CONFIG.REFERRER_FREE_MONTHS);
      } catch (e) {
        console.error('[referral] Failed to send reward push:', e);
      }
    }

    // Referred user gets welcome discount notification
    if (referral.referred_email && referral.referrer_name) {
      const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://tradedesk.app'}/signup?ref=${referral.referral_code}`;
      
      try {
        await sendEmail({
          to: referral.referred_email,
          subject: `🎉 ${referral.referrer_name} sent you ${REWARD_CONFIG.REFERRED_DISCOUNT_PERCENT}% off!`,
          html: referralSignupEmail(
            referral.referred_name || 'there',
            referral.referrer_name,
            REWARD_CONFIG.REFERRED_DISCOUNT_PERCENT,
            signupUrl
          ),
        });
      } catch (e) {
        console.error('[referral] Failed to send welcome email:', e);
      }

      // Push notification for referred user
      try {
        await sendReferralWelcomePush(referral.referred_id, referral.referrer_name, REWARD_CONFIG.REFERRED_DISCOUNT_PERCENT);
      } catch (e) {
        console.error('[referral] Failed to send welcome push:', e);
      }
    }
  } catch (e) {
    throw e;
  }
}

export async function applyReferralRewards(userId: string, invoiceAmount: number): Promise<{
  discountedAmount: number;
  freeMonthsApplied: number;
  rewardsUsed: string[];
}> {
  try {
    let discountedAmount = invoiceAmount;
    let freeMonthsApplied = 0;
    const rewardsUsed: string[] = [];
    
    // Get active discount rewards
    const discountRewards = await query<ReferralReward>(
      `SELECT * FROM referral_rewards 
       WHERE user_id = $1 AND type = 'discount_percent' AND status = 'active' 
       AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY created_at ASC`,
      [userId]
    );
    
    // Apply discounts (max one discount per invoice)
    if (discountRewards.length > 0) {
      const discount = discountRewards[0];
      const discountAmount = Math.round(invoiceAmount * (discount.value / 100));
      discountedAmount = invoiceAmount - discountAmount;
      
      // Mark discount as used if it was for first N months
      await query(
        `UPDATE referral_rewards SET status = 'used', applied_at = NOW() WHERE id = $1`,
        [discount.id]
      );
      rewardsUsed.push(discount.id);
    }
    
    // Note: Free months are applied at subscription renewal time, not per invoice
    // This function just calculates the discount for the current invoice
    
    return { discountedAmount, freeMonthsApplied, rewardsUsed };
  } catch (e) {
    throw e;
  }
}

export async function applyFreeMonthsAtRenewal(userId: string): Promise<number> {
  // Call this when processing subscription renewal
  // Returns number of free months applied
  try {
    const rewards = await query<ReferralReward>(
      `SELECT * FROM referral_rewards 
       WHERE user_id = $1 AND type = 'free_month' AND status IN ('pending', 'active')
       ORDER BY created_at ASC`,
      [userId]
    );
    
    if (rewards.length === 0) {
      return 0;
    }
    
    // Apply oldest pending reward
    const reward = rewards[0];
    await query(
      `UPDATE referral_rewards SET status = 'used', applied_at = NOW() WHERE id = $1`,
      [reward.id]
    );
    
    // If reward was pending, activate it first
    if (reward.status === 'pending') {
      await query(
        `UPDATE referral_rewards SET status = 'active' WHERE id = $1`,
        [reward.id]
      );
    }
    
    return reward.value;
  } catch (e) {
    throw e;
  }
}

export async function checkAndProcessReferralRewards(userId: string): Promise<void> {
  // Check for any referrals that should be rewarded (user just subscribed)
  const unsubscribedReferrals = await query<any>(
    `SELECT r.id FROM referrals r
     JOIN users u ON r.referred_id = u.id
     WHERE r.referrer_id = $1 
     AND r.status = 'subscribed'
     AND r.reward_sent = false`,
    [userId]
  );
  
  for (const ref of unsubscribedReferrals) {
    await processReferralReward(ref.id);
  }
}