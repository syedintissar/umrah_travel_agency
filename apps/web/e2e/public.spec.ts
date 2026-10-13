import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Public website against the real API and database (demo data loaded via `npm run db:seed:demo`).
 * Start the API first (see playwright.config.ts) or let Playwright start it.
 */

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const results = (page: Page) => page.getByRole('region', { name: 'Package results' });
const cards = (page: Page) => results(page).getByRole('heading', { level: 3 });
const unique = (tag: string) => `e2e-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

test.describe('discovery', () => {
  test('home page shows live featured packages and the hero search leads to filtered results', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Holy Cities');
    await expect(page.getByRole('heading', { name: 'Find your journey' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Premium Umrah, 14 Days/ }).first()).toBeVisible();

    const search = page.getByRole('search', { name: 'Find an Umrah package' });
    await search.getByLabel('Departure city').selectOption('Lahore');
    await search.getByRole('button', { name: 'Search packages' }).click();
    await expect(page).toHaveURL(/\/packages\?city=Lahore/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Choose your Umrah package');
    expect(await cards(page).count()).toBeGreaterThan(0);
  });

  test('filters narrow results, show removable chips, and the URL is shareable', async ({ page }) => {
    await page.goto('/packages');
    await expect(results(page).getByText('6 packages')).toBeVisible();

    const filters = page.getByRole('complementary', { name: 'Filters' });
    await filters.getByText('5-star', { exact: true }).click();
    await expect(page).toHaveURL(/stars=5/);
    await expect(results(page).getByText('2 packages match your filters')).toBeVisible();
    await expect(cards(page).filter({ hasText: 'Economy Umrah' })).toHaveCount(0);

    await filters.getByText('Flights', { exact: true }).click();
    await expect(page).toHaveURL(/services=flight/);

    // Remove a filter through its chip.
    await page.getByRole('link', { name: 'Remove filter: 5-star hotels' }).click();
    await expect(page).not.toHaveURL(/stars=/);
    await expect(page).toHaveURL(/services=flight/);

    // A shared link restores the same state.
    await page.goto('/packages?maxPrice=300000');
    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page).first()).toContainText('Economy Umrah');
  });

  test('sorting works and an impossible search shows a helpful empty state', async ({ page }) => {
    await page.goto('/packages?sort=price_desc');
    await expect(cards(page).first()).toContainText('Ramadan VIP Umrah');
    await page.goto('/packages?sort=price_asc');
    await expect(cards(page).first()).toContainText('Economy Umrah');

    await page.goto('/packages?maxPrice=1000');
    await expect(page.getByRole('heading', { name: 'No packages match your search' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Request a custom package' }).first()).toBeVisible();
  });

  test('invalid URL parameters are ignored instead of breaking the page', async ({ page }) => {
    const res = await page.goto('/packages?sort=banana&page=-4&minDays=abc&city=Karachi');
    expect(res?.status()).toBe(200);
    expect(await cards(page).count()).toBeGreaterThan(0);
  });

  test('mobile: filters open in a drawer and apply', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/packages');
    await page.getByRole('button', { name: /Filters/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Filter packages' });
    await dialog.getByText('Ziyarat', { exact: true }).click();
    await expect(page).toHaveURL(/services=ziyarat/);
    await expect(dialog).toBeHidden();
  });

  test('package detail shows itinerary, priced departures, hotels and related packages', async ({ page }) => {
    await page.goto('/packages/premium-umrah-14-days');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Premium Umrah, 14 Days');
    await expect(page.getByRole('heading', { name: 'Day-by-day itinerary' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Departure dates and prices' })).toBeVisible();
    await expect(page.getByText('Double room · per adult').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Demo Haram View Hotel' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'You may also like' })).toBeVisible();
    // Itinerary day 1 is open by default.
    await expect(page.getByText('Depart from your city and arrive in Jeddah')).toBeVisible();
  });

  test('unknown records return a real 404', async ({ request }) => {
    for (const path of ['/packages/nope', '/hotels/nope', '/blog/nope', '/umrah-guide/nope', '/ziyarat/nope', '/policies/nope']) {
      expect((await request.get(path)).status(), path).toBe(404);
    }
  });

  test('guide pages link in sequence and blog/guide URLs redirect to their canonical section', async ({ page, request }) => {
    await page.goto('/umrah-guide/ihram-guide');
    await expect(page.getByRole('link', { name: /Next/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Previous/ })).toBeVisible();
    const res = await request.get('/blog/ihram-guide', { maxRedirects: 0 });
    expect([307, 308]).toContain(res.status());
    expect(res.headers().location).toContain('/umrah-guide/ihram-guide');
  });
});

test.describe('enquiry forms (persist real leads)', () => {
  test('package enquiry: client validation, then success with a reference stored by the API', async ({ page, request }) => {
    await page.goto('/packages/premium-umrah-14-days');
    const form = page.getByRole('form', { name: 'Package enquiry form' });

    // Empty submit is rejected locally with field-level errors.
    await form.getByRole('button', { name: 'Request details' }).click();
    await expect(form.getByText('Please accept the privacy policy to continue')).toBeVisible();
    await expect(form.getByText('Please check the highlighted fields.')).toBeVisible();

    const email = unique('pkg');
    await form.getByLabel('Full name').fill('E2E Package Tester');
    await form.getByLabel('Email').fill(email);
    await form.getByLabel('Number of travelers').fill('3');
    await form.getByRole('checkbox').check();
    // Pick a departure from the select.
    await form.getByRole('combobox', { name: 'Preferred departure' }).click();
    await page.getByRole('option').nth(1).click();
    await form.getByRole('button', { name: 'Request details' }).click();

    const success = page.getByRole('heading', { name: 'Enquiry received' });
    await expect(success).toBeVisible();
    await expect(page.getByText(/Your reference is ENQ-\d{4}-\d{6}/)).toBeVisible();
    expect((await request.get(`${API}/health`)).ok()).toBe(true);
  });

  test('a departure link preselects that date in the enquiry form', async ({ page }) => {
    await page.goto('/packages/standard-umrah-12-days');
    await page.getByRole('link', { name: 'Enquire about this date' }).nth(1).click();
    await expect(page).toHaveURL(/departure=.*#enquire/);
    await expect(page.getByRole('combobox', { name: 'Preferred departure' })).not.toContainText('Select a departure');
  });

  test('contact form submits and the honeypot is invisible to people and assistive tech', async ({ page }) => {
    await page.goto('/contact');
    const form = page.getByRole('form', { name: 'Contact form' });
    // Honeypot is hidden from the accessibility tree and not keyboard-focusable.
    await expect(form.getByRole('textbox', { name: 'Website' })).toHaveCount(0);
    await expect(form.locator('input[name="website"]')).toHaveAttribute('tabindex', '-1');

    await form.getByLabel('Full name').fill('E2E Contact Tester');
    await form.getByLabel('Phone').fill('+92 300 1234567');
    await form.getByLabel('How can we help?').fill('Please tell me about February departures.');
    await form.getByRole('checkbox').check();
    await form.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByRole('heading', { name: 'Message received' })).toBeVisible();
  });

  test('custom package request submits with structured requirements', async ({ page }) => {
    await page.goto('/custom-package');
    const form = page.getByRole('form', { name: 'Customized package request form' });
    await form.getByLabel('Adults').fill('3');
    await form.getByLabel('Children (2-11)').fill('1');
    await form.getByLabel('Departure city').fill('Lahore');
    await form.getByLabel('Nights in Makkah').fill('7');
    await form.getByLabel('Anything else we should know?').fill('Travelling with elderly parents.');
    await form.getByLabel('Full name').fill('E2E Custom Tester');
    await form.getByLabel('Email').fill(unique('custom'));
    await form.getByRole('checkbox', { name: /I agree/ }).check();
    await form.getByRole('button', { name: 'Request my quotation' }).click();
    await expect(page.getByRole('heading', { name: 'Request received' })).toBeVisible();
  });

  test('infants cannot outnumber adults', async ({ page }) => {
    await page.goto('/custom-package');
    const form = page.getByRole('form', { name: 'Customized package request form' });
    await form.getByLabel('Adults').fill('1');
    await form.getByLabel('Infants (under 2)').fill('3');
    await form.getByLabel('Full name').fill('E2E Tester');
    await form.getByLabel('Email').fill(unique('inf'));
    await form.getByRole('checkbox', { name: /I agree/ }).check();
    await form.getByRole('button', { name: 'Request my quotation' }).click();
    await expect(form.getByText('Each infant needs an accompanying adult')).toBeVisible();
  });
});

test.describe('SEO', () => {
  test('package page has canonical URL, Open Graph, and Product structured data', async ({ page }) => {
    await page.goto('/packages/premium-umrah-14-days');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/packages\/premium-umrah-14-days$/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Premium Umrah/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    const docs = ld.flatMap((t) => JSON.parse(t) as object | object[]).flat() as { '@type': string; offers?: { price: string; priceCurrency: string } }[];
    const product = docs.find((d) => d['@type'] === 'Product');
    expect(product?.offers).toMatchObject({ priceCurrency: 'PKR' });
    expect(Number(product?.offers?.price)).toBeGreaterThan(0);
    expect(docs.some((d) => d['@type'] === 'BreadcrumbList')).toBe(true);
  });

  test('filtered listings are noindex and canonicalise to the main listing', async ({ page }) => {
    await page.goto('/packages?stars=5');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/packages$/);
    await page.goto('/packages');
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });

  test('FAQ page publishes FAQPage structured data', async ({ page }) => {
    await page.goto('/faq');
    const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((t) => JSON.parse(t) as { '@type': string; mainEntity?: unknown[] });
    expect(ld.find((d) => d['@type'] === 'FAQPage')?.mainEntity?.length).toBeGreaterThan(5);
  });

  test('sitemap lists published content and robots.txt points to it and hides portals', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain('/packages/premium-umrah-14-days');
    expect(sitemap).toContain('/hotels/demo-haram-view-hotel');
    expect(sitemap).toContain('/umrah-guide/ihram-guide');
    expect(sitemap).toContain('/blog/best-time-to-perform-umrah');
    expect(sitemap).toContain('/policies/terms');
    expect(sitemap).not.toContain('e2e-');
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toMatch(/Sitemap: .*\/sitemap\.xml/);
    expect(robots).toMatch(/Disallow: \/admin/);
    expect(robots).toMatch(/Disallow: \/account/);
  });

  test('every public page has exactly one h1 and a title', async ({ page }) => {
    test.setTimeout(240_000);
    for (const path of ['/', '/packages', '/packages/premium-umrah-14-days', '/hotels', '/hotels/demo-haram-view-hotel', '/transportation', '/ziyarat', '/umrah-guide', '/blog', '/faq', '/about', '/contact', '/custom-package', '/visa-information', '/policies/terms']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 }), path).toHaveCount(1);
      expect((await page.title()).length, path).toBeGreaterThan(5);
    }
  });
});

const PUBLIC_ROUTES = [
  '/', '/packages', '/packages/premium-umrah-14-days', '/hotels', '/hotels/demo-haram-view-hotel', '/transportation', '/ziyarat',
  '/ziyarat/masjid-quba', '/umrah-guide', '/umrah-guide/ihram-guide', '/blog', '/blog/best-time-to-perform-umrah', '/faq', '/about',
  '/contact', '/custom-package', '/visa-information', '/policies/terms',
];

test.describe('accessibility and responsive layout', () => {
  for (const scheme of ['light', 'dark'] as const) {
    for (const route of PUBLIC_ROUTES) {
      test(`axe: ${route} (${scheme})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(route);
        await page.evaluate((s) => document.documentElement.classList.toggle('dark', s === 'dark'), scheme);
        const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        const blocking = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
        expect(blocking.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
      });
    }
  }

  for (const vp of [{ n: 'mobile', w: 390, h: 844 }, { n: 'tablet', w: 820, h: 1180 }, { n: 'desktop', w: 1440, h: 900 }]) {
    test(`no horizontal overflow on any public page @ ${vp.n}`, async ({ page }) => {
      test.setTimeout(300_000);
      await page.setViewportSize({ width: vp.w, height: vp.h });
      for (const route of PUBLIC_ROUTES) {
        await page.goto(route);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, route).toBeLessThanOrEqual(1);
      }
    });
  }
});
