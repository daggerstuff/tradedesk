export const PLAN_LIMITS = {
  free: {
    maxCustomers: 5,
    maxInvoicesPerMonth: 5,
    maxJobs: 5,
    maxComplianceDocs: 0,
    hasReminders: false,
    hasFieldService: false,
    hasCompliance: false,
  },
  invoice_reminders: {
    maxCustomers: 50,
    maxInvoicesPerMonth: 50,
    maxJobs: 0,
    maxComplianceDocs: 0,
    hasReminders: true,
    hasFieldService: false,
    hasCompliance: false,
  },
  field_service: {
    maxCustomers: 50,
    maxInvoicesPerMonth: 50,
    maxJobs: 100,
    maxComplianceDocs: 0,
    hasReminders: false,
    hasFieldService: true,
    hasCompliance: false,
  },
  compliance: {
    maxCustomers: 999,
    maxInvoicesPerMonth: 999,
    maxJobs: 0,
    maxComplianceDocs: 999,
    hasReminders: false,
    hasFieldService: false,
    hasCompliance: true,
  },
} as const;

export type PlanId = keyof typeof PLAN_LIMITS;

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan as PlanId] ?? PLAN_LIMITS.free;
}
