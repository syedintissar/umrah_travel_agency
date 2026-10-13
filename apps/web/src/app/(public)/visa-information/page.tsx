import type { Metadata } from 'next';
import { Container } from '@/components/layout/section';
import { ArticleBody, CtaPanel, PendingPage } from '@/components/public/content-page';
import { FaqList } from '@/components/public/faq-list';
import { PageHero } from '@/components/public/page-hero';
import { getFaqs, getPage } from '@/lib/public-api';
import { buildMetadata } from '@/lib/seo';

const CRUMBS = [{ name: 'Home', path: '/' }, { name: 'Visa information' }];

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('visa-information');
  return buildMetadata({
    title: page?.seo.title ?? 'Umrah visa information',
    description: page?.seo.description ?? 'Requirements, process, documents and timelines for an Umrah visa.',
    path: '/visa-information',
  });
}

export default async function VisaInformationPage() {
  const [page, faqs] = await Promise.all([getPage('visa-information'), getFaqs('visa')]);
  if (!page) return <PendingPage title="Umrah visa information" description="Requirements, process, documents and timelines." breadcrumbs={CRUMBS} />;
  return (
    <>
      <PageHero eyebrow="Visa" title={page.title} description={page.excerpt ?? undefined} breadcrumbs={CRUMBS} />
      <ArticleBody content={page.content} />
      <Container className="pb-14">
        {faqs.length > 0 && (
          <section aria-labelledby="visa-faq" className="mx-auto max-w-3xl">
            <h2 id="visa-faq" className="mb-5 text-2xl font-semibold sm:text-3xl">Visa questions</h2>
            <FaqList faqs={faqs} />
          </section>
        )}
        <CtaPanel title="Our visa team handles it for you" text="Book a package and upload your documents securely; we review and submit them." href="/packages" label="Browse packages" />
      </Container>
    </>
  );
}
