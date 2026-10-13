import { SITE } from '@/config/site';

/** Company profile assembled from public settings (admin-editable under Settings). Missing values stay empty. */
export interface CompanyInfo {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  licenseNumber: string;
  officeHours: string;
  mapEmbedUrl: string;
  social: Record<string, string>;
  currency: string;
  gaMeasurementId: string;
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

export function companyFromSettings(s: Record<string, unknown>): CompanyInfo {
  const social = s['company.social'];
  return {
    name: str(s['company.name']) || SITE.name,
    email: str(s['company.email']),
    phone: str(s['company.phone']),
    whatsapp: str(s['company.whatsapp']),
    address: str(s['company.address']),
    licenseNumber: str(s['company.licenseNumber']),
    officeHours: str(s['company.officeHours']),
    mapEmbedUrl: str(s['company.mapEmbedUrl']),
    social:
      social && typeof social === 'object'
        ? Object.fromEntries(Object.entries(social as Record<string, unknown>).filter(([, v]) => typeof v === 'string' && v.startsWith('https://')) as [string, string][])
        : {},
    currency: str(s['locale.defaultCurrency']) || 'PKR',
    gaMeasurementId: str(s['analytics.gaMeasurementId']),
  };
}

/** `https://wa.me/<digits>` link, or null when no WhatsApp number is configured. */
export function whatsappLink(number: string, text?: string): string | null {
  const digits = number.replace(/\D/g, '');
  if (digits.length < 7) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export const telLink = (phone: string): string | null => {
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned.replace(/\D/g, '').length >= 7 ? `tel:${cleaned}` : null;
};

/** Only embed maps from Google's embed endpoint (the value is admin-supplied). */
export const safeMapEmbed = (url: string): string | null => (/^https:\/\/www\.google\.com\/maps\/embed\?/.test(url) ? url : null);
