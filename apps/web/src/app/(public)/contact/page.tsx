import { Container } from '@/components/layout/section';
import { ContactForm } from '@/components/forms/lead-forms';
import { ContactDetails, MapEmbed } from '@/components/public/contact-widgets';
import { PageHero } from '@/components/public/page-hero';
import { Card } from '@/components/ui/card';
import { getCompany } from '@/lib/public-api';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Contact us',
  description: 'Phone, WhatsApp, email and office details, or send us an enquiry.',
  path: '/contact',
});

export default async function ContactPage() {
  const company = await getCompany();
  return (
    <>
      <PageHero eyebrow="Contact" title="Talk to our team" description="Send an enquiry and a consultant will get back to you." breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Contact' }]} />
      <Container className="py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_24rem]">
          <Card className="p-6 shadow-card sm:p-8">
            <h2 className="mb-6 text-2xl font-semibold">Send us a message</h2>
            <ContactForm />
          </Card>
          <div className="space-y-8">
            <section aria-labelledby="details">
              <h2 id="details" className="mb-4 text-2xl font-semibold">Contact details</h2>
              <ContactDetails company={company} />
            </section>
            <MapEmbed url={company.mapEmbedUrl} title={`${company.name} office location`} />
          </div>
        </div>
      </Container>
    </>
  );
}
