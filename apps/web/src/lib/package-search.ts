import { PACKAGE_SORTS, packageListQuerySchema, type PackageListQuery, type PackageSort } from '@umrah/shared';

export type RawSearchParams = Record<string, string | string[] | undefined>;

/** `?tier=A&tier=B` (HTML forms) and `?tier=A,B` both become `A,B`. */
export function normalizeSearchParams(sp: RawSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (v === undefined) continue;
    const joined = Array.isArray(v) ? v.filter(Boolean).join(',') : v;
    if (joined !== '') out[k] = joined;
  }
  return out;
}

export interface ParsedSearch {
  query: PackageListQuery;
  /** Normalised param map suitable for building links (only valid, non-default values). */
  params: Record<string, string>;
}

/** Parses URL params with the same schema as the API. Invalid params are dropped rather than failing the page. */
export function parsePackageSearch(sp: RawSearchParams): ParsedSearch {
  const raw = normalizeSearchParams(sp);
  // `month=YYYY-MM` is a UI shortcut that expands to from/to for the API.
  const range = raw.month ? monthRange(raw.month) : null;
  const { month, ...rest } = raw;
  const keep: Record<string, string> = {};
  // Validate each key on its own so one bad value does not discard the rest.
  for (const [k, v] of Object.entries(rest)) {
    if (packageListQuerySchema.safeParse({ [k]: v }).success) keep[k] = v;
  }
  const query = packageListQuerySchema.parse({ ...keep, ...(range && !keep.from && !keep.to ? range : {}) });
  const params = { ...keep };
  if (range && month) params.month = month;
  if (params.sort === 'featured') delete params.sort;
  if (params.page === '1') delete params.page;
  return { query, params };
}

export function buildSearchHref(base: string, params: Record<string, string | undefined>, overrides: Record<string, string | undefined> = {}): string {
  const merged = { ...params, ...overrides };
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== '') sp.set(k, v);
  const s = sp.toString();
  return s ? `${base}?${s}` : base;
}

export const SORT_LABELS: Record<PackageSort, string> = {
  featured: 'Recommended',
  price_asc: 'Price: low to high',
  price_desc: 'Price: high to low',
  duration_asc: 'Duration: shortest',
  duration_desc: 'Duration: longest',
  departure: 'Soonest departure',
};
export const SORT_OPTIONS = PACKAGE_SORTS;

/** First and last day of a `YYYY-MM` month, for the "travel month" quick filter. */
export function monthRange(month: string): { from: string; to: string } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return null;
  const year = Number(m[1]);
  const mon = Number(m[2]);
  if (mon < 1 || mon > 12) return null;
  const last = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  return { from: `${m[1]}-${m[2]}-01`, to: `${m[1]}-${m[2]}-${String(last).padStart(2, '0')}` };
}

/** The next `count` calendar months (including the current one) as `{ value: 'YYYY-MM', label }`. */
export function upcomingMonths(count = 12, now = new Date()): { value: string; label: string }[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    return {
      value: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`,
      label: new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d),
    };
  });
}
