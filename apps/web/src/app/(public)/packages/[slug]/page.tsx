import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowRight, Check, CalendarDays, Clock, MapPin, ShieldCheck, Star, Utensils, X } from 'lucide-react';
import { PackageCard } from '@/components/commerce/package-card';
import { PriceTag, Rating } from '@/components/commerce/primitives';
import { Container } from '@/components/layout/section';
import { PackageInquiryForm } from '@/components/forms/lead-forms';
import { cityLabel, ReviewCard, TransportCard, ZiyaratCard } from '@/components/public/cards';
import { PublicBreadcrumbs } from '@/components/public/page-hero';
import { DepartureList, Itinerary, ONLINE_BOOKING, PackageGallery } from '@/components/public/package-detail';
import { JsonLd } from '@/components/seo/json-ld';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDate, formatDistance, formatMoney, humanize, pluralize } from '@/lib/format';
import { getPackage } from '@/lib/public-api';
import { buildMetadata, packageJsonLd } from '@/lib/seo';
import { TIER_LABEL } from '@/types/catalog';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ departure?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPackage(slug);
  if (!p) return { title: 'Package not found', robots: { index: false } };
  return buildMetadata({
    title: p.seo.title ?? `${p.title} | Umrah package`,
    description: p.seo.description ?? p.summary ?? `${p.title}: ${pluralize(p.durationDays, 'day')} Umrah package with hotels in Makkah and Madinah.`,
    path: `/packages/${p.slug}`,
    image: p.images[0]?.url ?? p.coverUrl,
    modifiedTime: p.updatedAt,
  });
}

function SectionTitle({ id, children }: { id?: string; children: React.ReactNode }) {
  return <h2 id={id} className="mb-5 scroll-mt-24 text-2xl font-semibold sm:text-3xl">{children}</h2>;
}

const depositText = (type: string, value: string, currency: string) =>
  type === 'PERCENTAGE' ? `${Number(value)}% deposit to confirm` : `${formatMoney(value, currency)} deposit${type === 'FIXED_PER_PERSON' ? ' per person' : ''} to confirm`;

