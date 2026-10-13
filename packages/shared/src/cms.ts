import { z } from 'zod';

/**
 * CMS content model. Pages and posts store `{ version: 1, blocks: [...] }` as JSON.
 * No raw HTML is ever stored or rendered: text supports a tiny inline syntax (**bold**, *italic*, [label](href))
 * that the web renderer turns into React elements, so editor content cannot inject script.
 */

/** Allowed link targets: site paths, https URLs, mailto and tel. */
export const SAFE_HREF = /^(\/(?!\/)[^\s]*|https:\/\/[^\s]+|mailto:[^\s]+|tel:\+?[0-9\s-]+)$/;
export const isSafeHref = (href: string): boolean => SAFE_HREF.test(href);

const text = (max = 5000) => z.string().trim().min(1).max(max);
const href = z.string().trim().max(2000).refine(isSafeHref, 'Unsupported link');

export const blockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('heading'), level: z.union([z.literal(2), z.literal(3), z.literal(4)]), text: text(300) }),
  z.object({ type: z.literal('paragraph'), text: text() }),
  z.object({ type: z.literal('list'), ordered: z.boolean().default(false), items: z.array(text(1000)).min(1).max(100) }),
  z.object({
    type: z.literal('callout'),
    tone: z.enum(['info', 'success', 'warning', 'note']).default('info'),
    title: text(200).optional(),
    text: text(2000),
  }),
  z.object({ type: z.literal('image'), url: href, alt: z.string().trim().max(300), caption: text(500).optional() }),
  z.object({
    type: z.literal('steps'),
    items: z.array(z.object({ title: text(200), text: text(2000) })).min(1).max(50),
  }),
  z.object({
    type: z.literal('table'),
    headers: z.array(text(200)).min(1).max(10),
    rows: z.array(z.array(z.string().trim().max(500)).max(10)).max(200),
  }),
  z.object({ type: z.literal('quote'), text: text(1000), cite: text(200).optional() }),
  z.object({ type: z.literal('cta'), label: text(80), href, text: text(500).optional() }),
  z.object({
    type: z.literal('faq'),
    items: z.array(z.object({ question: text(300), answer: text(3000) })).min(1).max(100),
  }),
  z.object({ type: z.literal('divider') }),
]);

export const cmsContentSchema = z.object({
  version: z.literal(1),
  blocks: z.array(blockSchema).max(500),
});

export type CmsBlock = z.infer<typeof blockSchema>;
export type CmsContent = z.infer<typeof cmsContentSchema>;

export const emptyContent = (): CmsContent => ({ version: 1, blocks: [] });

/** Defensive parse for JSON read from the database. Returns empty content rather than throwing in the render path. */
export function parseContent(value: unknown): CmsContent {
  const parsed = cmsContentSchema.safeParse(value);
  return parsed.success ? parsed.data : emptyContent();
}

/** Strip inline markup for meta descriptions, search and reading-time estimates. */
export function stripInline(textValue: string): string {
  return textValue
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1');
}

export function plainTextFromContent(content: CmsContent): string {
  const parts: string[] = [];
  for (const b of content.blocks) {
    switch (b.type) {
      case 'heading':
      case 'paragraph':
      case 'quote':
        parts.push(stripInline(b.text));
        break;
      case 'callout':
        parts.push(stripInline(b.text));
        break;
      case 'list':
        parts.push(...b.items.map(stripInline));
        break;
      case 'steps':
        parts.push(...b.items.map((i) => `${i.title}. ${stripInline(i.text)}`));
        break;
      case 'faq':
        parts.push(...b.items.map((i) => `${i.question} ${stripInline(i.answer)}`));
        break;
      default:
        break;
    }
  }
  return parts.join(' ');
}

export function readingMinutes(content: CmsContent): number {
  const words = plainTextFromContent(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Meta description from explicit SEO text, else the excerpt, else the first paragraph (<= 160 chars). */
export function metaDescription(opts: { seo?: string | null; excerpt?: string | null; content?: CmsContent }): string | undefined {
  const source =
    opts.seo?.trim() ||
    opts.excerpt?.trim() ||
    (opts.content ? plainTextFromContent(opts.content).slice(0, 400) : '');
  if (!source) return undefined;
  const clean = source.replace(/\s+/g, ' ').trim();
  return clean.length <= 160 ? clean : `${clean.slice(0, 157).trimEnd()}…`;
}
