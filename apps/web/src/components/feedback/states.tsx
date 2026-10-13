import * as React from 'react';
import { AlertTriangle, CheckCircle2, Inbox, type LucideIcon, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
  /** Compact variant for use inside cards and table bodies. */
  compact?: boolean;
}

function StateShell({
  icon: Icon,
  iconClass,
  title,
  description,
  action,
  className,
  compact,
  role,
}: StateProps & { iconClass: string; role?: 'alert' | 'status' }) {
  return (
    <div
      role={role}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-2 px-4 py-8' : 'gap-3 rounded-2xl border border-dashed bg-card/50 px-6 py-14',
        className,
      )}
    >
      {Icon && (
        <span className={cn('grid place-items-center rounded-full', compact ? 'size-10' : 'size-14', iconClass)}>
          <Icon className={compact ? 'size-5' : 'size-7'} aria-hidden />
        </span>
      )}
      <h3 className={cn('font-display font-semibold', compact ? 'text-base' : 'text-xl')}>{title}</h3>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function EmptyState({ icon = Inbox, ...props }: StateProps) {
  return <StateShell icon={icon} iconClass="bg-primary/10 text-primary" {...props} />;
}

/** Error panel. Pass a `onRetry` to render a retry button; never put raw error messages or stack traces here. */
export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this content. Please try again.',
  onRetry,
  ...props
}: Partial<StateProps> & { onRetry?: () => void }) {
  return (
    <StateShell
      role="alert"
      icon={AlertTriangle}
      iconClass="bg-destructive/10 text-destructive"
      title={title}
      description={description}
      action={onRetry && <Button variant="outline" onClick={onRetry}><RotateCw /> Try again</Button>}
      {...props}
    />
  );
}

export function SuccessState({ icon = CheckCircle2, ...props }: StateProps) {
  return <StateShell role="status" icon={icon} iconClass="bg-success/12 text-success" {...props} />;
}
