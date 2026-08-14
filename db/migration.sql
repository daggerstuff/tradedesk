-- TradeDesk Database Migration
-- Run this against your PostgreSQL database to create all required tables.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT,
  company       TEXT,
  password      TEXT NOT NULL,
  push_token    TEXT,
  push_enabled  BOOLEAN DEFAULT false,
  referral_code    TEXT UNIQUE,
  qb_state         TEXT,
  qb_access_token  TEXT,
  qb_refresh_token TEXT,
  qb_realm_id      TEXT,
  qb_connected_at  TIMESTAMPTZ,
  qb_token_expires_at TIMESTAMPTZ,
  referred_by      TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions (Stripe-managed)
CREATE TABLE IF NOT EXISTS subscriptions (
  id                 TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan               TEXT NOT NULL DEFAULT 'free',
  status             TEXT NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  company_name  TEXT,
  address       TEXT,
  portal_token  TEXT UNIQUE,
  qb_customer_id TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id    TEXT REFERENCES customers(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  issue_date     DATE,
  due_date       DATE,
  subtotal       NUMERIC(12,2) DEFAULT 0,
  tax_rate       NUMERIC(5,2) DEFAULT 0,
  tax_amount     NUMERIC(12,2) DEFAULT 0,
  total          NUMERIC(12,2) DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'draft',
  notes          TEXT,
  share_token    TEXT UNIQUE,
  qb_invoice_id  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Line Item Templates (quick items)
CREATE TABLE IF NOT EXISTS line_item_templates (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity    NUMERIC(10,2) DEFAULT 1,
  unit_price  NUMERIC(12,2) DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice line items
CREATE TABLE IF NOT EXISTS invoice_items (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT,
  quantity    NUMERIC(10,2) DEFAULT 1,
  unit_price  NUMERIC(12,2) DEFAULT 0,
  total       NUMERIC(12,2) DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Payments (Stripe + manual)
CREATE TABLE IF NOT EXISTS payments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount      NUMERIC(12,2) NOT NULL,
  method      TEXT NOT NULL DEFAULT 'manual',
  date        TIMESTAMPTZ DEFAULT NOW(),
  reference   TEXT
);

-- Quotes
CREATE TABLE IF NOT EXISTS quotes (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id   TEXT REFERENCES customers(id) ON DELETE SET NULL,
  quote_number  TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft',
  issue_date    DATE,
  expiry_date   DATE,
  subtotal      NUMERIC(12,2) DEFAULT 0,
  tax_rate      NUMERIC(5,2) DEFAULT 0,
  tax_amount    NUMERIC(12,2) DEFAULT 0,
  total         NUMERIC(12,2) DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Quote line items
CREATE TABLE IF NOT EXISTS quote_items (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id    TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  description TEXT,
  quantity    NUMERIC(10,2) DEFAULT 1,
  unit_price  NUMERIC(12,2) DEFAULT 0,
  total       NUMERIC(12,2) DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs (field service)
CREATE TABLE IF NOT EXISTS jobs (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id    TEXT REFERENCES customers(id) ON DELETE SET NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  status         TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_date TIMESTAMPTZ,
  location       TEXT,
  estimate_amount NUMERIC(12,2),
  final_amount    NUMERIC(12,2),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses
-- Expense Categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  color       TEXT DEFAULT '#64748b',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category    TEXT,
  vendor      TEXT,
  amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  date        DATE,
  description TEXT,
  receipt_url TEXT,
  job_id      TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance documents
CREATE TABLE IF NOT EXISTS compliance_docs (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id  TEXT REFERENCES customers(id) ON DELETE SET NULL,
  doc_type    TEXT NOT NULL,
  doc_name    TEXT NOT NULL,
  expiry_date DATE,
  status      TEXT NOT NULL DEFAULT 'active',
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Team members (multi-user support)
CREATE TABLE IF NOT EXISTS team_members (
  id        TEXT PRIMARY KEY,
  owner_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, user_id)
);

CREATE TABLE IF NOT EXISTS team_invites (
  id        TEXT PRIMARY KEY,
  owner_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email     TEXT NOT NULL,
  role      TEXT NOT NULL DEFAULT 'member',
  token     TEXT UNIQUE NOT NULL,
  accepted  BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback
CREATE TABLE IF NOT EXISTS feedback (
  id          BIGSERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  type        TEXT NOT NULL DEFAULT 'general',
  message     TEXT NOT NULL,
  page        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Reminder templates
CREATE TABLE IF NOT EXISTS reminder_template (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  subject        TEXT,
  body           TEXT,
  days_before_due INTEGER DEFAULT 3,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Sent reminders log
CREATE TABLE IF NOT EXISTS reminders (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_id    TEXT REFERENCES invoices(id) ON DELETE CASCADE,
  template_id   TEXT REFERENCES reminder_template(id) ON DELETE SET NULL,
  type          TEXT,
  subject       TEXT,
  body          TEXT,
  sent_at       TIMESTAMPTZ DEFAULT NOW(),
  reminder_date TIMESTAMPTZ DEFAULT NOW(),
  status        TEXT NOT NULL DEFAULT 'sent',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals tracking
CREATE TABLE IF NOT EXISTS referrals (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id  TEXT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'signed_up',
  reward_sent  BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

-- Referral rewards
CREATE TABLE IF NOT EXISTS referral_rewards (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('free_month', 'discount_percent', 'credit')),
  value        NUMERIC(10,2) NOT NULL,
  source_referral_id TEXT NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'used', 'expired')),
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  applied_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_user ON referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_source ON referral_rewards(source_referral_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_invoices_user_id        ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id   ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status         ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_customers_user_id       ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id            ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status             ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_quotes_user_id          ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id       ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_user_id     ON compliance_docs(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_expiry      ON compliance_docs(expiry_date);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id   ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id      ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id  ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe   ON subscriptions(stripe_customer_id);

-- Recurring invoices
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  invoice_number_prefix TEXT NOT NULL DEFAULT 'INV',
  frequency TEXT NOT NULL DEFAULT 'monthly',
  day_of_month INTEGER NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  notes TEXT,
  last_generated DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recurring_invoice_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_invoice_id TEXT NOT NULL REFERENCES recurring_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_recurring_invoices_user_id ON recurring_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_active ON recurring_invoices(is_active);

-- Dunning / Collections settings per user
CREATE TABLE IF NOT EXISTS dunning_settings (
  id                     TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  late_fee_enabled       BOOLEAN DEFAULT false,
  late_fee_amount        NUMERIC(10,2) DEFAULT 0,
  late_fee_type          TEXT DEFAULT 'fixed' CHECK (late_fee_type IN ('fixed', 'percent')),
  grace_period_days      INTEGER DEFAULT 1,
  auto_charge_late_fee   BOOLEAN DEFAULT false,
  dunning_enabled        BOOLEAN DEFAULT true,
  max_dunning_attempts   INTEGER DEFAULT 4,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- Dunning log (every collection action taken)
CREATE TABLE IF NOT EXISTS dunning_logs (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_id   TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  attempt      INTEGER NOT NULL DEFAULT 1,
  action       TEXT NOT NULL CHECK (action IN ('reminder_email', 'late_fee_charged', 'payment_plan_offered', 'final_notice', 'escalation')),
  channel      TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'push', 'sms')),
  amount_charged NUMERIC(12,2),
  sent_at      TIMESTAMPTZ DEFAULT NOW(),
  opened       BOOLEAN DEFAULT false,
  clicked      BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Payment plans (installments for large invoices)
CREATE TABLE IF NOT EXISTS payment_plans (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_id      TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  total_amount    NUMERIC(12,2) NOT NULL,
  installment_count INTEGER NOT NULL DEFAULT 2,
  installments    JSONB NOT NULL DEFAULT '[]',
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'defaulted')),
  stripe_payment_intent_id TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add collections fields to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS dunning_status TEXT DEFAULT 'current' CHECK (dunning_status IN ('current', 'overdue_3', 'overdue_7', 'overdue_14', 'overdue_30', 'collections', 'resolved'));
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS late_fee_charged NUMERIC(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS last_dunning_sent_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS dunning_attempts INTEGER DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_plan_id TEXT REFERENCES payment_plans(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dunning_settings_user ON dunning_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_dunning_logs_user ON dunning_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_dunning_logs_invoice ON dunning_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_user ON payment_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_invoice ON payment_plans(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_dunning_status ON invoices(dunning_status);
CREATE INDEX IF NOT EXISTS idx_invoices_overdue ON invoices(due_date, status) WHERE status = 'sent';

-- Company settings (add columns to users)
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_state TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_zip TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_country TEXT DEFAULT 'US';
ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_routing TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_instructions TEXT;
