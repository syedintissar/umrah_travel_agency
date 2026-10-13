import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buildSearchHref } from '@/lib/package-search';
import { cn } from '@/lib/utils';

interface PaginationProps {
  base: string;
  params: Record<string, string>;
  page: number;
  pageCount: number;
}

/** Server-rendered pagination using plain links (crawlable, works without JavaScript). */
export function Pagination({ base, params, page, pageCount }: PaginationProps) {
  if (pageCount <= 1) return null;
  const href = (p: number) => buildSearchHref(base, params, { page: p === 1 ? undefined : String(p) });
  const window = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount));
  const pages = [...window].sort((a, b) => a - b);
  const item = 'grid h-10 min-w-10 place-items-center rounded-lg border px-3 text-sm font-medium transition-colors';

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={cn(item, 'hover:bg-accent')} aria-label="Previous page"><ChevronLeft className="size-4 rtl:rotate-180" /></Link>
      ) : (
        <span className={cn(item, 'opacity-40')} aria-hidden><ChevronLeft className="size-4 rtl:rotate-180" /></span>
      )}
      {pages.map((p, i) => (
        <span key={p} className="contents">
          {i > 0 && p - pages[i - 1]! > 1 && <span className="px-1 text-muted-foreground" aria-hidden>…</span>}
          <Link href={href(p)} aria-current={p === page ? 'page' : undefined} aria-label={`Page ${p}`} className={cn(item, p === page ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent')}>{p}</Link>
        </span>
      ))}
      {page < pageCount ? (
        <Link href={href(page + 1)} rel="next" className={cn(item, 'hover:bg-accent')} aria-label="Next page"><ChevronRight className="size-4 rtl:rotate-180" /></Link>
      ) : (
        <span className={cn(item, 'opacity-40')} aria-hidden><ChevronRight className="size-4 rtl:rotate-180" /></span>
      )}
    </nav>
  );
}
