export const DEFAULT_CURRENCY = 'PKR';
const DEFAULT_LOCALE = 'en-PK';

type Numeric = number | string | null | undefined;

function toNumber(value: Numeric): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Money from API values (Prisma Decimals arrive as strings). Returns an em dash when missing. */
export function formatMoney(
  amount: Numeric,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
): string {
  const n = toNumber(amount);
  if (n === null) return '—';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    // Whole amounts read cleaner without ".00"; fractional amounts always show two decimals.
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: Number.isInteger(n) ? 0 : 2,
  }).format(n);
}

export function formatNumber(value: Numeric, locale: string = DEFAULT_LOCALE): string {
  const n = toNumber(value);
  return n === null ? '—' : new Intl.NumberFormat(locale).format(n);
}

type DateInput = Date | string | number | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
  locale: string = 'en-GB',
): string {
  const d = toDate(value);
  // Date-only values (YYYY-MM-DD) are shown in UTC so they never shift a day.
  return d ? new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...options }).format(d) : '—';
}

export function formatDateTime(value: DateInput, locale: string = 'en-GB'): string {
  const d = toDate(value);
  return d
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(d)
    : '—';
}

export function formatDateRange(from: DateInput, to: DateInput): string {
  const a = toDate(from);
  const b = toDate(to);
  if (!a || !b) return formatDate(a ?? b);
  const sameYear = a.getUTCFullYear() === b.getUTCFullYear();
  return `${formatDate(a, { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) })} – ${formatDate(b)}`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatDistance(meters: number | null | undefined): string | null {
  if (meters === null || meters === undefined) return null;
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
}

/** PASSPORT_NUMBER -> "Passport number" */
export function humanize(key: string): string {
  const s = key.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('') || '?'
  );
}
