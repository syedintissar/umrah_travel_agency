import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, Info, StickyNote } from 'lucide-react';
import { isSafeHref, type CmsBlock, type CmsContent } from '@umrah/shared';
import { Star8 } from '@/components/brand/ornament';
import { InlineText } from '@/components/content/inline-text';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { slugify } from '@/lib/content';
import { cn } from '@/lib/utils';

const CALLOUT = {
  info: { icon: Info, box: 'border-info/30 bg-info/8', accent: 'text-info' },
  success: { icon: CheckCircle2, box: 'border-success/30 bg-success/8', accent: 'text-success' },
  warning: { icon: AlertTriangle, box: 'border-warning/40 bg-warning/10', accent: 'text-warning' },
  note: { icon: StickyNote, box: 'border-gold/40 bg-gold/10', accent: 'text-gold-foreground dark:text-gold' },
} as const;

function Block({ block }: { block: CmsBlock }) {
  switch (block.type) {
    case 'heading': {
      const id = slugify(block.text);
      const cls = { 2: 'mt-10 mb-3 text-2xl sm:text-3xl', 3: 'mt-8 mb-2 text-xl sm:text-2xl', 4: 'mt-6 mb-2 text-lg' }[block.level];
      const Tag = `h${block.level}` as 'h2' | 'h3' | 'h4';
      return <Tag id={id} className={cn('scroll-mt-24 font-semibold', cls)}><InlineText text={block.text} /></Tag>;
    }
    case 'paragraph':
      return <p className="my-4 leading-relaxed text-foreground/90"><InlineText text={block.text} /></p>;
    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul';
      return (
        <Tag className={cn('my-4 space-y-2 ps-6 text-foreground/90', block.ordered ? 'list-decimal' : 'list-disc', 'marker:text-primary')}>
          {block.items.map((item, i) => <li key={i} className="leading-relaxed ps-1"><InlineText text={item} /></li>)}
        </Tag>
      );
    }
    case 'callout': {
      const { icon: Icon, box, accent } = CALLOUT[block.tone];
      return (
        <aside className={cn('my-6 flex gap-3 rounded-xl border p-4', box)}>
          <Icon className={cn('mt-0.5 size-5 shrink-0', accent)} aria-hidden />
          <div className="min-w-0 text-sm leading-relaxed">
            {block.title && <p className="mb-1 font-semibold">{block.title}</p>}
            <p><InlineText text={block.text} /></p>
          </div>
        </aside>
      );
    }
    case 'image':
      return (
        <figure className="my-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- CMS images can come from any HTTPS host */}
          <img src={block.url} alt={block.alt} loading="lazy" className="h-auto w-full rounded-xl border" />
          {block.caption && <figcaption className="mt-2 text-center text-sm text-muted-foreground">{block.caption}</figcaption>}
        </figure>
      );
    case 'steps':
      return (
        <ol className="my-6 space-y-4">
          {block.items.map((s, i) => (
            <li key={i} className="flex gap-4 rounded-xl border bg-card p-4 shadow-card">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary font-display text-base font-semibold text-primary-foreground">{i + 1}</span>
              <div>
                <p className="font-display text-lg font-semibold">{s.title}</p>
                <p className="mt-1 leading-relaxed text-muted-foreground"><InlineText text={s.text} /></p>
              </div>
            </li>
          ))}
        </ol>
      );
    case 'table':
      return (
        <div className="my-6 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[32rem] text-sm">
            <thead className="bg-muted/60 text-start">
              <tr>{block.headers.map((h, i) => <th key={i} scope="col" className="px-4 py-3 text-start font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {block.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="px-4 py-3 align-top"><InlineText text={c} /></td>)}</tr>)}
            </tbody>
          </table>
        </div>
      );
    case 'quote':
      return (
        <blockquote className="my-6 border-s-4 border-gold ps-5">
          <p className="font-display text-xl leading-relaxed italic">{block.text}</p>
          {block.cite && <footer className="mt-2 text-sm text-muted-foreground">— {block.cite}</footer>}
        </blockquote>
      );
    case 'cta':
      return (
        <div className="my-8 flex flex-col items-start gap-4 rounded-2xl bg-sidebar p-6 text-sidebar-foreground bg-pattern sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-lg text-base">{block.text ?? block.label}</p>
          <Button asChild variant="gold" size="lg">
            {isSafeHref(block.href) && block.href.startsWith('/') ? (
              <Link href={block.href}>{block.label} <ArrowRight className="rtl:rotate-180" /></Link>
            ) : (
              <a href={isSafeHref(block.href) ? block.href : '#'} {...(block.href.startsWith('https://') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{block.label} <ArrowRight /></a>
            )}
          </Button>
        </div>
      );
    case 'faq':
      return (
        <Accordion type="multiple" className="my-6 rounded-xl border px-4">
          {block.items.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-start text-base">{f.question}</AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-muted-foreground"><InlineText text={f.answer} /></AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      );
    case 'divider':
      return <div className="my-8 flex justify-center" role="separator"><Star8 className="size-4" /></div>;
    default:
      return null;
  }
}

/** Renders CMS content. Blocks come from validated JSON; there is no raw-HTML path. */
export function BlockRenderer({ content, className }: { content: CmsContent; className?: string }) {
  if (content.blocks.length === 0) return null;
  return (
    <div className={cn('max-w-none text-base', className)}>
      {content.blocks.map((block, i) => <Block key={i} block={block} />)}
    </div>
  );
}
