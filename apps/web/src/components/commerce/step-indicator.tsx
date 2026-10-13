import { Check } from 'lucide-react';
import { BOOKING_STEPS, type BookingStepKey } from '@umrah/shared';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export const STEP_LABEL: Record<BookingStepKey, string> = {
  PACKAGE: 'Package',
  DATE: 'Travel date',
  TRAVELERS: 'Travelers',
  ROOMS: 'Rooms',
  TRAVELER_DETAILS: 'Details',
  DOCUMENTS: 'Documents',
  PAYMENT: 'Payment',
  CONFIRMATION: 'Confirmation',
};

/** Booking wizard progress (proposal §7). Compact bar on phones, full stepper from `md`. */
export function StepIndicator({ current, className }: { current: BookingStepKey; className?: string }) {
  const index = BOOKING_STEPS.indexOf(current);
  const total = BOOKING_STEPS.length;

  return (
    <div className={className}>
      {/* Mobile */}
      <div className="md:hidden">
        <p className="flex items-baseline justify-between text-sm">
          <span className="font-medium">{STEP_LABEL[current]}</span>
          <span className="text-xs text-muted-foreground">Step {index + 1} of {total}</span>
        </p>
        <Progress value={((index + 1) / total) * 100} className="mt-2 h-1.5" aria-label="Booking progress" />
      </div>

      {/* Desktop */}
      <ol className="hidden items-center md:flex" aria-label="Booking progress">
        {BOOKING_STEPS.map((step, i) => {
          const done = i < index;
          const isCurrent = i === index;
          return (
            <li key={step} className="flex flex-1 items-center last:flex-none" aria-current={isCurrent ? 'step' : undefined}>
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    'grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors',
                    done && 'border-primary bg-primary text-primary-foreground',
                    isCurrent && 'border-gold bg-gold text-gold-foreground ring-4 ring-gold/25',
                    !done && !isCurrent && 'border-border bg-card text-muted-foreground',
                  )}
                >
                  {done ? <Check className="size-4" aria-hidden /> : i + 1}
                  <span className="sr-only">{`${STEP_LABEL[step]}${done ? ' completed' : isCurrent ? ' current' : ' upcoming'}`}</span>
                </span>
                <span className={cn('text-sm whitespace-nowrap', isCurrent ? 'font-semibold' : cn('hidden xl:inline', done ? 'text-foreground' : 'text-muted-foreground'))}>
                  {STEP_LABEL[step]}
                </span>
              </span>
              {i < total - 1 && <span className={cn('mx-3 h-px flex-1', done ? 'bg-primary' : 'bg-border')} aria-hidden />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
