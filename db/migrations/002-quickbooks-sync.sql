-- QuickBooks Sync: add missing columns for invoice sync and token refresh

-- Token expiry tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS qb_token_expires_at TIMESTAMPTZ;

-- Customer → QB mapping
ALTER TABLE customers ADD COLUMN IF NOT EXISTS qb_customer_id TEXT;

-- Invoice → QB mapping
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS qb_invoice_id TEXT;
