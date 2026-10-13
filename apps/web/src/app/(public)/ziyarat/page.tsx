import { Landmark } from 'lucide-react';
import { EmptyState } from '@/components/feedback/states';
import { Container } from '@/components/layout/section';
import { cityLabel, ZiyaratCard } from '@/components/public/cards';
import { CtaPanel } from '@/components/public/content-page';
import { PageHero } from '@/components/public/page-hero';
import { getZiyarat } from '@/lib/public-api';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Ziyarat in Makkah and Madinah',
  description: 'Historic and sacred sites to visit in Makkah and Madinah, with guided ziyarat tours.',
  path: '/ziyarat',
});

export default async function ZiyaratPage() {
  const all = await getZiyarat();
  const cities = ['MAKKAH', 'MADINAH'] as const;
  return (
    <>
      <PageHero eyebrow="Visit" title="Ziyarat" description="Sites of historical and spiritual significance in the Holy Cities. Many packages include guided ziyarat." breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Ziyarat' }]} />
      <Container className="py-10">
        {all.length === 0 ? (
          <EmptyState icon={Landmark} title="Ziyarat information is being added" description="Ask us about guided visits for your dates." />
        ) : (
          <div className="space-y-12">
            {cities.map((c) => {
              const items = all.filter((z) => z.city === c);
              if (items.length === 0) return null;
              return (
                <section key={c} aria-labelledby={`z-${c}`}>
                  <h2 id={`z-${c}`} className="mb-5 text-2xl font-semibold sm:text-3xl">{cityLabel(c)}</h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{items.map((z) => <ZiyaratCard key={z.slug} item={z} />)}</div>
                </section>
              );
            })}
          </div>
        )}
        <CtaPanel title="Add ziyarat to your journey" text="Choose a package with guided ziyarat or request a custom itinerary." href="/packages?services=ziyarat" label="See packages with ziyarat" />
      </Container>
    </>
  );
}
