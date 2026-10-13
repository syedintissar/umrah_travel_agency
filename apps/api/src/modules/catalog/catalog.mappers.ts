import type {
  DepartureDto,
  HotelBriefDto,
  HotelDto,
  MediaDto,
  PackageSummaryDto,
  RoomTypeDto,
  TransportDto,
  ZiyaratDto,
} from '@umrah/shared';
import type { Prisma } from '../../generated/prisma/client';

type Decimalish = { toString(): string } | null | undefined;
export const dec = (v: Decimalish): string | null => (v === null || v === undefined ? null : v.toString());
export const dateOnly = (d: Date): string => d.toISOString().slice(0, 10);
export const iso = (d: Date): string => d.toISOString();
export const utcToday = (now = new Date()): Date => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

/** A departure can be booked when OPEN, before its cut-off, and with seats remaining. */
export function isBookable(
  d: { status: string; seatsTotal: number; seatsReserved: number; bookingCutoffDate: Date | null; departureDate: Date },
  today: Date,
): boolean {
  if (d.status !== 'OPEN') return false;
  if (d.seatsTotal - d.seatsReserved <= 0) return false;
  if (d.departureDate < today) return false;
  return d.bookingCutoffDate === null || d.bookingCutoffDate >= today;
}

/* ---------------- Package summary ---------------- */

export const hotelBriefSelect = {
  slug: true,
  name: true,
  city: true,
  starRating: true,
  distanceToHaramMeters: true,
} satisfies Prisma.HotelSelect;

export const packageSummaryInclude = {
  category: { select: { name: true } },
  coverMedia: { select: { url: true, altText: true } },
  hotels: {
    orderBy: { sortOrder: 'asc' },
    where: { hotel: { deletedAt: null, status: 'PUBLISHED' } },
    select: { city: true, hotel: { select: hotelBriefSelect } },
  },
  departures: {
    where: { status: 'OPEN' },
    orderBy: { departureDate: 'asc' },
    take: 8,
    select: { departureDate: true, seatsTotal: true, seatsReserved: true, bookingCutoffDate: true, status: true },
  },
} satisfies Prisma.PackageInclude;

export type PackageSummaryRow = Prisma.PackageGetPayload<{ include: typeof packageSummaryInclude }>;

const toBrief = (h: { slug: string; name: string; city: HotelBriefDto['city']; starRating: number; distanceToHaramMeters: number | null }): HotelBriefDto => ({
  slug: h.slug,
  name: h.name,
  city: h.city,
  starRating: h.starRating,
  distanceToHaramMeters: h.distanceToHaramMeters,
});

export function toPackageSummary(p: PackageSummaryRow, today: Date): PackageSummaryDto {
  const next = p.departures.find((d) => isBookable(d, today));
  const hotelIn = (city: 'MAKKAH' | 'MADINAH') => p.hotels.find((h) => h.city === city)?.hotel;
  const makkah = hotelIn('MAKKAH');
  const madinah = hotelIn('MADINAH');
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    subtitle: p.subtitle,
    summary: p.summary,
    tier: p.tier,
    categoryName: p.category?.name ?? null,
    durationDays: p.durationDays,
    nightsMakkah: p.nightsMakkah,
    nightsMadinah: p.nightsMadinah,
    departureCities: p.departureCities,
    mealPlan: p.mealPlan,
    startingPrice: dec(p.startingPrice),
    currency: p.currency,
    coverUrl: p.coverMedia?.url ?? null,
    coverAlt: p.coverMedia?.altText ?? null,
    makkahHotel: makkah ? toBrief(makkah) : null,
    madinahHotel: madinah ? toBrief(madinah) : null,
    visaIncluded: p.visaIncluded,
    flightIncluded: p.flightIncluded,
    transportIncluded: p.transportIncluded,
    ziyaratIncluded: p.ziyaratIncluded,
    isFeatured: p.isFeatured,
    nextDepartureDate: next ? dateOnly(next.departureDate) : null,
    seatsLeft: next ? next.seatsTotal - next.seatsReserved : null,
  };
}

/* ---------------- Departures ---------------- */

export const departureSelect = {
  id: true,
  departureDate: true,
  returnDate: true,
  departureCity: true,
  airline: true,
  flightDetails: true,
  seatsTotal: true,
  seatsReserved: true,
  bookingCutoffDate: true,
  status: true,
  prices: { select: { occupancy: true, adultPrice: true, childPrice: true, infantPrice: true, currency: true } },
} satisfies Prisma.PackageDepartureSelect;

