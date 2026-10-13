import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Check, Clock, ExternalLink, Footprints, MapPin } from 'lucide-react';
import { PriceTag, Rating } from '@/components/commerce/primitives';
import { Container } from '@/components/layout/section';
import { CoverImage, cityLabel } from '@/components/public/cards';
import { CtaPanel } from '@/components/public/content-page';
import { PageHero } from '@/components/public/page-hero';
import { JsonLd } from '@/components/seo/json-ld';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDistance, formatMoney, humanize } from '@/lib/format';
import { getHotel } from '@/lib/public-api';
import { buildMetadata, hotelJsonLd } from '@/lib/seo';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const h = await getHotel((await params).slug);
  if (!h) return { title: 'Hotel not found', robots: { index: false } };
  const where = h.city === 'MADINAH' ? 'Masjid an-Nabawi' : 'the Haram';
  return buildMetadata({
    title: h.seo.title ?? `${h.name}, ${cityLabel(h.city)}`,
    description: h.seo.description ?? h.summary ?? `${h.starRating}-star hotel in ${cityLabel(h.city)}${h.distanceToHaramMeters ? `, ${formatDistance(h.distanceToHaramMeters)} from ${where}` : ''}.`,
    path: `/hotels/${h.slug}`,
    image: h.images[0]?.url,
  });
}

export default async function HotelPage({ params }: Props) {
  const h = await getHotel((await params).slug);
  if (!h) notFound();
  const where = h.city === 'MADINAH' ? 'Masjid an-Nabawi' : 'the Haram';
  const distance = formatDistance(h.distanceToHaramMeters);
  const mapHref = h.latitude !== null && h.longitude !== null ? `https://www.google.com/maps?q=${h.latitude},${h.longitude}` : null;

  return (
    <>
      <JsonLd data={hotelJsonLd({ name: h.name, description: h.summary, path: `/hotels/${h.slug}`, stars: h.starRating, address: h.address, lat: h.latitude, lng: h.longitude, image: h.images[0]?.url })} />
      <PageHero eyebrow={cityLabel(h.city)} title={h.name} description={h.summary ?? undefined} breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Hotels', path: '/hotels' }, { name: h.name }]}>
        <Rating value={h.starRating} size="md" />
      </PageHero>

      <Container className="py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
          <div className="min-w-0 space-y-12">
            <CoverImage url={h.images[0]?.url} alt={h.images[0]?.alt ?? h.name} className="aspect-[21/9] rounded-2xl" sizes="(min-width: 1024px) 60vw, 100vw" priority />

            {h.description && <section aria-label="About this hotel"><p className="max-w-3xl leading-relaxed whitespace-pre-line text-foreground/90">{h.description}</p></section>}

            {h.amenities.length > 0 && (
              <section aria-labelledby="amenities">
                <h2 id="amenities" className="mb-4 text-2xl font-semibold">Facilities</h2>
                <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                  {h.amenities.map((a) => <li key={a} className="flex gap-2.5 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />{a}</li>)}
                </ul>
              </section>
            )}

            {h.roomTypes.length > 0 && (
              <section aria-labelledby="rooms">
                <h2 id="rooms" className="mb-4 text-2xl font-semibold">Room types and nightly rates</h2>
                <div className="overflow-x-auto rounded-2xl border bg-card shadow-card">
                  <table className="w-full min-w-[30rem] text-sm">
                    <caption className="sr-only">Room types with capacity and starting nightly rate</caption>
                    <thead className="bg-muted/60"><tr>{['Room', 'Sleeps', 'From, per night'].map((t) => <th key={t} scope="col" className="px-4 py-3 text-start font-semibold">{t}</th>)}</tr></thead>
                    <tbody className="divide-y">
                      {h.roomTypes.map((r) => (
                        <tr key={r.name}>
                          <th scope="row" className="px-4 py-3 text-start font-medium">{r.name}<span className="block text-xs font-normal text-muted-foreground">{humanize(r.occupancy)} occupancy</span></th>
                          <td className="px-4 py-3">{r.maxGuests} guests</td>
                          <td className="px-4 py-3 font-medium tabular-nums">{r.fromPricePerNight ? formatMoney(r.fromPricePerNight, r.currency) : 'On request'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">Nightly rates are indicative. Package prices include your hotel stay and are shown on each package.</p>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="gap-4 p-6 shadow-elevated">
              <h2 className="font-sans text-base font-semibold">At a glance</h2>
              <ul className="space-y-3 text-sm">
                {distance && <li className="flex gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />{distance} from {where}</li>}
                {h.walkingMinutes !== null && <li className="flex gap-2.5"><Footprints className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />About {h.walkingMinutes} minutes on foot</li>}
                {(h.checkInTime || h.checkOutTime) && <li className="flex gap-2.5"><Clock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />Check-in {h.checkInTime ?? '—'} · Check-out {h.checkOutTime ?? '—'}</li>}
                {h.address && <li className="flex gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />{h.address}</li>}
              </ul>
              {h.fromPricePerNight && <PriceTag amount={h.fromPricePerNight} currency={h.currency} suffix="per night" />}
              {mapHref && <Button asChild variant="outline"><a href={mapHref} target="_blank" rel="noopener noreferrer">View on map <ExternalLink aria-hidden /></a></Button>}
              <Button asChild><Link href={`/packages?stars=${h.starRating}`}>{h.starRating}-star packages</Link></Button>
            </Card>
          </aside>
        </div>
        <CtaPanel title="Want this hotel in your package?" text="Tell us your dates and group size and we will build a quotation around your stay." href="/custom-package" label="Request a custom package" />
      </Container>
    </>
  );
}
