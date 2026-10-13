import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { packageListQuerySchema, type PackageListQuery } from '@umrah/shared';
import { z } from 'zod';
import { PublicCacheInterceptor } from '../../common/http/public-cache.interceptor';
import { ZodPipe } from '../../common/http/zod.pipe';
import { CatalogService } from './catalog.service';

const CITY = z.enum(['MAKKAH', 'MADINAH', 'JEDDAH', 'TAIF', 'OTHER']);
const hotelQuery = z.object({
  city: CITY.optional(),
  stars: z.preprocess((v) => (typeof v === 'string' ? v.split(',').map(Number) : v), z.array(z.number().int().min(1).max(5)).max(5).optional()),
  q: z.string().trim().min(1).max(100).optional(),
});
const ziyaratQuery = z.object({ city: CITY.optional() });

/** Unauthenticated, read-only catalog endpoints. Only published records are ever returned. */
@Controller('public')
@UseInterceptors(PublicCacheInterceptor)
export class PublicCatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('packages')
  listPackages(@Query(new ZodPipe(packageListQuerySchema)) query: PackageListQuery) {
    return this.catalog.listPackages(query);
  }

  @Get('packages/:slug')
  getPackage(@Param('slug') slug: string) {
    return this.catalog.getPackage(slug);
  }

  @Get('hotels')
  listHotels(@Query(new ZodPipe(hotelQuery)) query: z.infer<typeof hotelQuery>) {
    return this.catalog.listHotels(query);
  }

  @Get('hotels/:slug')
  getHotel(@Param('slug') slug: string) {
    return this.catalog.getHotel(slug);
  }

  @Get('transport')
  listTransport() {
    return this.catalog.listTransport();
  }

  @Get('ziyarat')
  listZiyarat(@Query(new ZodPipe(ziyaratQuery)) query: z.infer<typeof ziyaratQuery>) {
    return this.catalog.listZiyarat(query.city);
  }

  @Get('ziyarat/:slug')
  getZiyarat(@Param('slug') slug: string) {
    return this.catalog.getZiyarat(slug);
  }
}
