import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Plane, Ticket } from 'lucide-react';
import type { DepartureDto, ItineraryDayDto, MediaDto } from '@umrah/shared';
import { LogoMark } from '@/components/brand/logo';
import { cityLabel } from '@/components/public/cards';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatDateRange, formatMoney, pluralize } from '@/lib/format';
import { cn } from '@/lib/utils';

export const ONLINE_BOOKING = process.env.NEXT_PUBLIC_ONLINE_BOOKING === '1';

export function PackageGallery({ images, title }: { images: MediaDto[]; title: string }) {
  if (images.length === 0) {
    return (
      <div className="relative aspect-[3/1] overflow-hidden rounded-2xl bg-sidebar bg-gradient-to-br from-[oklch(0.4_0.075_165)] to-[oklch(0.2_0.04_165)] bg-pattern sm:aspect-[21/7]" role="img" aria-label={`${title} (photos coming soon)`}>
        <LogoMark className="absolute start-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 opacity-60 rtl:translate-x-1/2" />
      </div>
    );
  }
  const [first, ...rest] = images;
  return (
    <div className="grid gap-2 sm:grid-cols-4 sm:grid-rows-2">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl sm:col-span-2 sm:row-span-2 sm:aspect-auto sm:min-h-80">
        <Image src={first!.url} alt={first!.alt ?? title} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
      </div>
      {rest.slice(0, 4).map((img) => (
        <div key={img.url} className="relative hidden aspect-[4/3] overflow-hidden rounded-xl sm:block">
          <Image src={img.url} alt={img.alt ?? ''} fill sizes="25vw" className="object-cover" />
        </div>
      ))}
    </div>
  );
}

const OCC_LABEL: Record<string, string> = { SINGLE: 'Single', DOUBLE: 'Double', TRIPLE: 'Triple', QUAD: 'Quad', QUINT: 'Quint', SHARING: 'Shared' };

/** Departure cards with per-room-type prices. Booking is online when enabled, otherwise "Enquire" pre-selects the departure. */
export function DepartureList({ departures, currency, slug }: { departures: DepartureDto[]; currency: string; slug: string }) {
  if (departures.length === 0) {
    return <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No departures are open right now. <Link href={`/packages/${slug}#enquire`} className="font-medium text-primary underline underline-offset-4">Ask us about upcoming dates</Link>.</p>;
  }
  return (
    <ul className="grid gap-4">
      {departures.map((d) => {
        const low = d.seatsLeft > 0 && d.seatsLeft <= 8;
        return (
          <li key={d.id} className={cn('rounded-2xl border bg-card p-5 shadow-card', !d.bookable && 'opacity-80')}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 font-display text-lg font-semibold"><CalendarDays className="size-4 text-primary" aria-hidden /> {formatDateRange(d.departureDate, d.returnDate)}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {d.departureCity && <span className="inline-flex items-center gap-1"><Plane className="size-3.5" aria-hidden /> From {d.departureCity}</span>}
                  {d.airline && <span>{d.airline}</span>}
                  {d.bookingCutoffDate && <span>Book by {formatDate(d.bookingCutoffDate)}</span>}
                </p>
              </div>
              {d.bookable ? (
                <Badge variant={low ? 'destructive' : 'secondary'}>{low ? `Only ${d.seatsLeft} seats left` : `${d.seatsLeft} seats available`}</Badge>
              ) : (
                <Badge variant="outline">{d.seatsLeft === 0 ? 'Sold out' : 'Closed for booking'}</Badge>
              )}
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {d.prices.map((p) => (
                <div key={p.occupancy} className="rounded-lg bg-muted/60 p-3">
                  <dt className="text-xs text-muted-foreground">{OCC_LABEL[p.occupancy] ?? p.occupancy} room · per adult</dt>
                  <dd className="mt-0.5 font-display text-lg font-semibold tabular-nums">{formatMoney(p.adultPrice, p.currency || currency)}</dd>
                  {p.childPrice && <dd className="text-xs text-muted-foreground">Child {formatMoney(p.childPrice, p.currency || currency)}</dd>}
                </div>
              ))}
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              {d.bookable && ONLINE_BOOKING && (
                <Button asChild variant="gold"><Link href={`/book/${slug}?departure=${d.id}`}><Ticket /> Book this departure</Link></Button>
              )}
              {d.bookable && (
                <Button asChild variant={ONLINE_BOOKING ? 'outline' : 'default'}><Link href={`/packages/${slug}?departure=${d.id}#enquire`} scroll>Enquire about this date <ArrowRight className="rtl:rotate-180" /></Link></Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function Itinerary({ days }: { days: ItineraryDayDto[] }) {
  if (days.length === 0) return null;
  return (
    <Accordion type="single" collapsible defaultValue="day-1" className="rounded-2xl border bg-card px-5 shadow-card">
      {days.map((d) => (
        <AccordionItem key={d.dayNumber} value={`day-${d.dayNumber}`}>
          <AccordionTrigger className="py-4 text-start">
            <span className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{d.dayNumber}</span>
              <span>
                <span className="block text-base font-medium">{d.title}</span>
                {d.city && <span className="block text-xs text-muted-foreground">{cityLabel(d.city)}</span>}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="ps-11 text-base leading-relaxed text-muted-foreground">{d.description}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export const durationLabel = (days: number, makkah: number, madinah: number) => `${pluralize(days, 'day')} · ${makkah} nights Makkah · ${madinah} nights Madinah`;
