import { Controller, Get, Injectable, Module, UseInterceptors } from '@nestjs/common';
import type { SitemapDto } from '@umrah/shared';
import { PublicCacheInterceptor } from '../../common/http/public-cache.interceptor';
import { PrismaService } from '../../prisma/prisma.service';
import { iso } from '../catalog/catalog.mappers';

/** Slugs + last-modified for every public URL; consumed by the Next.js sitemap.xml route. */
@Injectable()
export class SitemapService {
  constructor(private readonly prisma: PrismaService) {}

  async build(now = new Date()): Promise<SitemapDto> {
    const [packages, hotels, ziyarat, posts, pages] = await Promise.all([
      this.prisma.package.findMany({ where: { status: 'PUBLISHED', deletedAt: null }, select: { slug: true, updatedAt: true } }),
      this.prisma.hotel.findMany({ where: { status: 'PUBLISHED', deletedAt: null }, select: { slug: true, updatedAt: true } }),
      this.prisma.ziyarat.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true, updatedAt: true } }),
      this.prisma.post.findMany({
        where: { status: 'PUBLISHED', deletedAt: null, publishedAt: { lte: now } },
        select: { slug: true, type: true, updatedAt: true },
      }),
      this.prisma.page.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true, type: true, updatedAt: true } }),
    ]);
    const row = <T extends { updatedAt: Date }>(r: T) => ({ ...r, updatedAt: iso(r.updatedAt) });
    return {
      packages: packages.map(row),
      hotels: hotels.map(row),
      ziyarat: ziyarat.map(row),
      posts: posts.map(row),
      pages: pages.map(row),
    };
  }
}

@Controller('public/sitemap')
@UseInterceptors(PublicCacheInterceptor)
export class PublicSitemapController {
  constructor(private readonly sitemap: SitemapService) {}

  @Get()
  get() {
    return this.sitemap.build();
  }
}

@Module({ providers: [SitemapService], controllers: [PublicSitemapController] })
export class SeoModule {}
