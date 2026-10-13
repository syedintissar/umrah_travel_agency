import { cn } from '@/lib/utils';
import { getStatusMeta, TONE_CLASSES, type StatusDomain } from '@/lib/status';

interface StatusBadgeProps {
  domain: StatusDomain;
  value: string;
  className?: string;
  /** Hide the leading dot (e.g. dense tables). */
  plain?: boolean;
}

/** One badge for every status enum. Colour is never the only signal: the label always carries the meaning. */
export function StatusBadge({ domain, value, className, plain }: StatusBadgeProps) {
  const { label, tone } = getStatusMeta(domain, value);
  const t = TONE_CLASSES[tone];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', t.badge, className)}>
      {!plain && <span className={cn('size-1.5 rounded-full', t.dot)} aria-hidden />}
      {label}
    </span>
  );
}
