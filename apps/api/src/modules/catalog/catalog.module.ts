import { Module } from '@nestjs/common';
import { ReviewsModule } from '../reviews/reviews.module';
import { CatalogService } from './catalog.service';
import { PublicCatalogController } from './public-catalog.controller';

@Module({
  imports: [ReviewsModule],
  providers: [CatalogService],
  controllers: [PublicCatalogController],
  exports: [CatalogService],
})
export class CatalogModule {}
