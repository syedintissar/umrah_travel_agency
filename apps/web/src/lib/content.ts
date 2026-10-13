import { stripInline, type CmsContent } from '@umrah/shared';

export const slugify = (s: string): string =>
  stripInline(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Level-2 headings of a content document, for tables of contents (ids match BlockRenderer). */
export function headingsOf(content: CmsContent): { id: string; text: string }[] {
  return content.blocks
    .filter((b): b is Extract<typeof b, { type: 'heading' }> => b.type === 'heading' && b.level === 2)
    .map((b) => ({ id: slugify(b.text), text: stripInline(b.text) }));
}