export default async function PackageDetailPage({ params, searchParams }: Props) {
  const [{ slug }, { departure }] = await Promise.all([params, searchParams]);
  const p = await getPackage(slug);
  if (!p) notFound();

  const nextBookable = p.departures.find((d) => d.bookable);
  const departureOptions = p.departures.filter((d) => d.bookable).map((d) => ({ id: d.id, label: `${formatDate(d.departureDate)}${d.departureCity ? ` · from ${d.departureCity}` : ''}` }));
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Packages', path: '/packages' }, { name: p.title }];

  return (
    <>
      <JsonLd
        data={packageJsonLd({
          name: p.title,
          description: p.summary,
          path: `/packages/${p.slug}`,
          image: p.images[0]?.url ?? p.coverUrl,
          currency: p.currency,
          lowPrice: p.startingPrice,
          available: Boolean(nextBookable),
          rating: p.reviews.summary,
        })}
      />
      <Container className="py-8 pb-28 lg:pb-12">
        <PublicBreadcrumbs items={crumbs} className="mb-5" />
        <PackageGallery images={p.images.length ? p.images : p.coverUrl ? [{ url: p.coverUrl, alt: p.coverAlt }] : []} title={p.title} />

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
          <article className="min-w-0 space-y-14">
            <header>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge className="bg-gold text-gold-foreground">{TIER_LABEL[p.tier]}</Badge>
                {p.categoryName && <Badge variant="secondary">{p.categoryName}</Badge>}
                {p.reviews.summary.count > 0 && p.reviews.summary.average && (
                  <span className="inline-flex items-center gap-1.5 text-sm"><Rating value={p.reviews.summary.average} /> {p.reviews.summary.average} ({p.reviews.summary.count})</span>
                )}
              </div>
              <h1 className="text-3xl font-semibold sm:text-5xl">{p.title}</h1>
              {p.subtitle && <p className="mt-2 text-lg text-muted-foreground">{p.subtitle}</p>}
              {p.summary && <p className="mt-4 max-w-3xl text-lg leading-relaxed">{p.summary}</p>}
              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
                <li className="flex items-center gap-2"><Clock className="size-4 text-primary" aria-hidden /> {pluralize(p.durationDays, 'day')}</li>
                <li className="flex items-center gap-2"><MapPin className="size-4 text-primary" aria-hidden /> {p.nightsMakkah} nights Makkah · {p.nightsMadinah} nights Madinah</li>
                <li className="flex items-center gap-2"><Utensils className="size-4 text-primary" aria-hidden /> {humanize(p.mealPlan)}</li>
                {p.departureCities.length > 0 && <li className="flex items-center gap-2"><CalendarDays className="size-4 text-primary" aria-hidden /> From {p.departureCities.join(', ')}</li>}
              </ul>
              <nav aria-label="On this page" className="mt-6 flex flex-wrap gap-2 text-sm">
                {[['#included', 'Included'], ['#hotels', 'Hotels'], ['#itinerary', 'Itinerary'], ['#departures', 'Dates & prices'], ['#enquire', 'Enquire']].map(([href, label]) => (
                  <a key={href} href={href} className="rounded-full border px-3.5 py-1.5 transition-colors hover:bg-accent">{label}</a>
                ))}
              </nav>
            </header>

            {p.description && (
              <section aria-label="Overview"><p className="max-w-3xl leading-relaxed whitespace-pre-line text-foreground/90">{p.description}</p></section>
            )}

            <section aria-labelledby="included">
              <SectionTitle id="included">What&apos;s included</SectionTitle>
              <div className="grid gap-6 sm:grid-cols-2">
                <Card className="gap-3 p-5 shadow-card">
                  <h3 className="font-sans text-sm font-semibold tracking-wide text-success uppercase">Included</h3>
                  <ul className="space-y-2.5 text-sm">
                    {p.inclusions.map((i) => <li key={i} className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />{i}</li>)}
                  </ul>
                </Card>
                <Card className="gap-3 p-5 shadow-card">
                  <h3 className="font-sans text-sm font-semibold tracking-wide text-muted-foreground uppercase">Not included</h3>
                  <ul className="space-y-2.5 text-sm text-muted-foreground">
                    {p.exclusions.map((i) => <li key={i} className="flex gap-2.5"><X className="mt-0.5 size-4 shrink-0" aria-hidden />{i}</li>)}
                  </ul>
                </Card>
              </div>
            </section>

            {p.hotels.length > 0 && (
              <section aria-labelledby="hotels">
                <SectionTitle id="hotels">Where you will stay</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  {p.hotels.map((h) => (
                    <Card key={h.hotel.slug} className="gap-3 p-5 shadow-card">
                      <p className="text-xs font-semibold tracking-wide text-primary uppercase">{cityLabel(h.city)} · {pluralize(h.nights, 'night')}</p>
                      <h3 className="text-lg font-semibold"><Link href={`/hotels/${h.hotel.slug}`} className="hover:underline">{h.hotel.name}</Link></h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <Rating value={h.hotel.starRating} />
                        {formatDistance(h.hotel.distanceToHaramMeters) && <span>{formatDistance(h.hotel.distanceToHaramMeters)} from {h.city === 'MADINAH' ? 'Masjid an-Nabawi' : 'the Haram'}</span>}
                      </div>
                      {h.hotel.amenities.length > 0 && <p className="text-sm text-muted-foreground">{h.hotel.amenities.slice(0, 4).join(' · ')}</p>}
                      <Link href={`/hotels/${h.hotel.slug}`} className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Hotel details <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden /></Link>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {p.itinerary.length > 0 && (
              <section aria-labelledby="itinerary">
                <SectionTitle id="itinerary">Day-by-day itinerary</SectionTitle>
                <Itinerary days={p.itinerary} />
              </section>
            )}

            {p.transport.length > 0 && (
              <section aria-labelledby="transport">
                <SectionTitle id="transport">Transportation</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">{p.transport.map((t) => <TransportCard key={t.id} item={t} />)}</div>
              </section>
            )}

            {p.ziyarat.length > 0 && (
              <section aria-labelledby="ziyarat">
                <SectionTitle id="ziyarat">Ziyarat included</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">{p.ziyarat.map((z) => <ZiyaratCard key={z.slug} item={z} />)}</div>
              </section>
            )}

            <section aria-labelledby="departures">
              <SectionTitle id="departures">Departure dates and prices</SectionTitle>
              <DepartureList departures={p.departures} currency={p.currency} slug={p.slug} />
              <p className="mt-3 text-sm text-muted-foreground">Prices are per person and subject to availability at the time of booking.</p>
            </section>

            {p.terms && (
              <section aria-labelledby="terms">
                <SectionTitle id="terms">Terms</SectionTitle>
                <p className="max-w-3xl leading-relaxed whitespace-pre-line text-muted-foreground">{p.terms}</p>
              </section>
            )}

            {p.reviews.items.length > 0 && (
              <section aria-labelledby="reviews">
                <SectionTitle id="reviews">Traveler reviews</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">{p.reviews.items.map((r) => <ReviewCard key={r.id} review={r} />)}</div>
              </section>
            )}

            <section id="enquire" aria-labelledby="enquire-title" className="scroll-mt-24 rounded-2xl border bg-card p-6 shadow-card sm:p-8">
              <h2 id="enquire-title" className="text-2xl font-semibold sm:text-3xl">Request details or a quotation</h2>
              <p className="mt-2 mb-6 text-muted-foreground">Tell us who is travelling and a consultant will contact you with availability and next steps.</p>
              <PackageInquiryForm packageSlug={p.slug} departures={departureOptions} defaultDepartureId={departure} />
            </section>
          </article>

          <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Booking summary">
            <Card className="gap-5 p-6 shadow-elevated">
              <PriceTag amount={p.startingPrice} currency={p.currency} size="lg" />
              {nextBookable && (
                <div className="rounded-xl bg-primary/8 p-3 text-sm">
                  <p className="font-medium">Next departure</p>
                  <p className="text-muted-foreground">{formatDate(nextBookable.departureDate)}{nextBookable.departureCity ? ` · from ${nextBookable.departureCity}` : ''}</p>
                  {nextBookable.seatsLeft <= 8 && <p className="mt-1 font-medium text-destructive">Only {nextBookable.seatsLeft} seats left</p>}
                </div>
              )}
              <div className="grid gap-2.5">
                {ONLINE_BOOKING && nextBookable && <Button asChild variant="gold" size="lg"><Link href={`/book/${p.slug}?departure=${nextBookable.id}`}>Book now</Link></Button>}
                <Button asChild size="lg" variant={ONLINE_BOOKING ? 'outline' : 'gold'}><a href="#enquire">Request details</a></Button>
                <Button asChild variant="ghost"><a href="#departures">See all dates & prices</a></Button>
              </div>
              <ul className="space-y-2 border-t pt-4 text-sm text-muted-foreground">
                <li className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /> {depositText(p.depositType, p.depositValue, p.currency)}</li>
                {p.visaIncluded && <li className="flex gap-2"><Star className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /> Visa processing included</li>}
              </ul>
            </Card>
          </aside>
        </div>

        {p.related.length > 0 && (
          <section aria-labelledby="related" className="mt-16">
            <SectionTitle id="related">You may also like</SectionTitle>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{p.related.map((r) => <PackageCard key={r.id} pkg={r} className="h-full" />)}</div>
          </section>
        )}
      </Container>

      {/* Mobile sticky call-to-action */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur lg:hidden">
        <div className="container-page flex items-center justify-between gap-3 !px-1">
          <PriceTag amount={p.startingPrice} currency={p.currency} suffix="pp" />
          <Button asChild variant="gold" size="lg"><a href="#enquire">Request details</a></Button>
        </div>
      </div>
    </>
  );
}
