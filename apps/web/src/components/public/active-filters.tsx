import Link from 'next/link';
import { X } from 'lucide-react';
import { buildSearchHref, upcomingMonths } from '@/lib/package-search';
import { formatMoney } from '@/lib/format';
import { TIER_LABEL, type PackageTier } from '@/types/catalog';

interface Chip { key: string; label: string; href: string }

const csv = (v?: string) => (v ? v.split(',') : []);

/** Removable chips for each active filter; each chip is a link to the same search without that filter. */
export function activeFilterChips(params: Record<string, string>, categories: { slug: string; name: string }[]): Chip[] {
  const without = (key: string, value?: string): string => {
    const next = { ...params, page: undefined } as Record<string, string | undefined>;
    if (value && csv(params[key]).length > 1) next[key] = csv(params[key]).filter((v) => v !== value).join(',');
    else delete next[key];
    return buildSearchHref('/packages', next);
  };
  const chips: Chip[] = [];
  if (params.q) chips.push({ key: 'q', label: `“${params.q}”`, href: without('q') });
  if (params.city) chips.push({ key: 'city', label: params.city, href: without('city') });
  if (params.month) chips.push({ key: 'month', label: upcomingMonths(24).find((m) => m.value === params.month)?.label ?? params.month, href: without('month') });
  if (params.category) chips.push({ key: 'category', label: categories.find((c) => c.slug === params.category)?.name ?? params.category, href: without('category') });
  for (const t of csv(params.tier)) chips.push({ key: `tier-${t}`, label: TIER_LABEL[t as PackageTier] ?? t, href: without('tier', t) });
  for (const s of csv(params.stars)) chips.push({ key: `stars-${s}`, label: `${s}-star hotels`, href: without('stars', s) });
  for (const s of csv(params.services)) chips.push({ key: `svc-${s}`, label: `${s[0]!.toUpperCase()}${s.slice(1)} included`, href: without('services', s) });
  if (params.minDays || params.maxDays) chips.push({ key: 'days', label: `${params.minDays ?? '…'}–${params.maxDays ?? '…'} days`, href: buildSearchHref('/packages', { ...params, minDays: undefined, maxDays: undefined, page: undefined }) });
  if (params.minPrice || params.maxPrice) {
    chips.push({
      key: 'price',
      label: `${params.minPrice ? formatMoney(params.minPrice) : '…'} – ${params.maxPrice ? formatMoney(params.maxPrice) : '…'}`,
      href: buildSearchHref('/packages', { ...params, minPrice: undefined, maxPrice: undefined, page: undefined }),
    });
  }
  if (params.from || params.to) chips.push({ key: 'dates', label: `${params.from ?? '…'} → ${params.to ?? '…'}`, href: buildSearchHref('/packages', { ...params, from: undefined, to: undefined, page: undefined }) });
  return chips;
}

export function ActiveFilters({ chips }: { chips: Chip[] }) {
  if (chips.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Active filters">
      {chips.map((c) => (
        <li key={c.key}>
          <Link href={c.href} className="inline-flex items-center gap-1.5 rounded-full border bg-card py-1 ps-3 pe-2 text-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" aria-label={`Remove filter: ${c.label}`}>
            {c.label} <X className="size-3.5 text-muted-foreground" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
