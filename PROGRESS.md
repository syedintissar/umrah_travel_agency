# Progress

## Phase 1 — Foundation ✅ (2026-10-09)
- npm-workspaces monorepo: `apps/web` (Next 16 + Tailwind 4 + shadcn config), `apps/api` (NestJS 12 + Prisma 7), `packages/shared` (RBAC + booking workflow).
- Full DB schema: 61 models and 46 enums across 10 domain files. Initial migration adds CHECK constraints and an append-only AuditLog trigger.
- Idempotent seed: 6 roles, 98 permissions, Super Admin from env, settings, notification templates, automation rules, taxonomies.
- API foundation: zod env validation, Prisma service (pg adapter), helmet/CORS, `/api/v1/health`, field encryption util.
- Verified on Postgres 17 (embedded): migrate deploy, zero drift, seed run twice, unit tests 6/6, e2e tests 4/4, API boots, web builds.
- Docs: `docs/ARCHITECTURE.md` (modules, data model, statuses, assumptions).

## Phase 1b — Proposal reconciliation ✅ (2026-10-10)
- Read the 9-page PDF (`Downloads/Umrah_Travel_Commercial_Product_Proposal.pdf`). Schema, shared RBAC/workflow, seed and migration aligned (see `docs/ARCHITECTURE.md`). Tests: unit 6/6, e2e 5/5, zero migration drift.

## Phase 2 — Design system & layouts ✅ (2026-10-10)
- Tokens: emerald/gold/ivory palette (light + dark), Inter + Fraunces + Amiri (self-hosted, OFL), Islamic star-lattice pattern, RTL-safe logical CSS, reduced-motion support.
- shadcn/ui (new-york, 27 components) + brand variants (`gold` button, `xl` size).
- Shared components: Logo, ornaments, Section/SectionHeading, PublicShell (header w/ grouped menus + mobile sheet, footer), PortalShell (customer + admin; permission-filtered sidebar, drawer on mobile), PageHeader, EmptyState/ErrorState/SuccessState, skeletons, StatusBadge (all status enums), StatCard, DataTable, PackageCard, PriceTag, Rating, StepIndicator (8-step booking wizard), PriceSummary, FormField/PasswordInput, Reveal.
- Route groups: `(public)`, `(customer)/account`, `(admin)/admin`, dev-only `/design-system` (404 in production), global not-found/error/loading, favicon.
- Verified: Jest 9/9 (format, nav-vs-RBAC, status), Playwright 29/29 on Edge (no horizontal overflow at 390/820/1440 on 5 routes; axe WCAG 2.1 AA clean in light and dark; skip link; mobile nav; portal drawer), `tsc` clean, `next build` OK. Fixed along the way: money formatting bug, Sales Agent role was looser than the proposal, 2 contrast failures, stepper overflow at tablet width.
- Home page, `/account` and `/admin` are placeholders; `/login` and the Phase 3 public routes the header links to don't exist yet (404 until built).

## Phase 3 — Public website & CMS foundation ✅ (2026-10-13)
- **Public API** (`/api/v1/public/*`, read-only, published records only): packages (search/filters/sort/pagination/facets, details with priced departures, related), hotels (room types, nightly rates), transport, ziyarat, pages, posts/categories, FAQs, team, accreditations, reviews, settings, sitemap. Zod-validated queries, CDN cache headers, per-IP throttling with an internal-key bypass for SSR.
- **Lead capture** (`/public/leads/{contact,package-inquiry,custom-package}`): validation, honeypot + fill-time bot filter, 10-minute de-duplication, consent timestamp, UTM capture, `ENQ-YYYY-NNNNNN` references, customer matching, 5/min/IP limit. `Lead.reference` added to the schema.
- **CMS block model** in `@umrah/shared` (11 block types, safe-link rules, no raw HTML) + renderer; policies, About, Visa information, guides and blog are CMS-driven.
- **Web**: 22 route templates: home, About, packages (+URL-driven filters, mobile drawer, chips, sort, pagination), package details, hotels (+details), transportation, ziyarat (+details), visa information, Umrah guide (+sequence nav), blog, FAQ, contact, customized package, policies; plus `sitemap.xml`, `robots.txt`, branded OG image, JSON-LD (TravelAgency, WebSite, Product/Offer, Hotel, BlogPosting, FAQPage, BreadcrumbList), real 404s, WhatsApp button (when configured).
- **Demo data**: `npm run db:seed:demo` (refuses to run in production): fictional "Demo" hotels, 6 packages with departures, ziyarat, 6 guides, 2 posts, 14 FAQs, template policy pages. No fabricated reviews, customers, bookings or accreditations.
- **Verified**: API unit 38/38, API e2e (real Postgres) 27/27, web unit 11/11, Playwright on the *production build*: 57/57 public + 29/29 layout (forms through CORS to the DB, axe WCAG 2.1 AA light+dark on 18 pages, 3 viewports, SEO output, 404 statuses). `tsc` clean.
- **Bugs found and fixed by the tests**: filled honeypot returned 400 (revealed the trap), related packages empty for unique tiers, `bg-pattern` dropped by tailwind-merge (dark bands rendered pale), no-image gallery invisible, root `loading.tsx` caused soft-404 (HTTP 200), `<dl>` markup invalid, server→client render-prop 500 on `/design-system`, `ECONNRESET` on reused keep-alive sockets (API keep-alive 65 s + one GET retry), inactive-tab and muted-text contrast.
- **Headers**: public pages `s-maxage=60, stale-while-revalidate=300`; `/account`, `/admin`, `/login` `private, no-store`.

## Pending
- Phase 4: auth (JWT + rotating refresh, argon2id, admin TOTP 2FA), RBAC guards from `@umrah/shared`, audit logging service, Swagger/OpenAPI docs, Redis-backed throttler, file-upload pipeline groundwork. Then `/login` and the portal guards (header/footer already link to `/login`, which 404s until then).
- Phases 5–10 per plan.

## Blockers / open items
- `/login` (and online booking) don't exist yet: the header "Sign in" link 404s until Phase 4/5. Package pages show enquiry-only CTAs until `NEXT_PUBLIC_ONLINE_BOOKING=1`.
- Local browser tests need ~2 GB free RAM; on small machines run `PW_WORKERS=1 PW_CHANNEL=msedge npm run test:e2e -w @umrah/web` (4 cores/8 GB saturated at 3 workers).
- Docker isn't installed locally. Use `docker compose up -d` (Postgres on 5432 + Redis) or any Postgres 15+.
- Payment gateway provider still to be chosen (decision due by Phase 7).

## Run locally (Windows, no Docker needed)
```
npm install                 # once
npm run dev:db              # terminal 1: local PostgreSQL on :5432 (keep open)
npm run setup:local         # terminal 2, once: migrate + reference seed + demo data
npm run dev:api             # terminal 2: http://localhost:4000/api/v1/health
npm run dev:web             # terminal 3: http://localhost:3000
```
Design gallery: http://localhost:3000/design-system. Reset all data: stop `dev:db`, delete `.local/postgres`, start it again, run `npm run setup:local`.
Web tests: `npm test -w @umrah/web` (Jest) and `PW_CHANNEL=msedge npm run test:e2e -w @umrah/web` (Playwright; in CI run `npx playwright install chromium` and omit PW_CHANNEL).
