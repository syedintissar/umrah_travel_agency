import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import type { Metadata } from 'next';
import { EmptyState } from '@/components/feedback/states';
import { Container } from '@/components/layout/section';
import { PostCard } from '@/components/public/cards';
import { PageHero } from '@/components/public/page-hero';
import { Pagination } from '@/components/public/pagination';
import { getPostCategories, getPosts } from '@/lib/public-api';
import { buildMetadata } from '@/lib/seo';
import { cn } from '@/lib/utils';

type Props = { searchParams: Promise<{ page?: string; category?: string }> };
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page, category } = await searchParams;
  const n = Math.max(1, Number(page) || 1);
  return buildMetadata({
    title: n > 1 ? `Blog (page ${n})` : 'Blog',
    description: 'Travel tips, planning advice and updates for your Umrah journey.',
    path: category ? '/blog' : n > 1 ? `/blog?page=${n}` : '/blog',
    noindex: Boolean(category),
  });
}

export default async function BlogPage({ searchParams }: Props) {
  const sp = await searchParams;
  const category = sp.category && SLUG.test(sp.category) ? sp.category : undefined;
  const page = Math.min(1000, Math.max(1, Math.floor(Number(sp.page)) || 1));
  const [{ items, meta }, categories] = await Promise.all([
    getPosts({ type: 'BLOG', category, page, pageSize: 9 }),
    getPostCategories('BLOG'),
  ]);
  const chip = (active: boolean) =>
    cn('rounded-full border px-4 py-2 text-sm font-medium transition-colors', active ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-accent');

  return (
    <>
      <PageHero eyebrow="Blog" title="Travel tips and updates" description="Practical advice and announcements to help you plan with confidence." breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Blog' }]} />
      <Container className="py-10">
        {categories.length > 0 && (
          <nav aria-label="Blog categories" className="mb-8 flex flex-wrap gap-2">
            <Link href="/blog" className={chip(!category)} aria-current={!category ? 'true' : undefined}>All</Link>
            {categories.map((c) => (
              <Link key={c.slug} href={`/blog?category=${c.slug}`} className={chip(category === c.slug)} aria-current={category === c.slug ? 'true' : undefined}>
                {c.name} ({c.count})
              </Link>
            ))}
          </nav>
        )}
        {items.length === 0 ? (
          <EmptyState icon={Newspaper} title="No posts yet" description="We publish new articles regularly. Check back soon." />
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => <PostCard key={p.slug} post={p} base="/blog" />)}
            </div>
            <Pagination base="/blog" params={category ? { category } : {}} page={meta.page} pageCount={meta.pageCount} />
          </>
        )}
      </Container>
    </>
  );
}
