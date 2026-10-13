import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArticleBody } from '@/components/public/content-page';
import { PageHero } from '@/components/public/page-hero';
import { formatDate } from '@/lib/format';
import { getPage } from '@/lib/public-api';
import { buildMetadata } from '@/lib/seo';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug, 'POLICY');
  if (!page) return { title: 'Policy not found', robots: { index: false } };
  return buildMetadata({ title: page.title, description: page.seo.description, path: `/policies/${slug}` });
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPage(slug, 'POLICY');
  if (!page) notFound();
  return (
    <>
      <PageHero title={page.title} description={`Last updated ${formatDate(page.updatedAt)}`} breadcrumbs={[{ name: 'Home', path: '/' }, { name: page.title }]} />
      <ArticleBody content={page.content} />
    </>
  );
}
