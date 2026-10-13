import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Container } from '@/components/layout/section';
import { ArticleBody } from '@/components/public/content-page';
import { PageHero } from '@/components/public/page-hero';
import { JsonLd } from '@/components/seo/json-ld';
import { formatDate } from '@/lib/format';
import { getCompany, getPost, getPosts } from '@/lib/public-api';
import { articleJsonLd, buildMetadata } from '@/lib/seo';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return { title: 'Guide not found', robots: { index: false } };
  return buildMetadata({
    title: post.seo.title ?? post.title,
    description: post.seo.description,
    path: `/umrah-guide/${post.slug}`,
    type: 'article',
    image: post.coverUrl,
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
  });
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  if (post.type !== 'GUIDE') permanentRedirect(`/blog/${post.slug}`);

  const [company, all] = await Promise.all([getCompany(), getPosts({ type: 'GUIDE', pageSize: 50 })]);
  const idx = all.items.findIndex((p) => p.slug === post.slug);
  const prev = idx > 0 ? all.items[idx - 1] : undefined;
  const next = idx >= 0 ? all.items[idx + 1] : undefined;

  return (
    <>
      <JsonLd
        data={articleJsonLd({
          title: post.title,
          description: post.seo.description,
          path: `/umrah-guide/${post.slug}`,
          image: post.coverUrl,
          published: post.publishedAt,
          modified: post.updatedAt,
          author: post.authorName,
          publisher: company.name,
        })}
      />
      <PageHero
        eyebrow={`Umrah guide${idx >= 0 ? ` · Part ${idx + 1} of ${all.items.length}` : ''}`}
        title={post.title}
        description={post.excerpt ?? undefined}
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Umrah guide', path: '/umrah-guide' }, { name: post.title }]}
      />
      <ArticleBody content={post.content}>
        <p className="mt-10 text-sm text-muted-foreground">Updated {formatDate(post.updatedAt)}</p>
      </ArticleBody>
      <Container className="pb-14">
        <nav aria-label="Guide navigation" className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          {prev ? (
            <Link href={`/umrah-guide/${prev.slug}`} rel="prev" className="rounded-xl border p-4 transition-colors hover:bg-accent">
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="size-3 rtl:rotate-180" aria-hidden /> Previous</span>
              <span className="mt-1 block font-medium">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={`/umrah-guide/${next.slug}`} rel="next" className="rounded-xl border p-4 text-end transition-colors hover:bg-accent">
              <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">Next <ArrowRight className="size-3 rtl:rotate-180" aria-hidden /></span>
              <span className="mt-1 block font-medium">{next.title}</span>
            </Link>
          )}
        </nav>
      </Container>
    </>
  );
}
