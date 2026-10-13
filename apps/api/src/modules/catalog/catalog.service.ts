import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  HotelDto,
  PackageDetailDto,
  PackageFacetsDto,
  PackageListDto,
  PackageListQuery,
  PackageSummaryDto,
  TransportDto,
  ZiyaratDto,
} from '@umrah/shared';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ReviewsService } from '../reviews/reviews.module';
import {
  departureSelect,
  hotelInclude,
  iso,
  packageSummaryInclude,
  toDeparture,
  toHotel,
  toMedia,
  toPackageSummary,
  toTransport,
  toZiyarat,
  utcToday,
  ziyaratInclude,
} from './catalog.mappers';
import { buildPackageOrderBy, buildPackageWhere } from './package-filters';

const PUBLISHED_HOTEL = { status: 'PUBLISHED', deletedAt: null } as const;

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reviews: ReviewsService,
  ) {}

  /* ------------------------------ Packages ------------------------------ */

  async listPackages(q: PackageListQuery): Promise<PackageListDto> {
    const today = utcToday();
    const where = buildPackageWhere(q, today);
    const include = packageSummaryInclude;

    const [total, facets] = await Promise.all([this.prisma.package.count({ where }), this.facets()]);
    const pageCount = Math.max(1, Math.ceil(total / q.pageSize));
    const page = Math.min(q.page, pageCount);

    let rows;
    if (q.sort === 'departure') {
      // "Soonest departure" can't be expressed as a DB ordering; catalogs are small, so sort the matches in memory.
      const all = await this.prisma.package.findMany({ where, include });
      const key = (r: (typeof all)[number]) => toPackageSummary(r, today).nextDepartureDate ?? '9999-12-31';
      all.sort((a, b) => key(a).localeCompare(key(b)) || a.title.localeCompare(b.title));
      rows = all.slice((page - 1) * q.pageSize, page * q.pageSize);
    } else {
      rows = await this.prisma.package.findMany({
        where,
        include,
        orderBy: buildPackageOrderBy(q.sort),
        skip: (page - 1) * q.pageSize,
        take: q.pageSize,
      });
    }

    return {
      items: rows.map((r) => toPackageSummary(r, today)),
      meta: { total, page, pageSize: q.pageSize, pageCount },
      facets,
    };
  }

  /** Filter options across all published packages (independent of the active filters so the UI stays stable). */
  private async facets(): Promise<PackageFacetsDto> {
    const rows = await this.prisma.package.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      select: { departureCities: true, tier: true, durationDays: true, startingPrice: true, category: { select: { slug: true, name: true } } },
    });
    const cities = [...new Set(rows.flatMap((r) => r.departureCities))].sort();
    const cats = new Map<string, { slug: string; name: string; count: number }>();
    const tiers = new Map<PackageSummaryDto['tier'], number>();
    for (const r of rows) {
      if (r.category) {
        const c = cats.get(r.category.slug) ?? { ...r.category, count: 0 };
        c.count++;
        cats.set(r.category.slug, c);
      }
      tiers.set(r.tier, (tiers.get(r.tier) ?? 0) + 1);
    }
    const prices = rows.map((r) => (r.startingPrice ? Number(r.startingPrice) : null)).filter((n): n is number => n !== null);
    const days = rows.map((r) => r.durationDays);
    return {
      cities,
      categories: [...cats.values()].sort((a, b) => a.name.localeCompare(b.name)),
      tiers: [...tiers.entries()].map(([tier, count]) => ({ tier, count })),
      price: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
      durations: days.length ? { min: Math.min(...days), max: Math.max(...days) } : null,
    };
  }

  async getPackage(slug: string): Promise<PackageDetailDto> {
    const today = utcToday();
    const p = await this.prisma.package.findFirst({
      where: { slug, status: 'PUBLISHED', deletedAt: null },
      include: {
        ...packageSummaryInclude,
        images: { orderBy: { sortOrder: 'asc' }, select: { media: { select: { url: true, altText: true } } } },
        hotels: {
          orderBy: { sortOrder: 'asc' },
          where: { hotel: PUBLISHED_HOTEL },
          select: {
            city: true,
            nights: true,
            notes: true,
            hotel: { select: { slug: true, name: true, city: true, starRating: true, distanceToHaramMeters: true, summary: true, amenities: true } },
          },
        },
        itinerary: { orderBy: { dayNumber: 'asc' } },
        transport: { where: { transportService: { isActive: true, deletedAt: null } }, select: { transportService: true } },
        ziyarat: { where: { ziyarat: { status: 'PUBLISHED' } }, select: { ziyarat: { include: ziyaratInclude } } },
        departures: {
          where: { status: { in: ['OPEN', 'SOLD_OUT'] }, departureDate: { gte: today } },
          orderBy: { departureDate: 'asc' },
          select: departureSelect,
        },
      },
    });
    if (!p) throw new NotFoundException('Package not found');

    const summary = toPackageSummary(p, today);

    const [reviews, related] = await Promise.all([this.reviews.listApproved({ packageId: p.id, limit: 6 }), this.relatedPackages(p.id, p.categoryId, p.tier, today)]);

    return {
      ...summary,
      description: p.description,
      inclusions: p.inclusions,
      exclusions: p.exclusions,
      terms: p.terms,
      depositType: p.depositType,
      depositValue: p.depositValue.toString(),
      images: p.images.map((i) => toMedia(i.media)),
      hotels: p.hotels.map((h) => ({
        city: h.city,
        nights: h.nights,
        notes: h.notes,
        hotel: {
          slug: h.hotel.slug,
          name: h.hotel.name,
          city: h.hotel.city,
          starRating: h.hotel.starRating,
          distanceToHaramMeters: h.hotel.distanceToHaramMeters,
          summary: h.hotel.summary,
          amenities: h.hotel.amenities,
        },
      })),
      itinerary: p.itinerary.map((i) => ({ dayNumber: i.dayNumber, title: i.title, description: i.description, city: i.city })),
      transport: p.transport.map((t) => toTransport(t.transportService)),
      ziyarat: p.ziyarat.map((z) => toZiyarat(z.ziyarat)),
      departures: p.departures.map((d) => toDeparture(d, today)),
      reviews,
      related,
      seo: { title: p.seoTitle, description: p.seoDescription },
      updatedAt: iso(p.updatedAt),
    };
  }

  private async relatedPackages(id: string, categoryId: string | null, tier: PackageSummaryDto['tier'], today: Date): Promise<PackageSummaryDto[]> {
    const base = { status: 'PUBLISHED', deletedAt: null } as const;
    const orderBy: Prisma.PackageOrderByWithRelationInput[] = [{ isFeatured: 'desc' }, { sortOrder: 'asc' }];
    // Same category or tier first, then top up with other published packages so the section is never empty.
    const similar = await this.prisma.package.findMany({
      where: { ...base, id: { not: id }, OR: [...(categoryId ? [{ categoryId }] : []), { tier }] },
      include: packageSummaryInclude,
      orderBy,
      take: 3,
    });
    const others =
      similar.length < 3
        ? await this.prisma.package.findMany({
            where: { ...base, id: { notIn: [id, ...similar.map((s) => s.id)] } },
            include: packageSummaryInclude,
            orderBy,
            take: 3 - similar.length,
          })
        : [];
    return [...similar, ...others].map((r) => toPackageSummary(r, today));
  }

  /* ------------------------------ Hotels ------------------------------ */

  async listHotels(opts: { city?: string; stars?: number[]; q?: string }): Promise<HotelDto[]> {
    const today = utcToday();
    const where: Prisma.HotelWhereInput = { ...PUBLISHED_HOTEL };
    if (opts.city) where.city = opts.city as Prisma.HotelWhereInput['city'];
    if (opts.stars?.length) where.starRating = { in: opts.stars };
    if (opts.q) where.name = { contains: opts.q, mode: 'insensitive' };
    const rows = await this.prisma.hotel.findMany({
      where,
      include: hotelInclude,
      orderBy: [{ city: 'asc' }, { distanceToHaramMeters: { sort: 'asc', nulls: 'last' } }, { name: 'asc' }],
    });
    return rows.map((h) => toHotel(h, today));
  }

  async getHotel(slug: string): Promise<HotelDto> {
    const h = await this.prisma.hotel.findFirst({ where: { slug, ...PUBLISHED_HOTEL }, include: hotelInclude });
    if (!h) throw new NotFoundException('Hotel not found');
    return toHotel(h, utcToday());
  }

  /* ------------------------------ Transport & Ziyarat ------------------------------ */

  async listTransport(): Promise<TransportDto[]> {
    const rows = await this.prisma.transportService.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ serviceKind: 'asc' }, { isShared: 'asc' }, { name: 'asc' }],
    });
    return rows.map(toTransport);
  }

  async listZiyarat(city?: string): Promise<ZiyaratDto[]> {
    const rows = await this.prisma.ziyarat.findMany({
      where: { status: 'PUBLISHED', ...(city ? { city: city as Prisma.ZiyaratWhereInput['city'] } : {}) },
      include: ziyaratInclude,
      orderBy: [{ city: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map(toZiyarat);
  }

  async getZiyarat(slug: string): Promise<ZiyaratDto> {
    const z = await this.prisma.ziyarat.findFirst({ where: { slug, status: 'PUBLISHED' }, include: ziyaratInclude });
    if (!z) throw new NotFoundException('Ziyarat not found');
    return toZiyarat(z);
  }
}
