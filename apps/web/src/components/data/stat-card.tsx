import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  /** Percentage change vs. previous period. Omit when unknown: never invent a trend. */
  delta?: number;
  hint?: string;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, delta, hint, className }: StatCardProps) {
  const up = (delta ?? 0) >= 0;
  return (
    <Card className={cn('shadow-card', className)}>
      <CardContent className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 truncate font-display text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            {delta !== undefined && (
              <span className={cn('inline-flex items-center gap-0.5 font-medium', up ? 'text-success' : 'text-destructive')}>
                {up ? <ArrowUpRight className="size-3.5" aria-hidden /> : <ArrowDownRight className="size-3.5" aria-hidden />}
                {Math.abs(delta).toFixed(1)}%
                <span className="sr-only">{up ? 'increase' : 'decrease'}</span>
              </span>
            )}
            {hint && <span className="text-muted-foreground">{hint}</span>}
          </div>
        </div>
        {Icon && (
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" aria-hidden />
          </span>
        )}
      </CardContent>
    </Card>
  );
}
