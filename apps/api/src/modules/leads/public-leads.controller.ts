import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  contactInquirySchema,
  customPackageRequestSchema,
  packageInquirySchema,
  type ContactInquiryInput,
  type CustomPackageRequestInput,
  type PackageInquiryInput,
} from '@umrah/shared';
import { ZodPipe } from '../../common/http/zod.pipe';
import { LeadsService } from './leads.service';

/** Public enquiry forms. Strictly rate limited per IP; every submission is validated and persisted as a Lead. */
@Controller('public/leads')
@Throttle({ default: { limit: 5, ttl: 60_000 } })
export class PublicLeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Post('contact')
  @HttpCode(201)
  contact(@Body(new ZodPipe(contactInquirySchema)) body: ContactInquiryInput) {
    return this.leads.contact(body);
  }

  @Post('package-inquiry')
  @HttpCode(201)
  packageInquiry(@Body(new ZodPipe(packageInquirySchema)) body: PackageInquiryInput) {
    return this.leads.packageInquiry(body);
  }

  @Post('custom-package')
  @HttpCode(201)
  customPackage(@Body(new ZodPipe(customPackageRequestSchema)) body: CustomPackageRequestInput) {
    return this.leads.customPackage(body);
  }
}
