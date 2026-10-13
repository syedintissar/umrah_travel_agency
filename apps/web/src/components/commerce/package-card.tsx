import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Bus, CalendarDays, Landmark, MapPin, Plane, Stamp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LogoMark } from '@/components/brand/logo';
import { PriceTag, Rating } from '@/components/commerce/primitives';
import { formatDate, formatDistance, pluralize } from '@/lib/format';
import { cn } from '@/lib/utils';
import { TIER_LABEL, type HotelBrief, type PackageSummary } from '@/types/catalog';

function HotelLine({ city, hotel }: { city: string; hotel?: HotelBrief | null }) {
  if (!hotel) return null;
  const distance = formatDistance(hotel.distanceToHaramMeters);
  return (
    <li className="flex items-start gap-2 text-sm">
      <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <span className="min-w-0">
        <span className="font-medium">{hotel.name}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span>{city}</span>
          <Rating value={hotel.starRating} />
          {distance && <span>{distance} from Haram</span>}
        </span>
      </span>
    </li>
  );
}

const INCLUDES = [
  { key: 'visaIncluded', label: 'Visa', icon: Stamp },
  { key: 'flightIncluded', label: 'Flights', icon: Plane },
  { key: 'transportIncluded', label: 'Transport', icon: Bus },
  { key: 'ziyaratIncluded', label: 'Ziyarat', icon: Landmark },
] as const;

export function PackageCard({ pkg, className, priority }: { pkg: PackageSummary; className?: string; priority?: boolean }) {
  const href = `/packages/${pkg.slug}`;
  const included = INCLUDES.filter((i) => pkg[i.key]);
  const lowSeats = typeof pkg.seatsLeft === 'number' && pkg.seatsLeft > 0 && pkg.seatsLeft <= 8;

  return (
    <Card className={cn('group relative gap-0 overflow-hidden p-0 shadow-card transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-elevated focus-within:ring-2 focus-within:ring-ring', className)}>
      <div className="relative aspect-[16/10] overflow-hidden bg-sidebar">
        {pkg.coverUrl ? (
          <Image
            src={pkg.coverUrl}
            alt={pkg.coverAlt ?? ''}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[oklch(0.4_0.075_165)] to-[oklch(0.2_0.04_165)] bg-pattern" aria-hidden>
            <LogoMark className="size-14 opacity-70" />
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-gradient-to-b from-black/40 to-transparent p-3">
          <Badge className="bg-gold text-gold-foreground shadow-sm">{TIER_LABEL[pkg.tier]}</Badge>
          {lowSeats && <Badge variant="destructive" className="shadow-sm">Only {pkg.seatsLeft} seats left</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="text-lg leading-snug font-semibold">
            <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
              {pkg.title}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {pluralize(pkg.durationDays, 'day')} · {pkg.nightsMakkah} nights Makkah · {pkg.nightsMadinah} nights Madinah
          </p>
        </div>

        {(pkg.makkahHotel || pkg.madinahHotel) && (
          <ul className="space-y-2.5">
            <HotelLine city="Makkah" hotel={pkg.makkahHotel} />
            <HotelLine city="Madinah" hotel={pkg.madinahHotel} />
          </ul>
        )}

        {included.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Included">
            {included.map(({ key, label, icon: Icon }) => (
              <li key={key} className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2.5 py-1 text-xs font-medium text-primary">
                <Icon className="size-3" aria-hidden /> {label}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 border-t pt-4">
          <div>
            <PriceTag amount={pkg.startingPrice} currency={pkg.currency} />
            {pkg.nextDepartureDate && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="size-3" aria-hidden /> Next departure {formatDate(pkg.nextDepartureDate)}
              </p>
            )}
          </div>
          <Button size="sm" tabIndex={-1} aria-hidden className="pointer-events-none">
            Details <ArrowRight className="rtl:rotate-180" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
