import { Global, Module } from '@nestjs/common';
import { ReferenceService } from './references.service';

@Global()
@Module({ providers: [ReferenceService], exports: [ReferenceService] })
export class CommonModule {}
