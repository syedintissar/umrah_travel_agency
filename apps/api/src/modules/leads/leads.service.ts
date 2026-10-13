import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type {
  ContactInquiryInput,
  CustomPackageRequestInput,
  LeadSubmitResult,
  PackageInquiryInput,
} from '@umrah/shared';
import type { LeadSource, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ReferenceService } from '../../common/references.service';
import { detectSpam, phoneDigits } from './spam';

const DEDUPE_WINDOW_MS = 10 * 60 * 1000;

type CommonInput = {
  fullName: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  city?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  website?: string;
  formStartedAt?: number;
};

@Injectable()
export class LeadsService {
  private readonly log = new Logger(LeadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: ReferenceService,
  ) {}

  contact(input: ContactInquiryInput): Promise<LeadSubmitResult> {
    return this.submit('CONTACT_FORM', input, () => ({
      subject: input.subject ?? 'Website enquiry',
      message: input.message,
    }));
  }

  async packageInquiry(input: PackageInquiryInput): Promise<LeadSubmitResult> {
    const pkg = await this.prisma.package.findFirst({
      where: { slug: input.packageSlug, status: 'PUBLISHED', deletedAt: null },
      select: { id: true, title: true },
    });
    if (!pkg) throw new NotFoundException('Package not found');

    let preferredDepartureDate: Date | undefined;
    if (input.departureId) {
      const dep = await this.prisma.packageDeparture.findFirst({
        where: { id: input.departureId, packageId: pkg.id },
        select: { departureDate: true },
      });
      if (!dep) throw new NotFoundException('Departure not found for this package');
      preferredDepartureDate = dep.departureDate;
    }

    return this.submit('WEBSITE', input, () => ({
      subject: `Package enquiry: ${pkg.title}`,
      message: input.message,
      interestedPackageId: pkg.id,
      preferredDepartureDate,
      travelersCount: input.travelersCount,
    }));
  }

  customPackage(input: CustomPackageRequestInput): Promise<LeadSubmitResult> {
    return this.submit(
      'CUSTOM_PACKAGE_REQUEST',
      input,
      () => ({
        subject: 'Custom package request',
        message: input.notes,
        preferredDepartureDate: input.preferredDepartureDate ? new Date(`${input.preferredDepartureDate}T00:00:00.000Z`) : undefined,
        travelersCount: input.adults + input.children + input.infants,
        budget: input.budget,
        customRequest: {
          create: {
            adults: input.adults,
            children: input.children,
            infants: input.infants,
            departureCity: input.departureCity,
            preferredDepartureDate: input.preferredDepartureDate ? new Date(`${input.preferredDepartureDate}T00:00:00.000Z`) : undefined,
            flexibleDates: input.flexibleDates,
            nightsMakkah: input.nightsMakkah,
            nightsMadinah: input.nightsMadinah,
            hotelStarPreference: input.hotelStarPreference,
            roomPreference: input.roomPreference,
            needsVisa: input.needsVisa,
            needsFlights: input.needsFlights,
            needsTransport: input.needsTransport,
            needsZiyarat: input.needsZiyarat,
            budget: input.budget,
            notes: input.notes,
          },
        },
      }),
    );
  }

  /**
   * Shared persistence path. Bot submissions are dropped silently (no signal for attackers) and double-submits
   * within a short window return the existing enquiry instead of creating a duplicate.
   */
  private async submit(
    source: LeadSource,
    input: CommonInput,
    extra: () => Partial<Prisma.LeadUncheckedCreateInput>,
  ): Promise<LeadSubmitResult> {
    const spam = detectSpam(input);
    if (spam) {
      this.log.warn(`Dropped ${source} submission (${spam})`);
      return { ok: true, reference: 'ENQ-RECEIVED' };
    }

    const email = input.email?.toLowerCase();
    const existing = await this.findRecentDuplicate(source, email, input.phone);
    if (existing) return { ok: true, reference: existing.reference };

    const customer = await this.matchCustomer(email, input.phone);

    const lead = await this.prisma.$transaction(async (tx) => {
      const reference = await this.refs.next('ENQ', tx);
      return tx.lead.create({
        data: {
          reference,
          source,
          fullName: input.fullName,
          email,
          phone: input.phone,
          whatsappNumber: input.whatsappNumber,
          city: input.city,
          customerId: customer?.id,
          consentAt: new Date(),
          utmSource: input.utmSource,
          utmMedium: input.utmMedium,
          utmCampaign: input.utmCampaign,
          ...extra(),
        },
        select: { reference: true },
      });
    });
    return { ok: true, reference: lead.reference };
  }

  private findRecentDuplicate(source: LeadSource, email?: string, phone?: string) {
    const or = [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])];
    if (or.length === 0) return null;
    return this.prisma.lead.findFirst({
      where: { source, deletedAt: null, createdAt: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) }, OR: or },
      select: { reference: true },
    });
  }

  /** Links the enquiry to an existing customer record when the email or phone matches. */
  private async matchCustomer(email?: string, phone?: string) {
    const digits = phoneDigits(phone);
    if (!email && !digits) return null;
    return this.prisma.customer.findFirst({
      where: {
        deletedAt: null,
        OR: [...(email ? [{ email: { equals: email, mode: 'insensitive' as const } }] : []), ...(phone ? [{ phone }] : [])],
      },
      select: { id: true },
    });
  }
}
