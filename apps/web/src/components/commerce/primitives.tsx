import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/format';

export function Rating({
  value,
  max = 5,
  className,
  size = 'sm',
}: {
  value: number;
  max?: number;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <span role="img" aria-label={`${value} out of ${max} stars`} className={cn('inline-flex items-center gap-0.5', className)}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          aria-hidden
          className={cn(size === 'sm' ? 'size-3.5' : 'size-4.5', i < Math.round(value) ? 'fill-gold text-gold' : 'text-muted-foreground/40')}
        />
      ))}
    </span>
  );
}

interface PriceTagProps {
  amount: string | number | null | undefined;
  currency: string;
  prefix?: string;
  suffix?: string;
  size?: 'md' | 'lg';
  className?: string;
}

export function PriceTag({ amount, currency, prefix = 'From', suffix = 'per person', size = 'md', className }: PriceTagProps) {
  if (amount === null || amount === undefined || amount === '') {
    return <p className={cn('text-sm font-medium text-muted-foreground', className)}>Price on request</p>;
  }
  return (
    <p className={className}>
      {prefix && <span className="block text-xs text-muted-foreground">{prefix}</span>}
      <span className={cn('font-display font-semibold tracking-tight text-primary tabular-nums', size === 'lg' ? 'text-4xl' : 'text-2xl')}>
        {formatMoney(amount, currency)}
      </span>
      {suffix && <span className="ms-1.5 text-xs text-muted-foreground">{suffix}</span>}
    </p>
  );
}
