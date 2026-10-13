import { Container } from '@/components/layout/section';
import { TransportCard } from '@/components/public/cards';
import { CtaPanel } from '@/components/public/content-page';
import { PageHero } from '@/components/public/page-hero';
import { EmptyState } from '@/components/feedback/states';
import { getTransport } from '@/lib/public-api';
import { buildMetadata } from '@/lib/seo';
import { Bus } from 'lucide-react';

export const metadata = buildMetadata({
  title: 'Transportation for Umrah',
  description: 'Airport transfers, intercity travel between Makkah and Madinah, ziyarat tours, and private or shared vehicles.',
  path: '/transportation',
});

const KINDS: Record<string, { title: string; text: string }> = {
  AIRPORT_TRANSFER: { title: 'Airport transfers', text: 'Meet-and-greet at arrival and a direct ride to your hotel.' },
  INTERCITY: { title: 'Between Makkah and Madinah', text: 'Travel between the Holy Cities by high-speed train or by road.' },
  ZIYARAT_TOUR: { title: 'Ziyarat tours', text: 'Guided visits to the historic sites in each city.' },
  LOCAL: { title: 'Local transport', text: 'Short rides within the city.' },
};

export default async function TransportationPage() {
  const items = await getTransport();
  const groups = Object.keys(KINDS).map((k) => ({ kind: k, items: items.filter((i) => i.serviceKind === k) })).filter((g) => g.items.length > 0);

  return (
    <>
      <PageHero eyebrow="Getting around" title="Transportation" description="Choose shared transport for value or a private vehicle for comfort and flexibility. Transfers included in your package are listed on its page." breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Transportation' }]} />
      <Container className="py-10">
        {groups.length === 0 ? (
          <EmptyState icon={Bus} title="Transport options are being added" description="Ask us about transfers for your dates." />
        ) : (
          <div className="space-y-12">
            {groups.map((g) => (
              <section key={g.kind} aria-labelledby={`k-${g.kind}`}>
                <h2 id={`k-${g.kind}`} className="text-2xl font-semibold sm:text-3xl">{KINDS[g.kind]!.title}</h2>
                <p className="mt-1 mb-5 text-muted-foreground">{KINDS[g.kind]!.text}</p>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{g.items.map((t) => <TransportCard key={t.id} item={t} />)}</div>
              </section>
            ))}
          </div>
        )}
        <CtaPanel title="Need a different route or vehicle?" text="Add transport requirements to a customized package request." href="/custom-package" label="Request a quotation" />
      </Container>
    </>
  );
}
