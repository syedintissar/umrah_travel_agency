import type { MetadataRoute } from 'next';
import { ApiError } from '@/lib/api';
import { getSitemap } from '@/lib/public-api';
import { absoluteUrl } from '@/lib/seo';

// Built from the API on request (and cached), so it never lists unpublished content.
export const dynamic = 'force-dynamic';

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/packages', priority: 0.9, changeFrequency: 'daily' },
  { path: '/hotels', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/transportation', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/ziyarat', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/umrah-guide', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/blog', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/faq', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/custom-package', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.6, changeFrequency: 'yearly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({ url: absoluteUrl(r.path), changeFrequency: r.changeFrequency, priority: r.priority }));
  try {
    const s = await getSitemap();
    const dated = (path: string, updatedAt: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']) => ({
      url: absoluteUrl(path),
      lastModified: new Date(updatedAt),
      priority,
      changeFrequency,
    });
    // `about` and `visa-information` are fixed routes; other CMS pages are policies.
    const fixed = new Set(['about', 'visa-information']);
    entries.push(
      ...s.packages.map((p) => dated(`/packages/${p.slug}`, p.updatedAt, 0.8, 'weekly')),
      ...s.hotels.map((h) => dated(`/hotels/${h.slug}`, h.updatedAt, 0.6, 'monthly')),
      ...s.ziyarat.map((z) => dated(`/ziyarat/${z.slug}`, z.updatedAt, 0.5, 'monthly')),
      ...s.posts.map((p) => dated(p.type === 'GUIDE' ? `/umrah-guide/${p.slug}` : `/blog/${p.slug}`, p.updatedAt, p.type === 'GUIDE' ? 0.7 : 0.5, 'monthly')),
      ...s.pages.map((p) => dated(fixed.has(p.slug) ? `/${p.slug}` : `/policies/${p.slug}`, p.updatedAt, fixed.has(p.slug) ? 0.6 : 0.3, 'yearly')),
    );
  } catch (e) {
    // If the API is down we still serve the static routes rather than failing the sitemap.
    if (!(e instanceof ApiError)) throw e;
  }
  return entries;
}
