import { contactInquirySchema, customPackageRequestSchema, packageInquirySchema } from '@umrah/shared';
import { detectSpam, MIN_FILL_MS, phoneDigits } from './spam';

const base = { fullName: 'Muhammad Ali', email: 'ali@example.com', consent: true as const };

describe('detectSpam', () => {
  it('flags a filled honeypot', () => expect(detectSpam({ website: 'http://spam.example' })).toBe('honeypot'));
  it('flags submissions faster than a human can type', () => {
    const now = 1_000_000;
    expect(detectSpam({ formStartedAt: now - (MIN_FILL_MS - 1) }, now)).toBe('too_fast');
    expect(detectSpam({ formStartedAt: now - 5000 }, now)).toBeNull();
  });
  it('accepts normal submissions', () => expect(detectSpam({ website: '' })).toBeNull());
});

describe('phoneDigits', () => {
  it('normalises formatting', () => {
    expect(phoneDigits('+92 300-1234567')).toBe('923001234567');
    expect(phoneDigits(undefined)).toBeUndefined();
  });
});

describe('contactInquirySchema', () => {
  it('accepts a valid enquiry and lower-cases the email', () => {
    const r = contactInquirySchema.parse({ ...base, email: 'ALI@Example.COM', message: 'I would like to know more.' });
    expect(r.email).toBe('ali@example.com');
  });
  it('requires consent', () => {
    expect(contactInquirySchema.safeParse({ ...base, consent: false, message: 'Hello there, please call.' }).success).toBe(false);
  });
  it('requires a way to reach the person', () => {
    const r = contactInquirySchema.safeParse({ fullName: 'Ali Khan', consent: true, message: 'Hello there, please call.' });
    expect(r.success).toBe(false);
  });
  it('accepts a phone-only enquiry and rejects malformed phones', () => {
    expect(contactInquirySchema.safeParse({ fullName: 'Ali Khan', phone: '+92 300 1234567', consent: true, message: 'Please call me back.' }).success).toBe(true);
    expect(contactInquirySchema.safeParse({ fullName: 'Ali Khan', phone: 'call-me', consent: true, message: 'Please call me back.' }).success).toBe(false);
  });
  it('treats blank optional fields as absent', () => {
    const r = contactInquirySchema.parse({ ...base, phone: '', whatsappNumber: '', message: 'Hello, I have a question.' });
    expect(r.phone).toBeUndefined();
  });
});

describe('honeypot', () => {
  it('passes validation when filled so the API can drop the submission silently', () => {
    const r = contactInquirySchema.safeParse({ ...base, message: 'Hello, I have a question.', website: 'http://spam.example' });
    expect(r.success).toBe(true);
  });
});

describe('customPackageRequestSchema', () => {
  it('coerces form values and applies defaults', () => {
    const r = customPackageRequestSchema.parse({ ...base, adults: '2', children: '1', infants: '', nightsMakkah: '7', budget: '1500000' } as never);
    expect(r).toMatchObject({ adults: 2, children: 1, nightsMakkah: 7, budget: 1500000, needsVisa: true });
  });
  it('requires each infant to have an accompanying adult', () => {
    expect(customPackageRequestSchema.safeParse({ ...base, adults: 1, infants: 2 }).success).toBe(false);
  });
  it('bounds party size and star preference', () => {
    expect(customPackageRequestSchema.safeParse({ ...base, adults: 0 }).success).toBe(false);
    expect(customPackageRequestSchema.safeParse({ ...base, adults: 2, hotelStarPreference: 7 }).success).toBe(false);
  });
});

describe('packageInquirySchema', () => {
  it('requires a package slug and caps travelers', () => {
    expect(packageInquirySchema.safeParse({ ...base }).success).toBe(false);
    expect(packageInquirySchema.safeParse({ ...base, packageSlug: 'premium-umrah-14-days', travelersCount: 99 }).success).toBe(false);
    expect(packageInquirySchema.safeParse({ ...base, packageSlug: 'premium-umrah-14-days', travelersCount: 4 }).success).toBe(true);
  });
});
