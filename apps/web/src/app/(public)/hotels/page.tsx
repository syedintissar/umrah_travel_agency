import Link from 'next/link';
import { BedDouble } from 'lucide-react';
import { EmptyState } from '@/components/feedback/states';
import { Container } from '@/components/layout/section';
import { cityLabel, HotelCard } from '@/components/public/cards';
import { PageHero } from '@/components/public/page-hero';
import { getHotels } from '@/lib/public-api';
import { buildMetadata } from '@/lib/seo';
import { cn } from '@/lib/utils';

export const metadata = buildMetadata({
  title: 'Hotels in Makkah and Madinah',
  description: 'Hotels near the Haram and Masjid an-Nabawi with ratings, distance, facilities, room types and nightly rates.',
  path: '/hotels',
});

type Props = { searchParams: Promise<{ city?: string; stars?: string }> };
const CITIES = ['MAKKAH', 'MADINAH'] as const;

export default async function HotelsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const city = CITIES.find((c) => c === sp.city);
  const stars = /^[3-5]$/.test(sp.stars ?? '') ? sp.stars : undefined;
  const hotels = await getHotels({ city, stars });

  const href = (c?: string, s?: string) => {
    const q = new URLSearchParams();
    if (c) q.set('city', c);
    if (s) q.set('stars', s);
    return q.size ? `/hotels?${q}` : '/hotels';
  };
  const chip = (active: boolean) => cn('rounded-full border px-4 py-2 text-sm font-medium transition-colors', active ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-accent');

  const groups = (city ? [city] : CITIES).map((c) => ({ city: c, items: hotels.filter((h) => h.city === c) })).filter((g) => g.items.length > 0);

  return (
    <>
      <PageHero eyebrow="Stay" title="Hotels in Makkah and Madinah" description="Compare ratings, walking distance to the Holy Mosques, facilities and room types." breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Hotels' }]} />
      <Container className="py-10">
        <nav aria-label="Filter hotels" className="mb-8 flex flex-wrap items-center gap-2">
          <Link href={href(undefined, stars)} className={chip(!city)} aria-current={!city ? 'true' : undefined}>All cities</Link>
          {CITIES.map((c) => <Link key={c} href={href(c, stars)} className={chip(city === c)} aria-current={city === c ? 'true' : undefined}>{cityLabel(c)}</Link>)}
          <span className="mx-2 hidden h-6 w-px bg-border sm:block" aria-hidden />
          <Link href={href(city)} className={chip(!stars)} aria-current={!stars ? 'true' : undefined}>Any rating</Link>
          {[5, 4, 3].map((n) => <Link key={n} href={href(city, String(n))} className={chip(stars === String(n))} aria-current={stars === String(n) ? 'true' : undefined}>{n}-star</Link>)}
        </nav>

        {hotels.length === 0 ? (
          <EmptyState icon={BedDouble} title="No hotels match" description="Try a different city or rating." action={<Link href="/hotels" className="font-medium text-primary underline underline-offset-4">Show all hotels</Link>} />
        ) : (
          <div className="space-y-12">
            {groups.map((g) => (
              <section key={g.city} aria-labelledby={`h-${g.city}`}>
                <h2 id={`h-${g.city}`} className="mb-5 text-2xl font-semibold sm:text-3xl">{cityLabel(g.city)}</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{g.items.map((h) => <HotelCard key={h.id} hotel={h} />)}</div>
              </section>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
