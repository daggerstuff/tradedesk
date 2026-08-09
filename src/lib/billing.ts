import { queryOne } from './db';
import { getPlanLimits, type PlanId } from './plans';

export async function getUserPlan(userId: string): Promise<{ plan: PlanId; status: string }> {
  const sub = await queryOne<{ plan: string; status: string }>(
    'SELECT plan, status FROM subscriptions WHERE user_id = $1',
    [userId]
  );
  return {
    plan: (sub?.plan as PlanId) ?? 'free',
    status: sub?.status ?? 'active',
  };
}

export async function checkLimit(userId: string, type: 'customers' | 'invoices' | 'jobs' | 'compliance') {
  const { plan } = await getUserPlan(userId);
  const limits = getPlanLimits(plan);

  if (type === 'customers' && limits.maxCustomers > 0) {
    const result = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM customers WHERE user_id = $1',
      [userId]
    );
    const count = Number(result?.count ?? 0);
    if (count >= limits.maxCustomers) {
      return { allowed: false, limit: limits.maxCustomers, current: count };
    }
  }

  if (type === 'invoices' && limits.maxInvoicesPerMonth > 0) {
    const result = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM invoices WHERE user_id = $1 AND created_at > date_trunc('month', NOW())",
      [userId]
    );
    const count = Number(result?.count ?? 0);
    if (count >= limits.maxInvoicesPerMonth) {
      return { allowed: false, limit: limits.maxInvoicesPerMonth, current: count };
    }
  }

  if (type === 'jobs' && limits.maxJobs > 0) {
    const result = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM jobs WHERE user_id = $1',
      [userId]
    );
    const count = Number(result?.count ?? 0);
    if (count >= limits.maxJobs) {
      return { allowed: false, limit: limits.maxJobs, current: count };
    }
  }

  return { allowed: true, limit: Infinity, current: 0 };
}

export function hasFeature(plan: string, feature: 'reminders' | 'fieldService' | 'compliance') {
  const limits = getPlanLimits(plan as PlanId);
  if (feature === 'reminders') return limits.hasReminders;
  if (feature === 'fieldService') return limits.hasFieldService;
  if (feature === 'compliance') return limits.hasCompliance;
  return false;
}