const OCCUPANCY_ORDER = ['SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD', 'QUINT', 'SHARING'];

export function toDeparture(d: Prisma.PackageDepartureGetPayload<{ select: typeof departureSelect }>, today: Date): DepartureDto {
  return {
    id: d.id,
    departureDate: dateOnly(d.departureDate),
    returnDate: dateOnly(d.returnDate),
    departureCity: d.departureCity,
    airline: d.airline,
    flightDetails: d.flightDetails,
    seatsLeft: Math.max(0, d.seatsTotal - d.seatsReserved),
    bookingCutoffDate: d.bookingCutoffDate ? dateOnly(d.bookingCutoffDate) : null,
    bookable: isBookable(d, today),
    prices: [...d.prices]
      .sort((a, b) => OCCUPANCY_ORDER.indexOf(a.occupancy) - OCCUPANCY_ORDER.indexOf(b.occupancy))
      .map((p) => ({
        occupancy: p.occupancy,
        adultPrice: p.adultPrice.toString(),
        childPrice: dec(p.childPrice),
        infantPrice: dec(p.infantPrice),
        currency: p.currency,
      })),
  };
}

/* ---------------- Media, transport, ziyarat, hotels ---------------- */

export const toMedia = (m: { url: string; altText: string | null }): MediaDto => ({ url: m.url, alt: m.altText });

export function toTransport(t: Prisma.TransportServiceGetPayload<object>): TransportDto {
  return {
    id: t.id,
    name: t.name,
    type: t.type,
    serviceKind: t.serviceKind,
    isShared: t.isShared,
    vehicleModel: t.vehicleModel,
    capacity: t.capacity,
    fromLocation: t.fromLocation,
    toLocation: t.toLocation,
    description: t.description,
    priceBasis: t.priceBasis,
    basePrice: dec(t.basePrice),
    currency: t.currency,
  };
}

export const ziyaratInclude = { coverMedia: { select: { url: true } } } satisfies Prisma.ZiyaratInclude;

export function toZiyarat(z: Prisma.ZiyaratGetPayload<{ include: typeof ziyaratInclude }>): ZiyaratDto {
  return {
    slug: z.slug,
    name: z.name,
    city: z.city,
    summary: z.summary,
    description: z.description,
    coverUrl: z.coverMedia?.url ?? null,
  };
}

export const hotelInclude = {
  images: { orderBy: { sortOrder: 'asc' }, select: { media: { select: { url: true, altText: true } } } },
  roomTypes: {
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      name: true,
      occupancy: true,
      maxGuests: true,
      description: true,
      amenities: true,
      rates: { select: { pricePerNight: true, currency: true, validFrom: true, validTo: true } },
    },
  },
} satisfies Prisma.HotelInclude;

export function toHotel(h: Prisma.HotelGetPayload<{ include: typeof hotelInclude }>, today: Date): HotelDto {
  const roomTypes: RoomTypeDto[] = h.roomTypes.map((r) => {
    const current = r.rates.filter((x) => x.validFrom <= today && x.validTo >= today);
    // Prefer a rate valid today; else the cheapest upcoming one.
    const pool = current.length ? current : r.rates.filter((x) => x.validTo >= today);
    const min = pool.reduce<(typeof pool)[number] | null>((m, x) => (m === null || x.pricePerNight.lt(m.pricePerNight) ? x : m), null);
    return {
      name: r.name,
      occupancy: r.occupancy,
      maxGuests: r.maxGuests,
      description: r.description,
      amenities: r.amenities,
      fromPricePerNight: dec(min?.pricePerNight),
      currency: min?.currency ?? 'PKR',
    };
  });
  const priced = roomTypes.filter((r) => r.fromPricePerNight !== null);
  const cheapest = priced.reduce<RoomTypeDto | null>((m, r) => (m === null || Number(r.fromPricePerNight) < Number(m.fromPricePerNight) ? r : m), null);
  return {
    ...toBrief(h),
    id: h.id,
    walkingMinutes: h.walkingMinutes,
    address: h.address,
    latitude: h.latitude ? Number(h.latitude) : null,
    longitude: h.longitude ? Number(h.longitude) : null,
    summary: h.summary,
    description: h.description,
    amenities: h.amenities,
    checkInTime: h.checkInTime,
    checkOutTime: h.checkOutTime,
    images: h.images.map((i) => toMedia(i.media)),
    roomTypes,
    fromPricePerNight: cheapest?.fromPricePerNight ?? null,
    currency: cheapest?.currency ?? 'PKR',
    seo: { title: h.seoTitle, description: h.seoDescription },
  };
}
