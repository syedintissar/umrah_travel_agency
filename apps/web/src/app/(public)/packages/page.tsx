import Link from 'next/link';
import { SearchX } from 'lucide-react';
import type { Metadata } from 'next';
import { PackageCard } from '@/components/commerce/package-card';
import { EmptyState } from '@/components/feedback/states';
import { Container } from '@/components/layout/section';
import { ActiveFilters, activeFilterChips } from '@/components/public/active-filters';
import { PageHero } from '@/components/public/page-hero';
import { PackageFilters } from '@/components/public/package-filters';
import { PackageSort } from '@/components/public/package-sort';
import { Pagination } from '@/components/public/pagination';
import { Button } from '@/components/ui/button';
import { buildSearchHref, parsePackageSearch, type RawSearchParams } from '@/lib/package-search';
import { getPackages } from '@/lib/public-api';
import { buildMetadata } from '@/lib/seo';
import { pluralize } from '@/lib/format';

type Props = { searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { params } = parsePackageSearch(await searchParams);
  const filtered = Object.keys(params).some((k) => k !== 'page');
  const page = Number(params.page ?? 1);
  return buildMetadata({
    title: page > 1 ? `Umrah packages (page ${page})` : 'Umrah packages',
    description: 'Compare Umrah packages by departure city, dates, price, duration and hotel category. Visa support included.',
    // Filtered views are not indexed; they canonicalise to the main listing.
    path: filtered ? '/packages' : page > 1 ? `/packages?page=${page}` : '/packages',
    noindex: filtered,
  });
}

export default async function PackagesPage({ searchParams }: Props) {
  const { query, params } = parsePackageSearch(await searchParams);
  const data = await getPackages(query);
  const { items, meta, facets } = data;

  const chips = activeFilterChips(params, facets.categories);
  const activeCount = chips.length;
  const paramsNoPage = { ...params };
  delete paramsNoPage.page;

  return (
    <>
      <PageHero
        eyebrow="Umrah packages"
        title="Choose your Umrah package"
        description="Prices are per person. Every package includes the services listed, with visa support from our team."
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Packages' }]}
      />
      <Container className="py-10">
        <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
          <PackageFilters facets={facets} params={params} activeCount={activeCount} />

          <section aria-label="Package results">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
                <span className="font-semibold text-foreground">{pluralize(meta.total, 'package')}</span>{activeCount > 0 ? ' match your filters' : ' available'}
              </p>
              <PackageSort params={paramsNoPage} current={query.sort} />
            </div>
            {activeCount > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <ActiveFilters chips={chips} />
                <Link href={buildSearchHref('/packages', { sort: params.sort })} className="text-sm font-medium text-primary hover:underline">Clear all</Link>
              </div>
            )}

            {items.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No packages match your search"
                description={activeCount > 0 ? 'Try removing a filter, or tell us what you need and we will build a package for you.' : 'New packages are added regularly. Tell us what you need and we will build one for you.'}
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    {activeCount > 0 && <Button asChild variant="outline"><Link href={buildSearchHref('/packages', { sort: params.sort })}>Clear filters</Link></Button>}
                    <Button asChild><Link href="/custom-package">Request a custom package</Link></Button>
                  </div>
                }
              />
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((p, i) => <PackageCard key={p.id} pkg={p} priority={i < 3} className="h-full" />)}
                </div>
                <Pagination base="/packages" params={paramsNoPage} page={meta.page} pageCount={meta.pageCount} />
              </>
            )}
          </section>
        </div>
      </Container>
    </>
  );
}
