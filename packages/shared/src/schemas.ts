import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* Shared primitives                                                   */
/* ------------------------------------------------------------------ */

const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

/** International-ish phone: optional +, digits, spaces, dashes, parentheses; 7-15 digits. */
export const phoneSchema = z
  .string()
  .trim()
  .max(30)
  .refine((v) => /^\+?[0-9\s\-()]+$/.test(v) && v.replace(/\D/g, '').length >= 7 && v.replace(/\D/g, '').length <= 15, 'Enter a valid phone number');

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), schema.optional());

/* ------------------------------------------------------------------ */
/* Public lead forms                                                   */
/* ------------------------------------------------------------------ */

const leadBase = z.object({
  fullName: trimmed(2, 120),
  email: emptyToUndefined(z.string().trim().toLowerCase().max(254).pipe(z.email('Enter a valid email address'))),
  phone: emptyToUndefined(phoneSchema),
  whatsappNumber: emptyToUndefined(phoneSchema),
  city: optionalText(100),
  /** Must be true: links to the privacy policy at the point of collection. */
  consent: z.literal(true, { error: 'Please accept the privacy policy to continue' }),
  /** Honeypot: real users never fill this in. Any value is accepted here; the API drops such submissions silently
   *  (a validation error would reveal the trap to bots). */
  website: z.string().max(500).optional(),
  /** Client timestamp (ms) when the form was rendered; used to reject instant bot submissions. */
  formStartedAt: z.number().int().optional(),
  utmSource: optionalText(100),
  utmMedium: optionalText(100),
  utmCampaign: optionalText(150),
});

const needsContact = (v: { email?: string; phone?: string; whatsappNumber?: string }) =>
  Boolean(v.email || v.phone || v.whatsappNumber);
const contactRule = { message: 'Provide an email address or a phone number so we can reach you', path: ['email'] };

export const contactInquirySchema = leadBase
  .extend({
    subject: optionalText(150),
    message: trimmed(10, 2000),
  })
  .refine(needsContact, contactRule);
export type ContactInquiryInput = z.infer<typeof contactInquirySchema>;

export const packageInquirySchema = leadBase
  .extend({
    packageSlug: trimmed(1, 200),
    departureId: emptyToUndefined(z.uuid()),
    travelersCount: z.coerce.number().int().min(1).max(50).optional(),
    message: optionalText(2000),
  })
  .refine(needsContact, contactRule);
export type PackageInquiryInput = z.infer<typeof packageInquirySchema>;

export const ROOM_OCCUPANCIES = ['SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD', 'QUINT', 'SHARING'] as const;
export type RoomOccupancyKey = (typeof ROOM_OCCUPANCIES)[number];

export const customPackageRequestSchema = leadBase
  .extend({
    adults: z.coerce.number().int().min(1).max(50),
    children: z.coerce.number().int().min(0).max(50).default(0),
    infants: z.coerce.number().int().min(0).max(50).default(0),
    departureCity: optionalText(100),
    preferredDepartureDate: emptyToUndefined(isoDate),
    flexibleDates: z.coerce.boolean().default(true),
    nightsMakkah: emptyToUndefined(z.coerce.number().int().min(0).max(60)),
    nightsMadinah: emptyToUndefined(z.coerce.number().int().min(0).max(60)),
    hotelStarPreference: emptyToUndefined(z.coerce.number().int().min(1).max(5)),
    roomPreference: emptyToUndefined(z.enum(ROOM_OCCUPANCIES)),
    needsVisa: z.coerce.boolean().default(true),
    needsFlights: z.coerce.boolean().default(false),
    needsTransport: z.coerce.boolean().default(true),
    needsZiyarat: z.coerce.boolean().default(false),
    budget: emptyToUndefined(z.coerce.number().min(0).max(1_000_000_000)),
    notes: optionalText(2000),
  })
  .refine(needsContact, contactRule)
  .refine((v) => v.infants <= v.adults, { message: 'Each infant needs an accompanying adult', path: ['infants'] });
export type CustomPackageRequestInput = z.infer<typeof customPackageRequestSchema>;

export interface LeadSubmitResult {
  ok: true;
  /** Human-readable enquiry reference, e.g. ENQ-2026-000045. */
  reference: string;
}

/* ------------------------------------------------------------------ */
/* Package search / filters (shared by the API and URL parsing in web) */
/* ------------------------------------------------------------------ */

export const PACKAGE_SORTS = ['featured', 'price_asc', 'price_desc', 'duration_asc', 'duration_desc', 'departure'] as const;
export type PackageSort = (typeof PACKAGE_SORTS)[number];
export const PACKAGE_SERVICES = ['visa', 'flight', 'transport', 'ziyarat'] as const;
export type PackageService = (typeof PACKAGE_SERVICES)[number];
export const PACKAGE_TIERS = ['ECONOMY', 'STANDARD', 'PREMIUM', 'VIP'] as const;

const csv = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess((v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : v), z.array(item).max(10).optional());
const int = (min: number, max: number) => z.coerce.number().int().min(min).max(max);

export const packageListQuerySchema = z.object({
  city: emptyToUndefined(trimmed(1, 100)),
  category: emptyToUndefined(trimmed(1, 100)),
  tier: csv(z.enum(PACKAGE_TIERS)),
  minDays: emptyToUndefined(int(1, 365)),
  maxDays: emptyToUndefined(int(1, 365)),
  minPrice: emptyToUndefined(z.coerce.number().min(0)),
  maxPrice: emptyToUndefined(z.coerce.number().min(0)),
  stars: csv(z.coerce.number().int().min(1).max(5)),
  from: emptyToUndefined(isoDate),
  to: emptyToUndefined(isoDate),
  services: csv(z.enum(PACKAGE_SERVICES)),
  q: emptyToUndefined(trimmed(1, 100)),
  featured: emptyToUndefined(z.coerce.boolean()),
  sort: z.enum(PACKAGE_SORTS).default('featured'),
  page: int(1, 1000).default(1),
  pageSize: int(1, 48).default(12),
});
export type PackageListQuery = z.infer<typeof packageListQuerySchema>;
