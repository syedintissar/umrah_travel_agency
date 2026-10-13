import { cmsContentSchema, isSafeHref, metaDescription, parseContent, plainTextFromContent, readingMinutes, stripInline } from '@umrah/shared';

describe('CMS content safety', () => {
  it('only allows site paths, https, mailto and tel links', () => {
    for (const ok of ['/packages', '/blog/post-1?x=1', 'https://example.com/a', 'mailto:hi@example.com', 'tel:+92 300 1234567']) {
      expect(isSafeHref(ok)).toBe(true);
    }
    for (const bad of ['javascript:alert(1)', 'data:text/html,<script>', 'http://insecure.example', '//evil.example', 'vbscript:x', 'JaVaScRiPt:alert(1)', ' /packages']) {
      expect(isSafeHref(bad)).toBe(false);
    }
  });

  it('rejects blocks with unsafe links or unknown block types', () => {
    const cta = (href: string) => ({ version: 1, blocks: [{ type: 'cta', label: 'Go', href }] });
    expect(cmsContentSchema.safeParse(cta('javascript:alert(1)')).success).toBe(false);
    expect(cmsContentSchema.safeParse(cta('/packages')).success).toBe(true);
    expect(cmsContentSchema.safeParse({ version: 1, blocks: [{ type: 'html', html: '<script>x</script>' }] }).success).toBe(false);
  });

  it('parseContent never throws and falls back to empty content', () => {
    expect(parseContent({ nonsense: true })).toEqual({ version: 1, blocks: [] });
    expect(parseContent(null)).toEqual({ version: 1, blocks: [] });
  });
});

describe('CMS text helpers', () => {
  const content = parseContent({
    version: 1,
    blocks: [
      { type: 'paragraph', text: 'Visit [our packages](/packages) for **great** *deals*.' },
      { type: 'list', ordered: false, items: ['One', 'Two'] },
    ],
  });

  it('strips inline markup', () => expect(stripInline('A [link](/x) **bold** *it*')).toBe('A link bold it'));
  it('extracts plain text and reading time (min 1 minute)', () => {
    expect(plainTextFromContent(content)).toContain('Visit our packages for great deals.');
    expect(readingMinutes(content)).toBe(1);
  });
  it('builds a <=160 char meta description, preferring explicit SEO text', () => {
    expect(metaDescription({ seo: 'Custom', excerpt: 'Excerpt' })).toBe('Custom');
    const long = metaDescription({ excerpt: 'word '.repeat(100) })!;
    expect(long.length).toBeLessThanOrEqual(160);
    expect(long.endsWith('…')).toBe(true);
    expect(metaDescription({ content })).toContain('Visit our packages');
    expect(metaDescription({})).toBeUndefined();
  });
});
