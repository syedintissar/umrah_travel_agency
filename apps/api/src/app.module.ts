import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { CommonModule } from './common/common.module';
import { AppThrottlerGuard } from './common/http/throttle.guard';
import { ConfigModule } from './config/config.module';
import { HealthController } from './health/health.controller';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CmsModule } from './modules/cms/cms.module';
import { LeadsModule } from './modules/leads/leads.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SeoModule } from './modules/seo/seo.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    CommonModule,
    // Generous global default (reads are cached at the CDN); write endpoints add stricter @Throttle limits.
    // In-memory store is per instance; swap for a Redis store when running multiple API instances.
    ThrottlerModule.forRoot({ throttlers: [{ name: 'default', ttl: 60_000, limit: 300 }] }),
    CatalogModule,
    CmsModule,
    ReviewsModule,
    LeadsModule,
    SeoModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: AppThrottlerGuard }],
})
export class AppModule {}
