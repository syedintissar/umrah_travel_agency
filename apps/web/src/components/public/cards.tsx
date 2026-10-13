import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Bus, Clock, Footprints, Landmark, MapPin, Quote, Train, Users } from 'lucide-react';
import type { HotelDto, PostSummaryDto, ReviewDto, TransportDto, ZiyaratDto } from '@umrah/shared';
import { LogoMark } from '@/components/brand/logo';
import { PriceTag, Rating } from '@/components/commerce/primitives';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatDate, formatDistance, humanize } from '@/lib/format';
import { cn } from '@/lib/utils';

const CITY_LABEL: Record<string, string> = { MAKKAH: 'Makkah', MADINAH: 'Madinah', JEDDAH: 'Jeddah', TAIF: 'Taif', OTHER: 'Other' };
export const cityLabel = (c: string) => CITY_LABEL[c] ?? humanize(c);

/** Cover image or the branded pattern placeholder. */
export function CoverImage({ url, alt, className, sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw', priority }: { url?: string | null; alt?: string | null; className?: string; sizes?: string; priority?: boolean }) {
  return (
    <div className={cn('relative aspect-[16/10] overflow-hidden bg-sidebar', className)}>
      {url ? (
        <Image src={url} alt={alt ?? ''} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[oklch(0.4_0.075_165)] to-[oklch(0.2_0.04_165)] bg-pattern" aria-hidden>
          <LogoMark className="size-12 opacity-70" />
        </div>
      )}
    </div>
  );
}

export function HotelCard({ hotel }: { hotel: HotelDto }) {
  const distance = formatDistance(hotel.distanceToHaramMeters);
  const href = `/hotels/${hotel.slug}`;
  return (
    <Card className="group relative gap-0 overflow-hidden p-0 shadow-card transition-shadow hover:shadow-elevated focus-within:ring-2 focus-within:ring-ring">
      <CoverImage url={hotel.images[0]?.url} alt={hotel.images[0]?.alt} />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">{cityLabel(hotel.city)}</p>
          <h3 className="mt-1 text-lg leading-snug font-semibold">
            <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">{hotel.name}</Link>
          </h3>
          <Rating value={hotel.starRating} className="mt-1.5" />
        </div>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {distance && <li className="flex items-center gap-2"><MapPin className="size-4 text-primary" aria-hidden /> {distance} from {hotel.city === 'MADINAH' ? 'Masjid an-Nabawi' : 'the Haram'}</li>}
          {hotel.walkingMinutes !== null && <li className="flex items-center gap-2"><Footprints className="size-4 text-primary" aria-hidden /> About {hotel.walkingMinutes} min walk</li>}
        </ul>
        <div className="mt-auto flex items-end justify-between gap-3 border-t pt-4">
          <PriceTag amount={hotel.fromPricePerNight} currency={hotel.currency} suffix="per night" size="md" />
          <ArrowRight className="size-5 text-primary rtl:rotate-180" aria-hidden />
        </div>
      </div>
    </Card>
  );
}

const TRANSPORT_ICON = { HARAMAIN_TRAIN: Train } as const;
export function TransportCard({ item }: { item: TransportDto }) {
  const Icon = (TRANSPORT_ICON as Record<string, typeof Bus>)[item.type] ?? Bus;
  return (
    <Card className="gap-3 p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" aria-hidden /></span>
        <div className="min-w-0">
          <h3 className="text-base leading-snug font-semibold">{item.name}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge variant="secondary">{item.isShared ? 'Shared' : 'Private'}</Badge>
            {item.vehicleModel && <Badge variant="outline">{item.vehicleModel}</Badge>}
          </div>
        </div>
      </div>
      {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
      <dl className="mt-auto grid grid-cols-2 gap-3 border-t pt-3 text-sm">
        {(item.fromLocation || item.toLocation) && (
          <div className="col-span-2"><dt className="text-xs text-muted-foreground">Route</dt><dd className="font-medium">{item.fromLocation}{item.toLocation && item.toLocation !== item.fromLocation ? ` → ${item.toLocation}` : ''}</dd></div>
        )}
        {item.capacity && <div><dt className="text-xs text-muted-foreground">Capacity</dt><dd className="flex items-center gap-1 font-medium"><Users className="size-3.5" aria-hidden /> {item.capacity}</dd></div>}
        {item.basePrice && <div><dt className="text-xs text-muted-foreground">From</dt><dd className="font-medium tabular-nums"><PriceTag amount={item.basePrice} currency={item.currency} prefix="" suffix={item.priceBasis === 'PER_VEHICLE' ? 'per vehicle' : 'per person'} className="[&>span:first-child]:text-base [&>span:first-child]:font-sans" /></dd></div>}
      </dl>
    </Card>
  );
}

export function ZiyaratCard({ item }: { item: ZiyaratDto }) {
  return (
    <Card className="group relative gap-0 overflow-hidden p-0 shadow-card transition-shadow hover:shadow-elevated focus-within:ring-2 focus-within:ring-ring">
      <CoverImage url={item.coverUrl} alt={item.name} className="aspect-[16/9]" />
      <div className="flex flex-col gap-2 p-5">
        <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-primary uppercase"><Landmark className="size-3.5" aria-hidden /> {cityLabel(item.city)}</p>
        <h3 className="text-lg leading-snug font-semibold">
          <Link href={`/ziyarat/${item.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">{item.name}</Link>
        </h3>
        {item.summary && <p className="line-clamp-3 text-sm text-muted-foreground">{item.summary}</p>}
      </div>
    </Card>
  );
}

export function PostCard({ post, base }: { post: PostSummaryDto; base: string }) {
  return (
    <Card className="group relative gap-0 overflow-hidden p-0 shadow-card transition-shadow hover:shadow-elevated focus-within:ring-2 focus-within:ring-ring">
      <CoverImage url={post.coverUrl} alt="" className="aspect-[16/9]" />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {post.category && <Badge variant="secondary">{post.category.name}</Badge>}
          {post.readingMinutes && <span className="inline-flex items-center gap-1"><Clock className="size-3" aria-hidden /> {post.readingMinutes} min read</span>}
        </div>
        <h3 className="text-lg leading-snug font-semibold">
          <Link href={`${base}/${post.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">{post.title}</Link>
        </h3>
        {post.excerpt && <p className="line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>}
        {post.publishedAt && <p className="mt-auto pt-2 text-xs text-muted-foreground">{formatDate(post.publishedAt)}</p>}
      </div>
    </Card>
  );
}

export function ReviewCard({ review }: { review: ReviewDto }) {
  return (
    <Card className="gap-3 p-6 shadow-card">
      <Quote className="size-6 text-gold" aria-hidden />
      <Rating value={review.rating} />
      {review.title && <p className="font-display text-lg font-semibold">{review.title}</p>}
      <p className="text-sm leading-relaxed text-muted-foreground">{review.body}</p>
      <p className="mt-auto pt-2 text-sm"><span className="font-medium">{review.authorName}</span>{review.packageTitle && <span className="text-muted-foreground"> · {review.packageTitle}</span>}</p>
      {review.adminResponse && <p className="rounded-lg bg-muted p-3 text-sm"><span className="font-medium">Our reply: </span>{review.adminResponse}</p>}
    </Card>
  );
}
