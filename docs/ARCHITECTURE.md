# Architecture & Data Model

## Monorepo (npm workspaces)

| Path | Purpose |
|---|---|
| `apps/web` | Next.js 16 (App Router, RSC) + Tailwind 4 + shadcn/ui. Public site, customer portal (`/account`), staff portal (`/admin`). |
| `apps/api` | NestJS 12 REST API (`/api/v1`). Prisma 7 + PostgreSQL. BullMQ workers (Phase 8). |
| `packages/shared` | Code-defined RBAC (roles, permissions, matrix) and booking workflow rules shared by API + UI. |

Pinned toolchain: Node ≥22.12, TypeScript 6.0 (ts-jest doesn't support TS 7 yet), Prisma 7.10 (8.x is still RC).
NestJS 12 is ESM-only. The API compiles to CommonJS and loads Nest through Node's `require(esm)`; Jest runs with `--experimental-vm-modules`.

## Frontend structure (`apps/web/src`)

`app/(public)` marketing site · `app/(customer)/account` customer portal · `app/(admin)/admin` staff portal · `app/(dev)/design-system` component gallery (not served in production). `components/ui` is shadcn; `components/{brand,layout,commerce,data,feedback,forms,motion}` are product components; `config/site.ts` holds navigation (admin items carry a permission key and are filtered against the signed-in role). `lib/status.ts` is the single mapping from every status enum to a label and tone. Server components can't pass icon components to client components, so the portal shell selects its own nav by `variant`.

## Public website & CMS (Phase 3)

**Data flow.** Next.js Server Components call the NestJS public API (`/api/v1/public/*`, read-only, published records only) through `apps/web/src/lib/api.ts`. Responses use Next's data cache (`revalidate: 60`, tagged) and the API adds `Cache-Control: s-maxage=60, stale-while-revalidate=300` for a CDN. Pages render on request, so `next build` does not need the API. SSR requests carry `x-internal-key` to bypass per-IP throttling (all pages would otherwise share the web server's IP).

**Contracts.** Response shapes (`public-api.ts`), filter/search query, lead-form schemas and the CMS block schema live in `@umrah/shared`, so the API validates and the browser pre-validates with the same zod schemas.

**Search.** `/packages` is URL-driven (shareable, crawlable): departure city, travel month/dates (open, bookable departures only), price, duration, hotel stars, tier, category, services, free text, sort, pagination. Filtered views are `noindex` and canonicalise to `/packages`. `Package.startingPrice` is denormalised; `refreshStartingPrice()` must run whenever departures or prices change.

**CMS content model.** Pages and posts store `{ version: 1, blocks: [...] }` (heading, paragraph, list, callout, image, steps, table, quote, cta, faq, divider). There is no raw-HTML path: text supports `**bold**`, `*italic*` and `[label](href)`, links are limited to site paths, https, mailto and tel, and the renderer builds React elements. Scheduled posts (`publishedAt` in the future) stay hidden until due. Policies (`PageType.POLICY`), About, Visa information, guides and blog are all CMS-driven; the admin editor arrives in Phase 6.

**Lead capture.** Contact, package enquiry and custom-package forms POST directly to the API: strict per-IP throttle (5/min), honeypot + minimum fill time (bots are dropped silently), de-duplication within 10 minutes, consent timestamp, UTM capture, human-readable reference (`ENQ-YYYY-NNNNNN`, atomic Postgres sequence) and automatic linking to an existing customer by email/phone. Success is only shown after the lead is stored.

**SEO.** Per-page title/description/canonical/Open Graph, JSON-LD (TravelAgency, WebSite, Product with Offer, Hotel, BlogPosting, FAQPage, BreadcrumbList), `sitemap.xml` built from published content, `robots.txt`, branded default OG image, real 404 status codes. Analytics and consent management are Phase 8.

**Demo data.** `npm run db:seed:demo` loads clearly-labelled sample hotels, packages, departures, ziyarat, guides, blog posts and FAQs. It refuses to run in production and never creates customers, bookings, payments, reviews or accreditations. Replace it through the admin CMS.

## Backend modules (planned, one Nest module per bounded context)

`auth` (JWT access 15m + rotating refresh sessions, argon2id, TOTP 2FA for staff) · `rbac` (permission guard reading `@umrah/shared`) · `catalog` (packages, departures, hotels, transport, ziyarat) · `bookings` (state machine in `packages/shared/booking-workflow.ts`) · `customers`/`travelers` · `payments` (gateway adapter interface + `manual` provider, webhook idempotency) · `invoices` · `documents` (private S3, presigned PUT/GET, audit every access) · `visas` · `crm` (leads, custom requests, quotations, follow-ups, notes) · `reviews` · `cms` (pages, posts/guides, FAQs, media) · `notifications` (email: SES/Resend; WhatsApp Cloud API; in-app; queued via BullMQ) · `automation` (rules → delayed jobs) · `reports` · `settings` · `audit`.

## Security baseline

