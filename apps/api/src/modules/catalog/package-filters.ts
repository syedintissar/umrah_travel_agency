import type { PackageListQuery, PackageSort } from '@umrah/shared';
import type { Prisma } from '../../generated/prisma/client';

const asDate = (s: string): Date => new Date(`${s}T00:00:00.000Z`);

/** Translates the public search query into a Prisma filter. Only published, non-deleted packages are ever visible. */
export function buildPackageWhere(q: PackageListQuery, today: Date): Prisma.PackageWhereInput {
  const and: Prisma.PackageWhereInput[] = [];

  if (q.city) and.push({ departureCities: { has: q.city } });
  if (q.category) and.push({ category: { slug: q.category } });
  if (q.tier?.length) and.push({ tier: { in: q.tier } });
  if (q.minDays !== undefined) and.push({ durationDays: { gte: q.minDays } });
  if (q.maxDays !== undefined) and.push({ durationDays: { lte: q.maxDays } });
  if (q.minPrice !== undefined) and.push({ startingPrice: { gte: q.minPrice } });
  if (q.maxPrice !== undefined) and.push({ startingPrice: { lte: q.maxPrice } });
  if (q.stars?.length) and.push({ hotels: { some: { hotel: { starRating: { in: q.stars }, status: 'PUBLISHED', deletedAt: null } } } });
  if (q.featured) and.push({ isFeatured: true });
  if (q.q) {
    and.push({
      OR: [
        { title: { contains: q.q, mode: 'insensitive' } },
        { subtitle: { contains: q.q, mode: 'insensitive' } },
        { summary: { contains: q.q, mode: 'insensitive' } },
      ],
    });
  }
  for (const s of q.services ?? []) {
    and.push(
      s === 'visa' ? { visaIncluded: true } : s === 'flight' ? { flightIncluded: true } : s === 'transport' ? { transportIncluded: true } : { ziyaratIncluded: true },
    );
  }
  if (q.from || q.to) {
    and.push({
      departures: {
        some: {
          status: 'OPEN',
          departureDate: { gte: q.from ? asDate(q.from) : today, ...(q.to ? { lte: asDate(q.to) } : {}) },
          OR: [{ bookingCutoffDate: null }, { bookingCutoffDate: { gte: today } }],
        },
      },
    });
  }

  return { status: 'PUBLISHED', deletedAt: null, AND: and };
}

export function buildPackageOrderBy(sort: PackageSort): Prisma.PackageOrderByWithRelationInput[] {
  switch (sort) {
    case 'price_asc':
      return [{ startingPrice: { sort: 'asc', nulls: 'last' } }, { title: 'asc' }];
    case 'price_desc':
      return [{ startingPrice: { sort: 'desc', nulls: 'last' } }, { title: 'asc' }];
    case 'duration_asc':
      return [{ durationDays: 'asc' }, { startingPrice: { sort: 'asc', nulls: 'last' } }];
    case 'duration_desc':
      return [{ durationDays: 'desc' }, { startingPrice: { sort: 'asc', nulls: 'last' } }];
    default:
      return [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { publishedAt: { sort: 'desc', nulls: 'last' } }];
  }
}
