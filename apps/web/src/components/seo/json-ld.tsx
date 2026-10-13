import { serializeJsonLd } from '@/lib/seo';

/** Structured data for search engines. Content is serialised with `<` escaped so it cannot terminate the script tag. */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
