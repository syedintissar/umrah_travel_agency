import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface SummaryLine {
  label: string;
  amount: string | number;
  /** Negative adjustments such as discounts. */
  discount?: boolean;
}

interface PriceSummaryProps {
  title?: string;
  currency: string;
  lines: SummaryLine[];
  total: string | number;
  /** Amount payable now (deposit). When set, the balance is shown with its due date. */
  dueNow?: string | number;
  balance?: string | number;
  balanceDueDate?: string;
  className?: string;
}

/** Sticky booking summary. Figures must come from the server's pricing calculation, never computed in the browser. */
export function PriceSummary({ title = 'Booking summary', currency, lines, total, dueNow, balance, balanceDueDate, className }: PriceSummaryProps) {
  return (
    <Card className={cn('shadow-card', className)}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <dl className="space-y-2 text-sm">
          {lines.map((l) => (
            <div key={l.label} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{l.label}</dt>
              <dd className={cn('tabular-nums', l.discount && 'text-success')}>
                {l.discount ? '−' : ''}{formatMoney(l.amount, currency)}
              </dd>
            </div>
          ))}
        </dl>
        <Separator />
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-medium">Total</span>
          <span className="font-display text-2xl font-semibold text-primary tabular-nums">{formatMoney(total, currency)}</span>
        </div>
        {dueNow !== undefined && (
          <div className="space-y-1.5 rounded-lg bg-primary/8 p-3 text-sm">
            <div className="flex justify-between gap-4 font-medium">
              <span>Due now (deposit)</span>
              <span className="tabular-nums">{formatMoney(dueNow, currency)}</span>
            </div>
            {balance !== undefined && (
              <div className="flex justify-between gap-4 text-muted-foreground">
                <span>Balance{balanceDueDate ? ` by ${balanceDueDate}` : ''}</span>
                <span className="tabular-nums">{formatMoney(balance, currency)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
