import * as React from 'react';
import Link from 'next/link';
import { isSafeHref } from '@umrah/shared';

const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;

/**
 * Renders the CMS inline syntax (**bold**, *italic*, [label](href)) as React elements.
 * Never uses dangerouslySetInnerHTML; links are re-validated at render time as defence in depth.
 */
export function InlineText({ text }: { text: string }) {
  const parts = text.split(TOKEN).filter((p) => p !== '');
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
        if (link) {
          const [, label, href] = link as unknown as [string, string, string];
          if (!isSafeHref(href)) return <React.Fragment key={i}>{label}</React.Fragment>;
          const cls = 'font-medium text-primary underline underline-offset-4 hover:text-primary/80';
          return href.startsWith('/') ? (
            <Link key={i} href={href} className={cls}>{label}</Link>
          ) : (
            <a key={i} href={href} className={cls} {...(href.startsWith('https://') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              {label}
            </a>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}
