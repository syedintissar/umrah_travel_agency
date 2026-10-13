import { cn } from '@/lib/utils';

/** Small eight-point star used in dividers and eyebrows. */
export function Star8({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('size-4 text-gold', className)} aria-hidden="true" focusable="false">
      <g fill="currentColor">
        <rect x="5" y="5" width="14" height="14" />
        <rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)" />
      </g>
    </svg>
  );
}

/** Quiet ornamental rule: line – star – line. */
export function OrnamentDivider({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)} role="separator" aria-hidden="true">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
      <Star8 className="size-3.5" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
    </div>
  );
}

/** Decorative Arabic text (e.g. Bismillah). Always aria-hidden: purely ornamental, never content. */
export function ArabicOrnament({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span lang="ar" dir="rtl" aria-hidden="true" className={cn('inline-block font-arabic text-gold', className)}>
      {children}
    </span>
  );
}
