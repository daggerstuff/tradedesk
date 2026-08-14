# Final Review: 30 Research Runs — Top 3 Recommendations

**Date:** Aug 12, 2026
**Protocol:** 30 runs, ~3 min each, 3+ skills per run, amnesia between runs, separate markdown files

---

## Evaluation Criteria

| Criterion | What We Looked For |
|---|---|
| **Market & Revenue Potential** | Market size, growth rate, willingness to pay, proximity to $500–$1K MRR |
| **Competitive Gap** | How clear and defensible is the wedge? Are incumbents slow or wrong for this segment? |
| **MVP Buildability** | Can we ship a useful v1 in 1–2 weeks with Next.js + PostgreSQL + Stripe + AI APIs? |
| **Pain Intensity** | Is this a "painkiller" or a "vitamin"? Does the target user lose sleep over this? |

---

## All 30 Ideas at a Glance

| Run | Name | Category | Target | Verdict |
|---|---|---|---|---|
| 1 | EventMate | Hybrid events | SMBs/creators | Eliminated — off-target |
| 2 | ReputationMate | Reputation mgmt | SMBs | Eliminated — crowded (Birdeye/Podium) |
| 3 | MeetMate | Meeting productivity | SMB teams | Eliminated — off-target |
| 4 | FreelanceFinance | Cash flow/tax | Freelancers | Eliminated — off-target |
| 5 | SupportMate | Customer support | SMBs | Eliminated — crowded, low urgency |
| 6 | LocalSEO.ai | Local SEO | Trade SMBs | Eliminated — overlaps w/ Semrush/Birdeye |
| 7 | HireMate | Recruitment | Trade SMBs | Eliminated — lower urgency, complex |
| 8 | ContentMate | Content creation | Trade SMBs | Eliminated — vitamin not painkiller |
| 9 | PerformMate | Performance mgmt | Trade SMBs | Eliminated — low urgency, per-user cheap already |
| 10 | ExpenseMate | Expense mgmt | Trade SMBs | Eliminated — good but not urgent enough |
| 11 | WorkflowMate | Workflow automation | Trade SMBs | Eliminated — MVP too complex |
| 12 | SupportMate (v2) | Customer service | Trade SMBs | Eliminated — duplicate of Run 5 |
| 13 | HireMate (v2) | Recruitment | Trade SMBs | Eliminated — duplicate of Run 7 |
| 14 | InventoryMate | Inventory mgmt | Trade SMBs | Eliminated — lower urgency |
| 15 | ProjektMate | Project mgmt | SMBs | Eliminated — crowded (Asana/Monday) |
| 16 | FinanceMate | Financial mgmt | SMBs | Eliminated — crowded (QuickBooks) |
| 17 | HRMate | HR mgmt | SMBs | Eliminated — crowded, low urgency |
| 18 | CompliMate | Compliance | Trade SMBs | Eliminated — important but not daily pain |
| 19 | SecureMate | Cybersecurity | Trade SMBs | Eliminated — MVP too complex |
| 20 | RouteMate | Scheduling/routing | Field service | Eliminated — good but GPS routing is complex |
| 21 | **QuoteMate** | **Quote estimating** | **Trade contractors** | **✅ TOP 3 — #1** |
| 22 | CrmMate | CRM | Trade SMBs | Eliminated — crowded (HubSpot/Zoho) |
| 23 | **TimeMate** | **Time tracking** | **Field service** | **✅ TOP 3 — #3** |
| 24 | FleetMate | Fleet mgmt | Trade SMBs | Eliminated — requires hardware/telematics |
| 25 | **LeadMate** | **Lead gen/marketing** | **Trade SMBs** | **✅ TOP 3 — #2** |
| 26 | SafetyMate | Safety/OSHA | Trade SMBs | Eliminated — important but not daily pain |
| 27 | InsightMate | Business intelligence | Trade SMBs | Eliminated — needs broad connectors |
| 28 | FeedbackMate | Review mgmt | Trade SMBs | Eliminated — overlaps w/ ReputationMate |
| 29 | PartsMate | Parts/inventory | Trade SMBs | Eliminated — lower urgency |
| 30 | ContractMate | Contract/docs | Trade SMBs | Eliminated — lower urgency |

---

## Top 3 Recommendations

### #1: QuoteMate — AI Proposal/Quote Estimating for Trade Contractors
**(Run 21)**

