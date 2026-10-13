import type { Metadata } from 'next';
import { SITE } from '@/config/site';
import type { CompanyInfo } from './company';

/** Absolute URL on this site. */
export const absoluteUrl = (path = '/'): string => new URL(path, SITE.url).toString();

interface PageMetaInput {
  title: string;
  description?: string | null;
  /** Site-relative canonical path, e.g. `/packages/premium-umrah-14-days`. */
  path: string;
  image?: string | null;
  type?: 'website' | 'article';
  noindex?: boolean;
  publishedTime?: string | null;
  modifiedTime?: string | null;
}

/** Title, description, canonical URL, Open Graph and Twitter cards in one place. */
export function buildMetadata({ title, description, path, image, type = 'website', noindex, publishedTime, modifiedTime }: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  const images = image ? [{ url: image }] : undefined; // falls back to the route-level opengraph-image
  return {
    title,
    description: description ?? undefined,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type,
      url,
      title,
      description: description ?? undefined,
      siteName: SITE.name,
      locale: 'en_PK',
      ...(images ? { images } : {}),
      ...(type === 'article' ? { publishedTime: publishedTime ?? undefined, modifiedTime: modifiedTime ?? undefined } : {}),
    },
    twitter: { card: 'summary_large_image', title, description: description ?? undefined, ...(images ? { images: [image!] } : {}) },
  };
}

/* ----------------------------- JSON-LD builders ----------------------------- */

type JsonLd = Record<string, unknown>;

export function organizationJsonLd(company: CompanyInfo): JsonLd {
  const sameAs = Object.values(company.social);
  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: company.name,
    url: absoluteUrl('/'),
    ...(company.email ? { email: company.email } : {}),
    ...(company.phone ? { telephone: company.phone } : {}),
    ...(company.address ? { address: { '@type': 'PostalAddress', streetAddress: company.address } } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteJsonLd(company: CompanyInfo): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: company.name,
    url: absoluteUrl('/'),
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${absoluteUrl('/packages')}?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((q) => ({ '@type': 'Question', name: q.question, acceptedAnswer: { '@type': 'Answer', text: q.answer } })),
  };
}

export function articleJsonLd(a: { title: string; description?: string | null; path: string; image?: string | null; published?: string | null; modified?: string | null; author?: string | null; publisher: string }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: a.title,
    ...(a.description ? { description: a.description } : {}),
    mainEntityOfPage: absoluteUrl(a.path),
    ...(a.image ? { image: a.image } : {}),
    ...(a.published ? { datePublished: a.published } : {}),
    ...(a.modified ? { dateModified: a.modified } : {}),
    author: { '@type': a.author ? 'Person' : 'Organization', name: a.author ?? a.publisher },
    publisher: { '@type': 'Organization', name: a.publisher },
  };
}

export function packageJsonLd(p: {
  name: string;
  description?: string | null;
  path: string;
  image?: string | null;
  currency: string;
  lowPrice: string | null;
  available: boolean;
  rating?: { average: number | null; count: number };
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    ...(p.description ? { description: p.description } : {}),
    ...(p.image ? { image: p.image } : {}),
    url: absoluteUrl(p.path),
    category: 'Umrah package',
    ...(p.lowPrice
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: p.currency,
            price: p.lowPrice,
            availability: p.available ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
            url: absoluteUrl(p.path),
          },
        }
      : {}),
    ...(p.rating?.average && p.rating.count > 0
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.rating.average, reviewCount: p.rating.count } }
      : {}),
  };
}

export function hotelJsonLd(h: { name: string; description?: string | null; path: string; stars: number; address?: string | null; lat?: number | null; lng?: number | null; image?: string | null }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: h.name,
    ...(h.description ? { description: h.description } : {}),
    url: absoluteUrl(h.path),
    ...(h.image ? { image: h.image } : {}),
    starRating: { '@type': 'Rating', ratingValue: h.stars },
    ...(h.address ? { address: { '@type': 'PostalAddress', streetAddress: h.address } } : {}),
    ...(h.lat != null && h.lng != null ? { geo: { '@type': 'GeoCoordinates', latitude: h.lat, longitude: h.lng } } : {}),
  };
}

/** Serialise for a <script type="application/ld+json"> tag; `<` is escaped so content can never close the tag. */
export const serializeJsonLd = (data: JsonLd | JsonLd[]): string => JSON.stringify(data).replace(/</g, '\\u003c');
