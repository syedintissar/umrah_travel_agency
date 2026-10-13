import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SITE } from '@/config/site';

/** Emerald tile with a gold eight-point star: two overlapping squares around a crescent-like inner ring. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn('size-9 shrink-0', className)}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="40" height="40" rx="10" className="fill-[oklch(0.4_0.075_165)]" />
      <g fill="none" strokeWidth="1.6" className="stroke-gold" strokeLinejoin="round">
        <rect x="11" y="11" width="18" height="18" />
        <rect x="11" y="11" width="18" height="18" transform="rotate(45 20 20)" />
      </g>
      <circle cx="20" cy="20" r="3.2" className="fill-gold" />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  /** `inverse` renders light text for dark surfaces such as the sidebar and footer. */
  tone?: 'default' | 'inverse';
  href?: string | null;
  name?: string;
}

export function Logo({ className, tone = 'default', href = '/', name = SITE.name }: LogoProps) {
  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span
        className={cn(
          'font-display text-xl leading-none font-semibold tracking-tight whitespace-nowrap',
          tone === 'inverse' ? 'text-sidebar-foreground' : 'text-foreground',
        )}
      >
        {name}
      </span>
    </span>
  );
  if (href === null) return content;
  return (
    <Link href={href} aria-label={`${name} home`} className="rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      {content}
    </Link>
  );
}