**Problem:** Trade contractors spend hours manually building quotes. Existing tools cost $100+/user/mo or are generic. Slow/inaccurate quotes directly lose revenue.

**Solution:**
- AI-generated trade-specific quotes from job details (trade type, scope, materials, labor)
- Pre-built line-item libraries per trade (plumbing, electrical, HVAC, roofing)
- AI-suggested pricing based on job type, region, and historical data
- One-click PDF/email proposal with Stripe deposit collection
- Mobile-first: build quote on-site, send before leaving

**Key Differentiators:**
- $49/mo flat (vs. FieldEdge $100–$125/user/mo, Eano Pro $59/mo)
- Trade-specific estimation logic, not generic forms
- Quote-to-cash: estimate → proposal → deposit → job in one flow

**Scores:** Pain 10 | MVP Speed 9 | Gap 8 | Revenue 9 = **36/40**

**Why #1:** Highest pain intensity (contractors quote daily), fastest MVP path (web-first, no mobile app), clearest revenue story ("faster quotes = more wins = more money"). Existing codebase has Stripe + PostgreSQL + Next.js ready.

---

### #2: LeadMate — AI Lead Generation & Marketing Automation for Trade/Service SMBs
**(Run 25)**

**Problem:** Trade SMBs struggle with lead gen. 2-minute response converts 62% of leads, but most trade businesses take hours/days to respond while on job sites. Nothing exists between "Google Business Profile + missed calls" and "HubSpot $800/mo."

**Solution:**
- 2-minute AI auto-response to all inbound leads (web, Google, Facebook, missed calls)
- AI nurture sequences via SMS/email tailored to trade services
- Lead scoring by job type, urgency, service area
- One-click conversion to quote/job (integrates with QuoteMate)
- Dashboard: lead source ROI, response time, conversion rate

**Key Differentiators:**
- $49/mo flat, unlimited leads (vs. HubSpot $800+/mo)
- Trade-specific nurture templates and scoring
- Auto-response attacks the 62% conversion window
- Mobile-first: AI handles follow-up while owner is on job sites

**Scores:** Pain 9 | MVP Speed 7 | Gap 9 | Revenue 8 = **33/40**

**Why #2:** Enormous gap between free tools and enterprise. Clear ROI story. Resend already integrated. Slightly more complex MVP (multi-channel response) but very doable.

---

### #3: TimeMate — AI Time Tracking for Field Service/Trade
**(Run 23)**

**Problem:** Field technicians' time is 68% accurate manually vs. 91%+ automated. Inaccurate tracking directly costs money (overpaying/underbilling). Existing tools are generic — they don't understand travel time, multi-tech jobs, or certification hours.

**Solution:**
- GPS-based auto-detect job start/end at job sites
- AI categorizes time into travel, on-site, breaks, admin
- Job-costing native: every hour attributed to a job/customer
- Trade-specific: multi-tech splitting, certification hours, prevailing wage
- One-click export to payroll and invoicing

**Key Differentiators:**
- $49/mo flat, unlimited technicians (vs. Hubstaff $7/user/mo = $70/mo for 10 techs)
- GPS auto-tracking — no manual clock-in/out
- Job-costing native, not an add-on
- React Native/Expo already in the project for mobile

**Scores:** Pain 8 | MVP Speed 7 | Gap 7 | Revenue 8 = **30/40**

**Why #3:** Strong pain (payroll accuracy is daily), clear flat-price wedge. Needs mobile app (Expo already set up), adding some complexity. Natural complement to QuoteMate + LeadMate.

---

## Recommended Build Sequence

```
QuoteMate ($49/mo) → LeadMate (+$49/mo) → TimeMate (+$49/mo)
     Quotes              Leads → Quotes          Jobs → Time → Invoices
```

1. **Week 1–2: Ship QuoteMate** — web-first, no mobile needed, Stripe already integrated
2. **Week 3–4: Add LeadMate** — leads flow into quotes, Resend already integrated
3. **Week 5–6: Add TimeMate** — time tracked against jobs created by quotes

**Path to $1K MRR:** 21 customers at $49/mo = $1,029/mo. With 3 modules: 7 customers at $147/mo = $1,029/mo.

---

## Files

All 30 research idea files: `run-1-idea.md` through `run-30-idea.md`
This review: `final-review.md`