- Passport and CNIC numbers are AES-256-GCM encrypted (`common/crypto/field-encryption.ts`). Each also gets an HMAC hash so duplicates can be found without decrypting.
- Private files stay in a private S3 bucket and are served only through short-lived presigned URLs, after ownership or permission checks.
- `AuditLog` is append-only, enforced by a DB trigger.
- DB CHECK constraints guard star ratings, seat inventory, positive amounts, passenger counts, and lowercase emails.
- Env is validated at boot (zod) and the app fails fast on bad config. Secrets come only from env and are never stored in the `Setting` table.
- Payment success is set only by a verified gateway webhook or by finance-officer verification of offline proof.

## Data model (Prisma, `apps/api/prisma/schema/*.prisma`)

| Domain | Models |
|---|---|
| auth | User, Role, Permission, RolePermission, UserRole, Session, TwoFactorBackupCode, UserToken |
| customers | Customer (optional login), Traveler (mahram link, encrypted IDs) |
| catalog | Hotel(+Image, RoomType, RoomRate), TransportService (kind, shared/private), Ziyarat, PackageCategory, Package(+Image/Hotel/ItineraryDay/Transport/Ziyarat), PackageDeparture (seat inventory), DeparturePrice (per occupancy × adult/child/infant) |
| bookings | Booking (pricing snapshot, seat hold, wizard step), BookingRoom, BookingTraveler, BookingStatusHistory |
| payments | Payment, PaymentInstallment, Refund, PaymentWebhookEvent, Invoice, InvoiceLine |
| documents/visa | Document, VisaApplication, VisaStatusHistory |
| crm | Lead, CustomPackageRequest, Quotation(+Item, PDF), FollowUp, CrmNote, Communication, SupportRequest, Review |
| cms | MediaAsset, Page, PostCategory, Post (BLOG/GUIDE/NEWS), Faq, TeamMember, Accreditation |
| platform | NotificationTemplate, Notification, AutomationRule, AuditLog, Setting, Sequence, FunnelEvent |

### Status sets
- **Booking:** DRAFT → PENDING_PAYMENT → CONFIRMED → VISA_PROCESSING → TRAVEL_PREPARATION → COMPLETED, or CANCELLED. Wizard steps: PACKAGE, DATE, TRAVELERS, ROOMS, TRAVELER_DETAILS, DOCUMENTS, PAYMENT, CONFIRMATION.
- **Booking payment:** UNPAID, DEPOSIT_PAID, PARTIALLY_PAID, PAID, OVERDUE, REFUND_PENDING, PARTIALLY_REFUNDED, REFUNDED.
- **Payment transaction:** PENDING, PROCESSING, SUCCESSFUL, FAILED, REFUNDED, PARTIALLY_REFUNDED (proposal §9) + AWAITING_VERIFICATION (offline proof, finance verify/reconcile) and CANCELLED.
- **CRM lead (proposal §11):** NEW → CONTACTED → QUALIFIED → QUOTATION_SENT → FOLLOW_UP → NEGOTIATION → CONVERTED, plus LOST as an exit.
- **Visa:** NOT_STARTED, DOCUMENTS_PENDING, UNDER_REVIEW, READY_TO_SUBMIT, SUBMITTED, IN_PROCESS, APPROVED, ISSUED, REJECTED, CANCELLED.

## Proposal reconciliation (Umrah_Travel_Commercial_Product_Proposal.pdf, 9 pages)

Aligned in Phase 1b: CRM stages, payment statuses (+ finance verify/reconcile fields), booking lifecycle (no "in travel" state), hotel room types and rates, transport kinds and shared/private, About-page team and accreditations, communication history, quotation PDFs, customer-portal support requests, first-party funnel events, invoice / missing-document / welcome templates, inactive WhatsApp templates (Meta approval needed), missing-document automation rule, and least-privilege roles (Sales Agent has no booking write access; Booking Manager creates bookings from accepted quotations).

Proposal items scheduled for later phases: Swagger/OpenAPI docs and rate limiting (P4), Sentry + CloudWatch (P9/10), Google Analytics + Search Console, sitemap/robots/schema markup (P8), backups with PITR and a DR runbook (P9/10), dev/staging/prod environments and CI/CD (P10), Arabic/Urdu/English (listed as future scalability, so the UI uses RTL-safe logical CSS properties from Phase 2).

The proposal estimates ~20-30 core tables. The model has more because it includes join tables, history/audit tables and CMS entities.

## Remaining assumptions

1. Market is Pakistan (CNIC). Default currency PKR and timezone Asia/Karachi, both configurable in `Setting`.
2. Deposit is configured per package (percentage or fixed). Default balance due date is 30 days before departure.
3. UI language is English only for now. Templates and settings carry `locale`.
4. The payment gateway is "agency-selected" (not yet chosen). An adapter interface ships with a `manual` (bank transfer / offline) provider.
5. Only staff need 2FA ("Admin 2FA"). Customers use email verification.
6. LOST is added as a CRM exit stage, and CANCELLED / AWAITING_VERIFICATION are added to payment statuses. These go beyond the proposal's lists.
