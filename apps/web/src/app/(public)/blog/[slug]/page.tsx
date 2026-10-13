import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { Container } from '@/components/layout/section';
import { PostCard } from '@/components/public/cards';
import { ArticleBody } from '@/components/public/content-page';
import { PageHero } from '@/components/public/page-hero';
import { JsonLd } from '@/components/seo/json-ld';
import { formatDate } from '@/lib/format';
import { getCompany, getPost } from '@/lib/public-api';
import { articleJsonLd, buildMetadata } from '@/lib/seo';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return { title: 'Post not found', robots: { index: false } };
  return buildMetadata({
    title: post.seo.title ?? post.title,
    description: post.seo.description,
    path: `/blog/${post.slug}`,
    type: 'article',
    image: post.coverUrl,
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  if (post.type === 'GUIDE') permanentRedirect(`/umrah-guide/${post.slug}`);
  const company = await getCompany();

  return (
    <>
      <JsonLd
        data={articleJsonLd({
          title: post.title,
          description: post.seo.description,
          path: `/blog/${post.slug}`,
          image: post.coverUrl,
          published: post.publishedAt,
          modified: post.updatedAt,
          author: post.authorName,
          publisher: company.name,
        })}
      />
      <PageHero
        eyebrow={post.category?.name ?? 'Blog'}
        title={post.title}
        description={[post.publishedAt ? formatDate(post.publishedAt) : null, post.authorName, post.readingMinutes ? `${post.readingMinutes} min read` : null].filter(Boolean).join(' · ')}
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }, { name: post.title }]}
      />
      <ArticleBody content={post.content} />
      {post.related.length > 0 && (
        <Container className="pb-14">
          <h2 className="mb-5 text-2xl font-semibold">Keep reading</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {post.related.map((p) => <PostCard key={p.slug} post={p} base="/blog" />)}
          </div>
        </Container>
      )}
    </>
  );
}
