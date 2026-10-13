import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';
import type { CmsContent } from '@umrah/shared';
import { BlockRenderer } from '@/components/content/block-renderer';
import { EmptyState } from '@/components/feedback/states';
import { Container } from '@/components/layout/section';
import { PageHero, type Crumb } from '@/components/public/page-hero';
import { Button } from '@/components/ui/button';
import { headingsOf } from '@/lib/content';

/** Article body with an optional sticky table of contents (shown when there are 3+ sections). */
export function ArticleBody({ content, children }: { content: CmsContent; children?: React.ReactNode }) {
  const toc = headingsOf(content);
  return (
    <Container className="py-10 sm:py-14">
      <div className={toc.length >= 3 ? 'grid gap-10 lg:grid-cols-[1fr_15rem]' : 'mx-auto max-w-3xl'}>
        <div className="min-w-0 max-w-3xl">
          <BlockRenderer content={content} />
          {children}
        </div>
        {toc.length >= 3 && (
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-24 rounded-xl border bg-card p-4 text-sm shadow-card">
              <p className="mb-2 font-semibold">On this page</p>
              <ul className="space-y-1.5">
                {toc.map((h) => <li key={h.id}><a href={`#${h.id}`} className="text-muted-foreground hover:text-primary hover:underline">{h.text}</a></li>)}
              </ul>
            </div>
          </nav>
        )}
      </div>
    </Container>
  );
}

/** Shown when a main-navigation CMS page has not been published yet (instead of a dead end). */
export function PendingPage({ title, description, breadcrumbs }: { title: string; description: string; breadcrumbs: Crumb[] }) {
  return (
    <>
      <PageHero title={title} description={description} breadcrumbs={breadcrumbs} />
      <Container className="py-14">
        <EmptyState
          icon={Info}
          title="This page is being prepared"
          description="Our team is adding the content. In the meantime, you can ask us directly."
          action={<Button asChild><Link href="/contact">Contact us <ArrowRight className="rtl:rotate-180" /></Link></Button>}
        />
      </Container>
    </>
  );
}

export function CtaPanel({ title, text, href, label }: { title: string; text: string; href: string; label: string }) {
  return (
    <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl bg-sidebar p-6 text-sidebar-foreground bg-pattern sm:flex-row sm:items-center sm:p-8">
      <div><h2 className="text-2xl font-semibold">{title}</h2><p className="mt-1 max-w-md text-sidebar-foreground/80">{text}</p></div>
      <Button asChild variant="gold" size="lg"><Link href={href}>{label} <ArrowRight className="rtl:rotate-180" /></Link></Button>
    </div>
  );
}
