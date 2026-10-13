import Link from 'next/link';
import { BookOpenCheck, Clock } from 'lucide-react';
import { EmptyState } from '@/components/feedback/states';
import { Container } from '@/components/layout/section';
import { CtaPanel } from '@/components/public/content-page';
import { PageHero } from '@/components/public/page-hero';
import { Card } from '@/components/ui/card';
import { getPosts } from '@/lib/public-api';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Umrah guide for first-time travelers',
  description: 'Step-by-step guides to Ihram, Tawaf, Sa’i, packing and travel preparation for Umrah.',
  path: '/umrah-guide',
});

export default async function UmrahGuidePage() {
  const { items } = await getPosts({ type: 'GUIDE', pageSize: 50 });
  return (
    <>
      <PageHero
        eyebrow="Learn"
        title="Umrah guide"
        description="Clear, practical guidance from preparation to the final rite. Read in order, or jump to what you need."
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Umrah guide' }]}
      />
      <Container className="py-10">
        {items.length === 0 ? (
          <EmptyState icon={BookOpenCheck} title="Guides are being written" description="Check back soon, or ask our team any question." />
        ) : (
          <ol className="grid gap-5 md:grid-cols-2">
            {items.map((p, i) => (
              <li key={p.slug}>
                <Card className="group relative h-full flex-row gap-4 p-5 shadow-card transition-shadow focus-within:ring-2 focus-within:ring-ring hover:shadow-elevated">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary font-display text-lg font-semibold text-primary-foreground" aria-hidden>
                    {i + 1}
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-semibold">
                      <Link href={`/umrah-guide/${p.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
                        {p.title}
                      </Link>
                    </h2>
                    {p.excerpt && <p className="mt-1.5 text-sm text-muted-foreground">{p.excerpt}</p>}
                    {p.readingMinutes && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" aria-hidden /> {p.readingMinutes} min read
                      </p>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ol>
        )}
        <CtaPanel title="Travel with guidance" text="Every package includes a briefing and support from our team." href="/packages" label="Browse packages" />
      </Container>
    </>
  );
}
