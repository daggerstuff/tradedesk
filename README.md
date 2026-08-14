# TradeDesk

A simple business management tool for tradespeople and small service businesses. Customers, invoices, quotes, expenses, field service, compliance tracking, and automated reminders — all in one place.

## Features

- **Dashboard** — Overview of revenue, outstanding invoices, active jobs, upcoming compliance expiries
- **Customers** — Contact management with company details
- **Invoices** — Create, send, and track invoices with online payment links
- **Quotes** — Generate and send quotes that convert to invoices
- **Field Service** — Job scheduling, status tracking, location notes
- **Expenses** — Categorize spending by job or vendor
- **Compliance** — Track license and certificate expiry dates
- **Reminders** — Automated email reminders for overdue invoices
- **Reports** — Revenue, expense, and profitability breakdowns
- **Mobile** — React Native app for on-the-go access

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL
- **Auth:** JWT sessions (bcrypt + jose)
- **Payments:** Stripe
- **Email:** Resend
- **Mobile:** Expo / React Native
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- PostgreSQL database
- Stripe account
- Resend account (for transactional email)

### Installation

```bash
# Clone the repo
git clone https://github.com/daggerstuff/tradedesk.git
cd tradedesk

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Fill in your values in .env.local

# Run the database migration
psql $DATABASE_URL < db/migration.sql

# Start dev server
pnpm run dev
```

Visit `http://localhost:3000`.

## Environment Variables

See `.env.example` for all required variables.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing session JWTs |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_*` | Stripe price IDs for each plan |
| `RESEND_API_KEY` | Resend API key for email |
| `CRON_SECRET` | Secret for authenticating cron job requests |

## Deployment

### Vercel

```bash
vercel deploy
```

Cron jobs are configured in `vercel.json`:
- Daily at 9 AM UTC — Invoice reminders
- Daily at 8 AM UTC — Compliance expiry checks

### Database Migration

After deploying, run the migration against your production database:

```bash
psql $DATABASE_URL < db/migration.sql
```

## License

MIT

## Zero-Bias Research Protocol

This project includes a framework for running 30 isolated research runs with zero bias between runs. Each run:

- Provisions a fresh E2B sandbox with internet access only
- Executes `execute-research-run.py` with a unique harness profile and research prompt
- Captures the output markdown to `.agent/internal/run-ideas/run-{N}-idea.md`
- Destroys the sandbox after each run (eliminating state carryover)

### Orchestrator CLI (`orch`)

A command-line tool at `.agent/internal/orch` (symlinked to `/home/vivi/tradedesk/orch`) for controlling the research protocol:

```
# List available prompt files
orch --list-prompts                    # Default: business-venture prompts
orch --list-prompts --prompt business.json  # From business.json
orch --list-prompts --prompt BLANK.json   # From BLANK.json ("Research a new <blank>")

# Run research runs
orch --runs N                        # Run N research runs (default: 30)
orch --runs N --prompt business.json  # With business prompts
orch --runs N --prompt BLANK.json      # With blank-topic prompts

# Dry run (no E2B sandboxes provisioned)
orch --dry-run                       # Preview default 30 runs
orch --dry-run --prompt BLANK.json   # Preview with blank-topic prompts
```

### Prompt Library

Prompt files are stored in `.agent/internal/`:

| File | Prompt Format |
|---|---|
| `research-prompts.json` | "Research a new business venture." (default, business-venture focus) |
| `business.json` | "Research a new business venture." (same as default) |
| `BLANK.json` | "Research a new <blank>" (topic-agnostic, user-editable) |

Users can create custom prompt files as `<topic>.json` under `.agent/internal/` following the same JSON structure (`"prompts"` array with `run_id` and `prompt` fields). Use `--prompt <topic>.json` with any `orch` command.

### Framework Files

- `.agent/internal/harness-profiles.json` — 30 unique skill subsets/orders/emphases
- `.agent/internal/execute-research-run.py` — Per-run LangChain executor
- `.agent/internal/orchestrate-30-runs.py` — E2B provision/run/destroy orchestrator
- `.agent/internal/test_harness.py` — Structural validation suite
- `.agent/internal/REPRODUCIBILITY_GUIDE.md` — Documentation for reusability
