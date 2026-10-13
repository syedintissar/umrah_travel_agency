import { Controller, Get, Injectable, Module, Query, UseInterceptors } from '@nestjs/common';
import type { ReviewsDto } from '@umrah/shared';
import { z } from 'zod';
import { PublicCacheInterceptor } from '../../common/http/public-cache.interceptor';
import { ZodPipe } from '../../common/http/zod.pipe';
import { PrismaService } from '../../prisma/prisma.service';
import { iso } from '../catalog/catalog.mappers';

const query = z.object({
  featured: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(24).default(6),
});

/** Only moderator-approved reviews are public. Author names are reduced to first name + initial. */
@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /** `packageId` scopes both the list and the rating summary to one package. */
  async listApproved(opts: { featured?: boolean; limit: number; packageId?: string }): Promise<ReviewsDto> {
    const scope = { status: 'APPROVED' as const, ...(opts.packageId ? { packageId: opts.packageId } : {}) };
    const where = { ...scope, ...(opts.featured ? { isFeatured: true } : {}) };
    const [agg, rows] = await Promise.all([
      this.prisma.review.aggregate({ where: scope, _avg: { rating: true }, _count: true }),
      this.prisma.review.findMany({
        where,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        take: opts.limit,
        include: { customer: { select: { firstName: true, lastName: true } }, package: { select: { title: true } } },
      }),
    ]);
    return {
      summary: { average: agg._avg.rating === null ? null : Math.round(agg._avg.rating * 10) / 10, count: agg._count },
      items: rows.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        authorName: `${r.customer.firstName} ${r.customer.lastName.charAt(0)}.`,
        packageTitle: r.package?.title ?? null,
        createdAt: iso(r.createdAt),
        adminResponse: r.adminResponse,
      })),
    };
  }
}

@Controller('public/reviews')
@UseInterceptors(PublicCacheInterceptor)
export class PublicReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  list(@Query(new ZodPipe(query)) q: z.infer<typeof query>) {
    return this.reviews.listApproved(q);
  }
}

@Module({ providers: [ReviewsService], controllers: [PublicReviewsController], exports: [ReviewsService] })
export class ReviewsModule {}
