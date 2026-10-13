import { HelpCircle } from 'lucide-react';
import { EmptyState } from '@/components/feedback/states';
import { Container } from '@/components/layout/section';
import { CtaPanel } from '@/components/public/content-page';
import { FaqList } from '@/components/public/faq-list';
import { PageHero } from '@/components/public/page-hero';
import { JsonLd } from '@/components/seo/json-ld';
import { humanize } from '@/lib/format';
import { getFaqs } from '@/lib/public-api';
import { buildMetadata, faqJsonLd } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Frequently asked questions',
  description: 'Answers about booking, payments, visas and travel for your Umrah journey.',
  path: '/faq',
});

const TITLES: Record<string, string> = { general: 'General', booking: 'Booking', payments: 'Payments', visa: 'Visa', travel: 'Travel' };

export default async function FaqPage() {
  const faqs = await getFaqs();
  const categories = [...new Set(faqs.map((f) => f.category))];
  return (
    <>
      <PageHero eyebrow="Help" title="Frequently asked questions" description="Can’t find your answer? Contact our team." breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'FAQ' }]} />
      <Container className="py-10">
        {faqs.length === 0 ? (
          <EmptyState icon={HelpCircle} title="No questions published yet" description="Ask us anything and we will get back to you." />
        ) : (
          <div className="mx-auto max-w-3xl space-y-10">
            {categories.length > 1 && (
              <nav aria-label="FAQ categories" className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <a key={c} href={`#faq-${c}`} className="rounded-full border bg-card px-4 py-2 text-sm font-medium hover:bg-accent">
                    {TITLES[c] ?? humanize(c)}
                  </a>
                ))}
              </nav>
            )}
            {categories.map((c) => (
              <section key={c} id={`faq-${c}`} aria-labelledby={`h-${c}`} className="scroll-mt-24">
                <h2 id={`h-${c}`} className="mb-4 text-2xl font-semibold">{TITLES[c] ?? humanize(c)}</h2>
                <FaqList faqs={faqs.filter((f) => f.category === c)} />
              </section>
            ))}
            <JsonLd data={faqJsonLd(faqs)} />
          </div>
        )}
        <CtaPanel title="Still have a question?" text="A consultant will be happy to help." href="/contact" label="Contact us" />
      </Container>
    </>
  );
}
