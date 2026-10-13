import * as React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { JsonLd } from '@/components/seo/json-ld';
import { Container } from '@/components/layout/section';
import { breadcrumbJsonLd } from '@/lib/seo';
import { cn } from '@/lib/utils';

export interface Crumb { name: string; path?: string }

/** Visible breadcrumb trail plus BreadcrumbList structured data. The last crumb is the current page. */
export function PublicBreadcrumbs({ items, invert, className }: { items: Crumb[]; invert?: boolean; className?: string }) {
  const linkable = items.filter((c): c is Required<Crumb> => Boolean(c.path));
  return (
    <>
      <nav aria-label="Breadcrumb" className={className}>
        <ol className={cn('flex flex-wrap items-center gap-1.5 text-sm', invert ? 'text-sidebar-foreground/75' : 'text-muted-foreground')}>
          {items.map((c, i) => {
            const last = i === items.length - 1;
            return (
              <React.Fragment key={`${c.name}-${i}`}>
                <li>
                  {last || !c.path ? (
                    <span aria-current={last ? 'page' : undefined} className={invert ? 'text-sidebar-foreground' : 'text-foreground'}>{c.name}</span>
                  ) : (
                    <Link href={c.path} className="hover:underline focus-visible:underline">{c.name}</Link>
                  )}
                </li>
                {!last && <li aria-hidden><ChevronRight className="size-3.5 rtl:rotate-180" /></li>}
              </React.Fragment>
            );
          })}
        </ol>
      </nav>
      {linkable.length > 1 && <JsonLd data={breadcrumbJsonLd(linkable)} />}
    </>
  );
}

interface PageHeroProps {
  title: string;
  description?: string;
  eyebrow?: string;
  breadcrumbs?: Crumb[];
  children?: React.ReactNode;
  className?: string;
}

/** Inner-page header band (the home page has its own hero). Renders the page's single <h1>. */
export function PageHero({ title, description, eyebrow, breadcrumbs, children, className }: PageHeroProps) {
  return (
    <header className={cn('relative isolate overflow-hidden bg-sidebar text-sidebar-foreground bg-pattern', className)}>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/30 via-transparent to-sidebar/80" aria-hidden />
      <Container className="py-10 sm:py-14">
        {breadcrumbs && <PublicBreadcrumbs items={breadcrumbs} invert className="mb-5" />}
        {eyebrow && <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-gold uppercase">{eyebrow}</p>}
        <h1 className="max-w-3xl text-3xl font-semibold sm:text-5xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-base text-sidebar-foreground/80 sm:text-lg">{description}</p>}
        {children && <div className="mt-6">{children}</div>}
      </Container>
    </header>
  );
}
