import path from 'node:path';
import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: path.resolve(__dirname, '../../../.env'), quiet: true });
const INTERNAL_KEY = 'e2e-internal-key-0123456789abcdef';
process.env.INTERNAL_API_KEY = INTERNAL_KEY;

import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { ENV } from '../src/config/config.module';
import { PrismaService } from '../src/prisma/prisma.service';

// Requires a migrated database seeded with reference + demo data (npm run db:seed && npm run db:seed:demo).
describe('Public API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const api = () => request(app.getHttpServer());
  /** SSR-style request: carries the internal key so it is exempt from per-IP throttling. */
  const get = (url: string) => api().get(`/api/v1${url}`).set('x-internal-key', INTERNAL_KEY);
  const post = (url: string, body: object) => api().post(`/api/v1${url}`).set('x-internal-key', INTERNAL_KEY).send(body);

  const created = { packages: [] as string[], hotels: [] as string[], posts: [] as string[], pages: [] as string[], leadEmails: [] as string[] };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app, app.get(ENV));
    await app.init();
    prisma = app.get(PrismaService);

    // Hidden records that must never appear publicly.
    const draft = await prisma.package.create({
      data: { slug: 'e2e-draft-package', title: 'E2E Draft Package', durationDays: 7, status: 'DRAFT' },
    });
    const deleted = await prisma.package.create({
      data: { slug: 'e2e-deleted-package', title: 'E2E Deleted Package', durationDays: 7, status: 'PUBLISHED', deletedAt: new Date() },
    });
    created.packages.push(draft.id, deleted.id);
    created.hotels.push((await prisma.hotel.create({ data: { slug: 'e2e-draft-hotel', name: 'E2E Draft Hotel', city: 'MAKKAH', starRating: 5, status: 'DRAFT' } })).id);
    created.posts.push(
      (await prisma.post.create({ data: { slug: 'e2e-scheduled-post', title: 'Scheduled', content: { version: 1, blocks: [] }, status: 'PUBLISHED', publishedAt: new Date(Date.now() + 7 * 86_400_000) } })).id,
      (await prisma.post.create({ data: { slug: 'e2e-draft-post', title: 'Draft', content: { version: 1, blocks: [] }, status: 'DRAFT' } })).id,
    );
    created.pages.push((await prisma.page.create({ data: { slug: 'e2e-draft-page', title: 'Draft page', content: { version: 1, blocks: [] }, status: 'DRAFT' } })).id);
  });

  afterAll(async () => {
    await prisma.lead.deleteMany({ where: { email: { in: created.leadEmails } } });
    await prisma.package.deleteMany({ where: { id: { in: created.packages } } });
    await prisma.hotel.deleteMany({ where: { id: { in: created.hotels } } });
    await prisma.post.deleteMany({ where: { id: { in: created.posts } } });
    await prisma.page.deleteMany({ where: { id: { in: created.pages } } });
    await app?.close();
  });

  describe('packages', () => {
    it('lists published packages with facets, cache headers and no hidden records', async () => {
      const res = await get('/public/packages').expect(200);
      const slugs = res.body.items.map((p: { slug: string }) => p.slug);
      expect(res.body.meta).toMatchObject({ total: 6, page: 1 });
      expect(slugs).not.toContain('e2e-draft-package');
      expect(slugs).not.toContain('e2e-deleted-package');
      expect(res.body.facets.cities).toEqual(expect.arrayContaining(['Karachi', 'Lahore', 'Islamabad']));
      expect(res.body.facets.price.min).toBeLessThan(res.body.facets.price.max);
      expect(res.headers['cache-control']).toMatch(/s-maxage=60/);
      // Featured packages come first by default.
      expect(res.body.items[0].isFeatured).toBe(true);
      // Price is a decimal string and each card has hotels + a bookable next departure.
      const premium = res.body.items.find((p: { slug: string }) => p.slug === 'premium-umrah-14-days');
      expect(premium).toMatchObject({ tier: 'PREMIUM', currency: 'PKR', flightIncluded: true });
      expect(typeof premium.startingPrice).toBe('string');
      expect(premium.makkahHotel.starRating).toBe(5);
      expect(premium.nextDepartureDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('filters by services, stars, price, duration, tier and category', async () => {
      const withFlights = await get('/public/packages?services=flight').expect(200);
      expect(withFlights.body.items.every((p: { flightIncluded: boolean }) => p.flightIncluded)).toBe(true);
      expect(withFlights.body.items.map((p: { slug: string }) => p.slug)).not.toContain('economy-umrah-10-days');

      const fiveStar = await get('/public/packages?stars=5').expect(200);
      expect(fiveStar.body.items.map((p: { slug: string }) => p.slug).sort()).toEqual(['premium-umrah-14-days', 'ramadan-vip-umrah-15-days']);

      const cheap = await get('/public/packages?maxPrice=300000').expect(200);
      expect(cheap.body.items.map((p: { slug: string }) => p.slug)).toEqual(['economy-umrah-10-days']);

      const long = await get('/public/packages?minDays=15').expect(200);
      expect(long.body.items.map((p: { slug: string }) => p.slug)).toEqual(['ramadan-vip-umrah-15-days']);

      const vip = await get('/public/packages?tier=VIP').expect(200);
      expect(vip.body.meta.total).toBe(1);

      const family = await get('/public/packages?category=family-umrah').expect(200);
      expect(family.body.items.map((p: { slug: string }) => p.slug)).toEqual(['family-umrah-12-days']);

      const search = await get('/public/packages?q=ramadan').expect(200);
      expect(search.body.items.map((p: { slug: string }) => p.slug)).toEqual(['ramadan-vip-umrah-15-days']);
    });

    it('filters by travel dates using open, bookable departures only', async () => {
      const ramadan = await get('/public/packages?from=2027-02-01&to=2027-02-28').expect(200);
      expect(ramadan.body.items.map((p: { slug: string }) => p.slug)).toContain('ramadan-vip-umrah-15-days');
      const none = await get('/public/packages?from=2031-01-01&to=2031-01-31').expect(200);
      expect(none.body.items).toEqual([]);
      expect(none.body.meta.total).toBe(0);
    });

    it('sorts and paginates', async () => {
      const asc = await get('/public/packages?sort=price_asc').expect(200);
      const prices = asc.body.items.map((p: { startingPrice: string }) => Number(p.startingPrice));
      expect(prices).toEqual([...prices].sort((a, b) => a - b));

      const soon = await get('/public/packages?sort=departure').expect(200);
      const dates = soon.body.items.map((p: { nextDepartureDate: string }) => p.nextDepartureDate);
      expect(dates).toEqual([...dates].sort());

      const page2 = await get('/public/packages?pageSize=4&page=2').expect(200);
      expect(page2.body.items).toHaveLength(2);
      expect(page2.body.meta).toMatchObject({ page: 2, pageCount: 2, total: 6 });
      // Out-of-range pages clamp instead of erroring.
      const clamped = await get('/public/packages?pageSize=4&page=99').expect(200);
      expect(clamped.body.meta.page).toBe(2);
    });

    it('rejects invalid queries with field-level errors', async () => {
      const res = await get('/public/packages?sort=cheapest&pageSize=999').expect(400);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors.map((e: { field: string }) => e.field).sort()).toEqual(['pageSize', 'sort']);
    });

    it('returns full package details with priced departures and related content', async () => {
      const res = await get('/public/packages/premium-umrah-14-days').expect(200);
      const p = res.body;
      expect(p.hotels).toHaveLength(2);
      expect(p.itinerary.length).toBe(p.durationDays);
      expect(p.itinerary.map((d: { dayNumber: number }) => d.dayNumber)).toEqual(Array.from({ length: p.durationDays }, (_, i) => i + 1));
      expect(p.departures.length).toBeGreaterThanOrEqual(3);
      const dep = p.departures[0];
      expect(dep.bookable).toBe(true);
      expect(dep.seatsLeft).toBeGreaterThan(0);
      expect(dep.prices.map((x: { occupancy: string }) => x.occupancy)).toEqual(['DOUBLE', 'TRIPLE', 'QUAD']);
      expect(Number(dep.prices[0].adultPrice)).toBeGreaterThan(Number(dep.prices[2].adultPrice));
      expect(p.transport.length).toBeGreaterThan(0);
      expect(p.ziyarat.length).toBeGreaterThan(0);
      expect(p.related.length).toBeGreaterThan(0);
      expect(p.related.map((r: { slug: string }) => r.slug)).not.toContain('premium-umrah-14-days');
      expect(p.reviews).toEqual({ summary: { average: null, count: 0 }, items: [] });
      // Starting price equals the cheapest adult price across open departures.
      const min = Math.min(...p.departures.flatMap((d: { prices: { adultPrice: string }[] }) => d.prices.map((x) => Number(x.adultPrice))));
      expect(Number(p.startingPrice)).toBe(min);
      // Internal fields never leak.
      expect(p).not.toHaveProperty('deletedAt');
      expect(p).not.toHaveProperty('status');
    });

    it('404s for unknown, draft and soft-deleted packages', async () => {
      await get('/public/packages/does-not-exist').expect(404);
      await get('/public/packages/e2e-draft-package').expect(404);
      await get('/public/packages/e2e-deleted-package').expect(404);
    });
  });

  describe('hotels, transport, ziyarat', () => {
    it('lists published hotels with room types and current nightly rates', async () => {
      const res = await get('/public/hotels').expect(200);
      expect(res.body.map((h: { slug: string }) => h.slug)).not.toContain('e2e-draft-hotel');
      expect(res.body).toHaveLength(6);
      const haram = res.body.find((h: { slug: string }) => h.slug === 'demo-haram-view-hotel');
      expect(haram.roomTypes.map((r: { occupancy: string }) => r.occupancy)).toEqual(['DOUBLE', 'TRIPLE', 'QUAD']);
      expect(Number(haram.fromPricePerNight)).toBe(45000);
      const madinah = await get('/public/hotels?city=MADINAH&stars=5').expect(200);
      expect(madinah.body.map((h: { slug: string }) => h.slug)).toEqual(['demo-nabawi-plaza']);
    });

    it('serves hotel details and 404s for drafts', async () => {
      const res = await get('/public/hotels/demo-ajyad-suites').expect(200);
      expect(res.body).toMatchObject({ starRating: 4, distanceToHaramMeters: 600, city: 'MAKKAH' });
      await get('/public/hotels/e2e-draft-hotel').expect(404);
      await get('/public/hotels?city=ATLANTIS').expect(400);
    });

    it('lists transport (shared/private, by kind) and ziyarat by city', async () => {
      const t = await get('/public/transport').expect(200);
      expect(t.body.length).toBeGreaterThanOrEqual(6);
      expect(new Set(t.body.map((x: { serviceKind: string }) => x.serviceKind))).toEqual(new Set(['AIRPORT_TRANSFER', 'INTERCITY', 'ZIYARAT_TOUR']));
      expect(t.body.some((x: { isShared: boolean }) => x.isShared)).toBe(true);
      expect(t.body.some((x: { isShared: boolean }) => !x.isShared)).toBe(true);

      const z = await get('/public/ziyarat?city=MADINAH').expect(200);
      expect(z.body.every((x: { city: string }) => x.city === 'MADINAH')).toBe(true);
      await get('/public/ziyarat/masjid-quba').expect(200);
      await get('/public/ziyarat/nope').expect(404);
    });
  });

  describe('CMS', () => {
    it('serves published pages and hides drafts', async () => {
      const about = await get('/public/pages/about').expect(200);
      expect(about.body).toMatchObject({ slug: 'about', title: 'About us' });
      expect(about.body.content.blocks.length).toBeGreaterThan(0);
      expect(about.body.seo.description).toBeTruthy();
      await get('/public/pages/e2e-draft-page').expect(404);
      await get('/public/pages/terms?type=POLICY').expect(200);
      await get('/public/pages/about?type=POLICY').expect(404);
    });

    it('lists posts by type, hides draft and scheduled posts, and serves details with related posts', async () => {
      const guides = await get('/public/posts?type=GUIDE').expect(200);
      expect(guides.body.items.length).toBe(6);
      expect(guides.body.items[0].slug).toBe('first-time-umrah-guide');
      const all = await get('/public/posts?pageSize=50').expect(200);
      const slugs = all.body.items.map((p: { slug: string }) => p.slug);
      expect(slugs).not.toContain('e2e-draft-post');
      expect(slugs).not.toContain('e2e-scheduled-post');
      await get('/public/posts/e2e-scheduled-post').expect(404);

      const post = await get('/public/posts/ihram-guide?type=GUIDE').expect(200);
      expect(post.body.readingMinutes).toBeGreaterThanOrEqual(1);
      expect(post.body.related.length).toBeGreaterThan(0);
      await get('/public/posts/ihram-guide?type=BLOG').expect(404);

      const cats = await get('/public/post-categories?type=GUIDE').expect(200);
      expect(cats.body[0]).toMatchObject({ slug: 'umrah-guide', count: 6 });
    });

    it('serves FAQs by category, public settings only, and empty team/accreditations', async () => {
      const faqs = await get('/public/faqs?category=visa').expect(200);
      expect(faqs.body.length).toBeGreaterThan(0);
      expect(faqs.body.every((f: { category: string }) => f.category === 'visa')).toBe(true);

      const settings = await get('/public/settings').expect(200);
      expect(settings.body['company.name']).toBeDefined();
      expect(Object.keys(settings.body).some((k) => k.startsWith('security.') || k.startsWith('payments.'))).toBe(false);

      expect((await get('/public/team').expect(200)).body).toEqual([]);
      expect((await get('/public/accreditations').expect(200)).body).toEqual([]);
      const reviews = await get('/public/reviews').expect(200);
      expect(reviews.body).toEqual({ summary: { average: null, count: 0 }, items: [] });
    });

    it('builds a sitemap of published content only', async () => {
      const res = await get('/public/sitemap').expect(200);
      expect(res.body.packages.map((p: { slug: string }) => p.slug)).toEqual(expect.arrayContaining(['premium-umrah-14-days']));
      expect(res.body.packages.map((p: { slug: string }) => p.slug)).not.toContain('e2e-draft-package');
      expect(res.body.hotels.map((p: { slug: string }) => p.slug)).not.toContain('e2e-draft-hotel');
      expect(res.body.posts.map((p: { slug: string }) => p.slug)).not.toContain('e2e-scheduled-post');
      expect(res.body.pages.map((p: { slug: string }) => p.slug)).not.toContain('e2e-draft-page');
    });
  });

  describe('lead forms', () => {
    const email = (n: string) => {
      const e = `e2e-${n}-${Date.now()}@example.com`;
      created.leadEmails.push(e);
      return e;
    };
    const valid = { fullName: 'E2E Tester', consent: true, message: 'I would like to know about upcoming departures.' };

    it('persists a contact enquiry with a reference and links consent', async () => {
      const e = email('contact');
      const res = await post('/public/leads/contact', { ...valid, email: e, subject: 'Question' }).expect(201);
      expect(res.body).toMatchObject({ ok: true });
      expect(res.body.reference).toMatch(/^ENQ-\d{4}-\d{6}$/);
      const lead = await prisma.lead.findFirstOrThrow({ where: { email: e } });
      expect(lead).toMatchObject({ reference: res.body.reference, source: 'CONTACT_FORM', stage: 'NEW', fullName: 'E2E Tester' });
      expect(lead.consentAt).not.toBeNull();
    });

    it('is idempotent for double submits (same contact within the window)', async () => {
      const e = email('dupe');
      const a = await post('/public/leads/contact', { ...valid, email: e }).expect(201);
      const b = await post('/public/leads/contact', { ...valid, email: e }).expect(201);
      expect(b.body.reference).toBe(a.body.reference);
      expect(await prisma.lead.count({ where: { email: e } })).toBe(1);
    });

    it('silently drops bot submissions (honeypot, instant fill) without storing them', async () => {
      const e1 = email('bot1');
      const e2 = email('bot2');
      await post('/public/leads/contact', { ...valid, email: e1, website: 'http://spam.example' }).expect(201);
      await post('/public/leads/contact', { ...valid, email: e2, formStartedAt: Date.now() }).expect(201);
      expect(await prisma.lead.count({ where: { email: { in: [e1, e2] } } })).toBe(0);
    });

    it('validates input and requires consent and a contact method', async () => {
      const noConsent = await post('/public/leads/contact', { ...valid, email: 'x@example.com', consent: false }).expect(400);
      expect(noConsent.body.errors[0].field).toBe('consent');
      await post('/public/leads/contact', { fullName: 'No Contact', consent: true, message: 'Please contact me soon.' }).expect(400);
      await post('/public/leads/contact', { ...valid, email: 'not-an-email' }).expect(400);
      await post('/public/leads/contact', { ...valid, email: 'a@example.com', message: 'short' }).expect(400);
    });

    it('records a package enquiry against the package and chosen departure', async () => {
      const pkg = await get('/public/packages/standard-umrah-12-days').expect(200);
      const departure = pkg.body.departures[1];
      const e = email('pkg');
      const res = await post('/public/leads/package-inquiry', { fullName: 'Pkg Tester', email: e, consent: true, packageSlug: 'standard-umrah-12-days', departureId: departure.id, travelersCount: 3 }).expect(201);
      const lead = await prisma.lead.findFirstOrThrow({ where: { reference: res.body.reference }, include: { interestedPackage: true } });
      expect(lead.interestedPackage?.slug).toBe('standard-umrah-12-days');
      expect(lead.travelersCount).toBe(3);
      expect(lead.preferredDepartureDate?.toISOString().slice(0, 10)).toBe(departure.departureDate);
      await post('/public/leads/package-inquiry', { fullName: 'Pkg Tester', email: email('pkg2'), consent: true, packageSlug: 'e2e-draft-package' }).expect(404);
      await post('/public/leads/package-inquiry', { fullName: 'Pkg Tester', email: email('pkg3'), consent: true, packageSlug: 'standard-umrah-12-days', departureId: '00000000-0000-4000-8000-000000000000' }).expect(404);
    });

    it('stores a custom package request with its structured requirements', async () => {
      const e = email('custom');
      const res = await post('/public/leads/custom-package', {
        fullName: 'Custom Tester', email: e, phone: '+92 300 1234567', consent: true,
        adults: 3, children: 1, infants: 1, departureCity: 'Lahore', preferredDepartureDate: '2027-03-10', flexibleDates: false,
        nightsMakkah: 7, nightsMadinah: 5, hotelStarPreference: 4, roomPreference: 'QUAD',
        needsFlights: true, needsZiyarat: true, budget: 2000000, notes: 'Travelling with elderly parents.',
      }).expect(201);
      const lead = await prisma.lead.findFirstOrThrow({ where: { reference: res.body.reference }, include: { customRequest: true } });
      expect(lead).toMatchObject({ source: 'CUSTOM_PACKAGE_REQUEST', travelersCount: 5 });
      expect(lead.customRequest).toMatchObject({ adults: 3, children: 1, infants: 1, nightsMakkah: 7, hotelStarPreference: 4, roomPreference: 'QUAD', needsFlights: true, flexibleDates: false, status: 'NEW' });
      expect(Number(lead.customRequest?.budget)).toBe(2000000);
      await post('/public/leads/custom-package', { fullName: 'X Y', email: email('c2'), consent: true, adults: 1, infants: 3 }).expect(400);
    });

    it('allocates unique, sequential references', async () => {
      const refs: string[] = [];
      for (const n of ['seq1', 'seq2', 'seq3']) refs.push((await post('/public/leads/contact', { ...valid, email: email(n) }).expect(201)).body.reference);
      const nums = refs.map((r) => Number(r.split('-')[2]));
      expect(new Set(refs).size).toBe(3);
      expect(nums[1]).toBe(nums[0]! + 1);
      expect(nums[2]).toBe(nums[1]! + 1);
    });

    it('rate limits form submissions per client IP (no internal key)', async () => {
      const results: number[] = [];
      for (let i = 0; i < 7; i++) {
        const r = await api().post('/api/v1/public/leads/contact').send({ ...valid, email: email(`rl${i}`) });
        results.push(r.status);
      }
      expect(results.slice(0, 5).every((s) => s === 201)).toBe(true);
      expect(results.slice(5)).toEqual([429, 429]);
    });
  });
});
