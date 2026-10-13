import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Container } from '@/components/layout/section';
import { CoverImage, cityLabel, ZiyaratCard } from '@/components/public/cards';
import { CtaPanel } from '@/components/public/content-page';
import { PageHero } from '@/components/public/page-hero';
import { getZiyarat, getZiyaratItem } from '@/lib/public-api';
import { buildMetadata } from '@/lib/seo';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const z = await getZiyaratItem((await params).slug);
  if (!z) return { title: 'Not found', robots: { index: false } };
  return buildMetadata({ title: `${z.name}, ${cityLabel(z.city)}`, description: z.summary, path: `/ziyarat/${z.slug}`, image: z.coverUrl });
}

export default async function ZiyaratDetailPage({ params }: Props) {
  const { slug } = await params;
  const z = await getZiyaratItem(slug);
  if (!z) notFound();
  const others = (await getZiyarat(z.city)).filter((o) => o.slug !== z.slug).slice(0, 3);
  return (
    <>
      <PageHero eyebrow={cityLabel(z.city)} title={z.name} description={z.summary ?? undefined} breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Ziyarat', path: '/ziyarat' }, { name: z.name }]} />
      <Container className="py-10">
        <div className="mx-auto max-w-3xl space-y-8">
          <CoverImage url={z.coverUrl} alt={z.name} className="aspect-[21/9] rounded-2xl" sizes="(min-width: 768px) 48rem, 100vw" priority />
          {z.description && <p className="leading-relaxed whitespace-pre-line text-foreground/90">{z.description}</p>}
          <p className="text-sm text-muted-foreground">Visiting hours and access can change. Your guide will confirm details for your date. <Link href="/ziyarat" className="font-medium text-primary underline underline-offset-4">All ziyarat sites</Link></p>
        </div>
        {others.length > 0 && (
          <section className="mt-14" aria-labelledby="more">
            <h2 id="more" className="mb-5 text-2xl font-semibold">More in {cityLabel(z.city)}</h2>
            <div className="grid gap-6 md:grid-cols-3">{others.map((o) => <ZiyaratCard key={o.slug} item={o} />)}</div>
          </section>
        )}
        <CtaPanel title="Visit with a guide" text="See packages that include guided ziyarat." href="/packages?services=ziyarat" label="Packages with ziyarat" />
      </Container>
    </>
  );
}
