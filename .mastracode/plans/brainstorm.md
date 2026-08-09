# TradeDesk — Brainstorming & Strategy

## Context

This repo is mine. It's a trade business management SaaS already built with:
- **Modules**: Invoices, Quotes, Customers, Field Service (jobs + photos), Expenses, Reminders, Compliance Tracking, Reports
- **Auth**: JWT-based, email/password, session cookies
- **Payments**: Stripe subscriptions ($19/mo invoice reminders, $49/mo compliance, $15/mo field service) + invoice payment links
- **Mobile**: React Native/Expo app with push notifications
- **Customer Portal**: Shareable invoice links + Stripe Checkout
- **Email**: Resend for automated reminders
- **Cron**: Daily reminder + compliance checks

## Market Analysis

### Competitors
- **Jobber**: $49-$199/mo, full-featured, market leader
- **Housecall Pro**: $49-$199/mo, strong mobile app
- **ServiceTitan**: Enterprise, expensive, $300+/mo
- **FreshBooks**: $17-$60/mo, invoicing-focused, limited field service

### Gap
TradeDesk occupies the "modular, affordable" space. Buy only what you need:
- Just invoicing + reminders? $19/mo
- Need compliance tracking? Add $49/mo
- Field service? Add $15/mo
- All three? $83/mo (still cheaper than Jobber's $49 base for everything)

### Target Customer
- Solo tradespeople: plumbers, electricians, HVAC, landscapers, handymen
- Small crews (1-5 people)
- Currently using spreadsheets, paper, or nothing
- Can't justify $200/mo for Jobber but need more than a notebook

## Skills Used

1. **brainstorming** — structured design facilitation
2. **product-brainstorming** — PM thinking partner for solution ideation
3. **evaluating-startup-ideas** — Lenny's Podcast framework for validation
4. **startup-validator** — systematic market research process
5. **pricing-strategy** (NEW, installed) — Lenny's pricing strategy skill
6. **competitor-analysis** (NEW, installed) — PM competitor analysis skill

## Decision: Continue with TradeDesk

**Why not pivot**: The product is already built, functional, and addresses a real market gap. Pivoting would throw away weeks of work. The modular pricing model differentiates from competitors. Play it safe.

**Why this works**:
- Unglamorous niche (trades) = less competition from tech bros
- Low price point = easier to convert, less risk for customer
- Modular = pay only for what you need (unique positioning)
- Product already exists = zero additional build risk

**Riskiest assumption**: Tradespeople will find and sign up for a SaaS on their own. Mitigation: SEO content + trade community presence + referral incentives.

## Plan

### Day 1 (Today)
1. Create database migration SQL file (schema is inferred from queries)
2. Verify build passes cleanly
3. Deploy to Vercel
4. Polish landing page (better copy, clearer value prop)
5. Add empty state CTAs for onboarding
6. Add Vercel Analytics

### Week 1
1. Add free tier (5 customers, 5 invoices, 2 quotes — enough to taste value)
2. Improve error handling and loading states across all pages
3. Add CSV import for customers (lower friction to start)
4. Create 3 SEO blog posts targeting trade business pain points
5. Set up welcome email sequence (Resend)
6. Prepare Product Hunt listing

### Month 1
1. Launch on Product Hunt, Reddit (r/Trades, r/SmallBusiness), trade forums
2. Add team/multi-user support (basic)
3. Expand reports (tax prep export, P&L statement)
4. Content marketing: 2 blog posts/week
5. Outreach to trade Facebook groups, Discord communities
6. Target: first 5-10 paying customers ($100-$500 MRR)

### Year 1
1. **$50k+ ARR** target (~85 customers at ~$50/mo average)
2. Mobile app in App Store + Google Play
3. API for integrations (QuickBooks, Xero, Zapier)
4. White-label option for larger trade companies
5. Partner program with trade associations
6. Team features (dispatch, scheduling, multi-technician)

## Revenue Math

| Metric | Value |
|--------|-------|
| Average revenue per user | ~$35/mo (mix of modules) |
| Target month 1 | 10 customers = $350 MRR |
| Target month 3 | 30 customers = $1,050 MRR |
| Target month 6 | 50 customers = $1,750 MRR |
| Target month 12 | 85 customers = $2,975 MRR = ~$35k ARR |
| Year 1 stretch | 150 customers = $5,250 MRR = $63k ARR |

Conservative path hits $50k ARR in month 18. Stretch hits it in month 12.

## Why This Decision

1. **Product exists** — no build risk, just polish and ship
2. **Clear differentiation** — modular pricing vs all-in-one competitors
3. **Low CAC potential** — SEO content + community marketing, no paid ads needed initially
4. **Low infrastructure cost** — Vercel free tier + existing Postgres + Resend free tier
5. **Plays safe** — $19-$49/mo modules are impulse-buy territory for a tradesperson spending $200/mo on other software
6. **Unglamorous niche** — trades are underserved by tech, competition is lazy
