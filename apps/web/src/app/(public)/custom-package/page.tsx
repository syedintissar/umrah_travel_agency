import { CalendarCheck, ClipboardList, MessageSquareQuote } from 'lucide-react';
import { Container } from '@/components/layout/section';
import { CustomPackageForm } from '@/components/forms/lead-forms';
import { PageHero } from '@/components/public/page-hero';
import { Card } from '@/components/ui/card';
import { getPackages } from '@/lib/public-api';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Request a customized Umrah package',
  description: 'Tell us your preferred dates, hotels, transport, group size and budget and receive a tailored quotation.',
  path: '/custom-package',
});

const NEXT = [
  { icon: ClipboardList, title: 'We review your needs', text: 'A consultant checks hotel and transport availability for your dates.' },
  { icon: MessageSquareQuote, title: 'You receive a quotation', text: 'A clear, itemised quotation with a validity date.' },
  { icon: CalendarCheck, title: 'Confirm when ready', text: 'Accept the quotation and we turn it into your booking.' },
];

export default async function CustomPackagePage() {
  const cities = await getPackages({ pageSize: 1 }).then((r) => r.facets.cities).catch(() => [] as string[]);
  return (
    <>
      <PageHero eyebrow="Customized package" title="Plan an Umrah that fits you" description="Share your requirements. There is no obligation, and we reply with a tailored quotation." breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Customized package' }]} />
      <Container className="py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
          <CustomPackageForm cities={cities} />
          <aside aria-label="What happens next" className="lg:sticky lg:top-24 lg:self-start">
            <Card className="gap-5 p-6 shadow-card">
              <h2 className="font-sans text-base font-semibold">What happens next</h2>
              <ol className="space-y-5">
                {NEXT.map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" aria-hidden /></span>
                    <span>
                      <span className="block font-medium">{title}</span>
                      <span className="block text-sm text-muted-foreground">{text}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </Card>
          </aside>
        </div>
      </Container>
    </>
  );
}
