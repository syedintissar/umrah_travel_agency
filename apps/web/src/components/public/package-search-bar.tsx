import { CalendarDays, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { upcomingMonths } from '@/lib/package-search';

const selectCls =
  'h-12 w-full appearance-none rounded-lg border border-input bg-background ps-10 pe-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

/**
 * Hero search. A plain GET form to /packages, so it works without JavaScript and the result is a shareable URL.
 */
export function PackageSearchBar({ cities }: { cities: string[] }) {
  const months = upcomingMonths(12);
  return (
    <form action="/packages" method="get" role="search" aria-label="Find an Umrah package" className="grid gap-3 rounded-2xl bg-background p-3 text-foreground shadow-elevated sm:grid-cols-[1fr_1fr_auto] sm:p-4">
      <label className="relative block">
        <span className="sr-only">Departure city</span>
        <MapPin className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-primary" aria-hidden />
        <select name="city" defaultValue="" className={selectCls}>
          <option value="">Any departure city</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className="relative block">
        <span className="sr-only">Travel month</span>
        <CalendarDays className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-primary" aria-hidden />
        <select name="month" defaultValue="" className={selectCls}>
          <option value="">Any month</option>
          {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </label>
      <Button type="submit" variant="gold" size="xl" className="w-full sm:w-auto"><Search /> Search packages</Button>
    </form>
  );
}
