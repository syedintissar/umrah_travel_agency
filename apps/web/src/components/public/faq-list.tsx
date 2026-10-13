import type { FaqDto } from '@umrah/shared';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { JsonLd } from '@/components/seo/json-ld';
import { faqJsonLd } from '@/lib/seo';

/** Accordion list of FAQs. Emits FAQPage structured data when `structuredData` is set (once per page). */
export function FaqList({ faqs, structuredData }: { faqs: Pick<FaqDto, 'question' | 'answer'>[]; structuredData?: boolean }) {
  if (faqs.length === 0) return null;
  return (
    <>
      <Accordion type="single" collapsible className="rounded-2xl border bg-card px-5 shadow-card">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`q-${i}`}>
            <AccordionTrigger className="py-5 text-start text-base font-medium">{f.question}</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed text-muted-foreground">{f.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {structuredData && <JsonLd data={faqJsonLd(faqs)} />}
    </>
  );
}
