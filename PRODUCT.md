# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary:** Independent tradespeople and small field-service business owners (electricians, plumbers, HVAC techs, landscapers, handymen, general contractors) — 1–10 person crews who run jobs in the field and manage their own office work.

**Situation:** They're on job sites, in trucks, between appointments. They invoice from the field, chase payments at night, track license renewals on spreadsheets, and lose money on missed deadlines or forgotten line items.

**Job to be done:** "Run the business side without it becoming a second full-time job." They need to send professional invoices, get paid faster, never miss a compliance deadline, and track jobs — all from their phone.

## Product Purpose

TradeDesk is a modular business management tool built specifically for trades. It replaces bloated $300/mo all-in-one platforms with pick-and-choose modules ($15–49/mo each) that work independently or together. Core modules: Invoice Reminders, Compliance Tracking, Field Service (quotes, jobs, scheduling). 

Success = a tradesperson sends an invoice from the job site before pulling out of the driveway, gets paid in 16 days instead of 45, and never misses a license renewal again.

## Positioning

The only trade-specific tool that lets you pay for exactly what you use — no forced bundles, no per-seat pricing, no enterprise bloat. Competitors (Jobber, Housecall Pro, ServiceTitan) charge $100–500/mo for features solo trades don't need. TradeDesk's mechanism: modular pricing + mobile-first PWA + trade-specific workflows (not generic SMB CRM).

## Operating Context

- **Work environments:** Job sites, trucks, home offices, supply houses. Often one-handed, gloved, in bright sun or dim crawlspaces.
- **Tools:** Smartphone (primary), tablet (secondary), laptop (office admin). PWA installable — no App Store friction.
- **Workflows:** Quote → Job → Invoice → Payment → Compliance doc tracking. Recurring maintenance contracts. Material markup tracking.
- **Documents:** Invoices, quotes, compliance certificates (licenses, insurance, certifications), expense receipts, job photos.
- **Rituals:** Morning job review, on-site quote creation, end-of-day invoicing, monthly compliance check, quarterly tax prep.

## Capabilities and Constraints

**Confirmed modules:**
- Invoice Reminders ($19/mo): Customer management, invoice tracking, automated email/push reminders, Stripe payments, payment dashboard
- Compliance Tracking ($49/mo): Document upload, AI expiry extraction, 30-day alerts, per-customer tracking
- Field Service ($15/mo): Mobile PWA, quote-to-invoice conversion, job scheduling, customer history, photo docs

**Technical:** Next.js 16 (App Router), PostgreSQL, JWT auth (bcrypt + jose), Stripe, Resend, Vercel. Mobile: Expo/React Native PWA.

**Constraints:** No per-seat pricing. Modules work standalone. Offline-capable PWA. Self-serve signup. No sales calls required.

**Undecided:** Team collaboration UI (partial schema exists), QuickBooks import (partial), referral rewards (in progress), AI receipt OCR (in progress).

## Brand Commitments

**Name:** TradeDesk (locked)
**Voice:** Direct, respectful of the trade, zero fluff. Speaks like a foreman, not a SaaS marketer. "Run your business for $15/mo not $300" — honest, specific, slightly rebellious.
**Assets:** No locked logo, no brand guide, no committed palette. Visual world is open for definition.
**Personality:** Competent, no-nonsense, builds trust through utility. Anti-corporate, anti-bloat.

## Evidence on Hand

**Real content:** Landing page copy, module descriptions, pricing, onboarding flow, dashboard screens, mobile screens (all implemented).
**Data:** None yet — pre-launch / early stage.
**Absences to not fabricate:** Customer logos, testimonials, case studies, revenue numbers, integration badges beyond Stripe/Resend, SOC2 badges, "trusted by X companies" claims.

## Product Principles

1. **Modular over monolithic** — Pay for what you use. Add when you need. Never force a bundle.
2. **Field-first, office-second** — Mobile PWA is the primary interface. Desktop is for admin review.
3. **Trade language, not tech language** — "Quote," "Job," "Line item," "Cert." Not "Deal," "Task," "SKU," "Asset."
4. **Honest pricing, no surprises** — Published prices. No "contact sales." No per-seat trap.
5. **Data ownership** — Export everything. No lock-in. Cancel anytime, keep your data.

## Accessibility & Inclusion

- High contrast for bright sun / dim job sites
- Large touch targets (gloved hands)
- Offline-first (spotty cell on job sites)
- Screen reader compatible for office admins who may use assistive tech
- No motion sensitivity triggers (reduced motion respected)