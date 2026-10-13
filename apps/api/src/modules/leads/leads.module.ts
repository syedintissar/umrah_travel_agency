import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { PublicLeadsController } from './public-leads.controller';

@Module({ providers: [LeadsService], controllers: [PublicLeadsController], exports: [LeadsService] })
export class LeadsModule {}
