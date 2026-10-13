'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PACKAGE_SORTS, type PackageSort } from '@umrah/shared';
import { buildSearchHref, SORT_LABELS } from '@/lib/package-search';

export function PackageSort({ params, current }: { params: Record<string, string>; current: PackageSort }) {
  const router = useRouter();
  const id = React.useId();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm whitespace-nowrap text-muted-foreground">Sort by</label>
      <select
        id={id}
        value={current}
        onChange={(e) => {
          const value = e.target.value as PackageSort;
          router.push(buildSearchHref('/packages', params, { sort: value === 'featured' ? undefined : value, page: undefined }), { scroll: false });
        }}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {PACKAGE_SORTS.map((s) => <option key={s} value={s}>{SORT_LABELS[s]}</option>)}
      </select>
    </div>
  );
}
