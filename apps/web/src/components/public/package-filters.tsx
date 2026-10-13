'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import type { PackageFacetsDto } from '@umrah/shared';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { buildSearchHref, upcomingMonths } from '@/lib/package-search';
import { TIER_LABEL } from '@/types/catalog';

interface Props {
  facets: PackageFacetsDto;
  /** Current URL params (already validated). */
  params: Record<string, string>;
  activeCount: number;
}

const csv = (v: string | undefined) => (v ? v.split(',') : []);
const selectCls = 'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

function CheckRow({ id, name, value, label, checked }: { id: string; name: string; value: string; label: React.ReactNode; checked: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Checkbox id={id} name={name} value={value} defaultChecked={checked} />
      <Label htmlFor={id} className="cursor-pointer text-sm font-normal">{label}</Label>
    </div>
  );
}

function Group({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-2.5 border-b pb-5 last:border-0">
      <legend className="mb-1 text-sm font-semibold">{legend}</legend>
      {children}
    </fieldset>
  );
}

/**
 * Filter form. It is a real GET form (works without JS, shareable URLs); with JS, changes apply automatically.
 * `sort` is preserved through a hidden field and the page number is reset on every change.
 */
function FilterForm({ facets, params, idPrefix, onApplied, showApply }: Props & { idPrefix: string; onApplied?: () => void; showApply?: boolean }) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const months = React.useMemo(() => upcomingMonths(12), []);

  const apply = React.useCallback(() => {
    const form = formRef.current;
    if (!form) return;
    const next = new URLSearchParams();
    for (const [k, v] of new FormData(form).entries()) {
      const value = String(v).trim();
      if (value) next.append(k, value);
    }
    const qs = next.toString();
    router.push(qs ? `/packages?${qs}` : '/packages', { scroll: false });
    onApplied?.();
  }, [router, onApplied]);

  const schedule = (delay: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(apply, delay);
  };
  React.useEffect(() => () => clearTimeout(timer.current), []);

  const tiers = csv(params.tier);
  const stars = csv(params.stars);
  const services = csv(params.services);
  const idOf = (s: string) => `${idPrefix}-${s}`;

  return (
    <form
      ref={formRef}
      action="/packages"
      method="get"
      aria-label="Filter packages"
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      onChange={(e) => {
        // Text/number fields wait for a pause; selects and checkboxes apply right away.
        const t = e.target as unknown as HTMLInputElement;
        schedule(t.type === 'number' || t.type === 'search' ? 700 : 150);
      }}
    >
      {params.sort && <input type="hidden" name="sort" value={params.sort} />}

      <Group legend="Search">
        <Label htmlFor={idOf('q')} className="sr-only">Search packages</Label>
        <Input id={idOf('q')} type="search" name="q" defaultValue={params.q ?? ''} placeholder="e.g. Ramadan, family" />
      </Group>

      {facets.cities.length > 0 && (
        <Group legend="Departure city">
          <Label htmlFor={idOf('city')} className="sr-only">Departure city</Label>
          <select id={idOf('city')} name="city" defaultValue={params.city ?? ''} className={selectCls}>
            <option value="">All cities</option>
            {facets.cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Group>
      )}

      <Group legend="Travel month">
        <Label htmlFor={idOf('month')} className="sr-only">Travel month</Label>
        <select id={idOf('month')} name="month" defaultValue={params.month ?? ''} className={selectCls}>
          <option value="">Any month</option>
          {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </Group>

      {facets.categories.length > 0 && (
        <Group legend="Package type">
          <Label htmlFor={idOf('category')} className="sr-only">Package type</Label>
          <select id={idOf('category')} name="category" defaultValue={params.category ?? ''} className={selectCls}>
            <option value="">All types</option>
            {facets.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name} ({c.count})</option>)}
          </select>
        </Group>
      )}

      {facets.tiers.length > 0 && (
        <Group legend="Package level">
          {facets.tiers.map((t) => (
            <CheckRow key={t.tier} id={idOf(`tier-${t.tier}`)} name="tier" value={t.tier} label={<>{TIER_LABEL[t.tier]} <span className="text-muted-foreground">({t.count})</span></>} checked={tiers.includes(t.tier)} />
          ))}
        </Group>
      )}

      <Group legend="Hotel category">
        {[5, 4, 3].map((n) => <CheckRow key={n} id={idOf(`stars-${n}`)} name="stars" value={String(n)} label={`${n}-star`} checked={stars.includes(String(n))} />)}
      </Group>

      <Group legend="Included services">
        {[['visa', 'Visa'], ['flight', 'Flights'], ['transport', 'Transport'], ['ziyarat', 'Ziyarat']].map(([v, l]) => (
          <CheckRow key={v} id={idOf(`svc-${v}`)} name="services" value={v!} label={l!} checked={services.includes(v!)} />
        ))}
      </Group>

      <Group legend="Duration (days)">
        <div className="grid grid-cols-2 gap-2">
          <div><Label htmlFor={idOf('minDays')} className="sr-only">Minimum days</Label><Input id={idOf('minDays')} type="number" name="minDays" min={1} inputMode="numeric" placeholder={facets.durations ? String(facets.durations.min) : 'Min'} defaultValue={params.minDays ?? ''} /></div>
          <div><Label htmlFor={idOf('maxDays')} className="sr-only">Maximum days</Label><Input id={idOf('maxDays')} type="number" name="maxDays" min={1} inputMode="numeric" placeholder={facets.durations ? String(facets.durations.max) : 'Max'} defaultValue={params.maxDays ?? ''} /></div>
        </div>
      </Group>

      <Group legend="Price per person (PKR)">
        <div className="grid grid-cols-2 gap-2">
          <div><Label htmlFor={idOf('minPrice')} className="sr-only">Minimum price</Label><Input id={idOf('minPrice')} type="number" name="minPrice" min={0} step={1000} inputMode="numeric" placeholder={facets.price ? String(Math.floor(facets.price.min / 1000) * 1000) : 'Min'} defaultValue={params.minPrice ?? ''} /></div>
          <div><Label htmlFor={idOf('maxPrice')} className="sr-only">Maximum price</Label><Input id={idOf('maxPrice')} type="number" name="maxPrice" min={0} step={1000} inputMode="numeric" placeholder={facets.price ? String(Math.ceil(facets.price.max / 1000) * 1000) : 'Max'} defaultValue={params.maxPrice ?? ''} /></div>
        </div>
      </Group>

      <noscript><Button type="submit" className="w-full">Apply filters</Button></noscript>
      {showApply && <Button type="submit" className="w-full lg:hidden">Show results</Button>}
    </form>
  );
}

