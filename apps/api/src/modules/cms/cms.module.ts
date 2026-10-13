import { Module } from '@nestjs/common';
import { CmsService } from './cms.service';
import { PublicCmsController } from './public-cms.controller';

@Module({
  providers: [CmsService],
  controllers: [PublicCmsController],
  exports: [CmsService],
})
export class CmsModule {}