/** Desktop sidebar + mobile sheet. Only one copy of the form is mounted per viewport size category. */
export function PackageFilters({ facets, params, activeCount }: Props) {
  const [open, setOpen] = React.useState(false);
  const clearHref = buildSearchHref('/packages', { sort: params.sort });

  return (
    <>
      <aside aria-label="Filters" className="hidden lg:block">
        <div className="sticky top-24 rounded-2xl border bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-sans text-base font-semibold">Filters</h2>
            {activeCount > 0 && <Link href={clearHref} className="text-sm font-medium text-primary hover:underline">Clear all</Link>}
          </div>
          <FilterForm key={JSON.stringify(params)} facets={facets} params={params} activeCount={activeCount} idPrefix="d" />
        </div>
      </aside>

      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto"><SlidersHorizontal /> Filters{activeCount > 0 ? ` (${activeCount})` : ''}</Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(24rem,100vw)] gap-0 p-0">
            <SheetHeader className="border-b p-4">
              <SheetTitle>Filter packages</SheetTitle>
              <SheetDescription className="sr-only">Narrow the list of Umrah packages</SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-4">
              <FilterForm key={JSON.stringify(params)} facets={facets} params={params} activeCount={activeCount} idPrefix="m" onApplied={() => setOpen(false)} showApply />
            </div>
            <SheetFooter className="border-t p-4">
              <Button asChild variant="ghost"><Link href={clearHref} onClick={() => setOpen(false)}>Clear all filters</Link></Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
