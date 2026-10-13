import { cn } from '@/lib/utils';
import { Star8 } from '@/components/brand/ornament';

type Tone = 'default' | 'muted' | 'brand';

const TONES: Record<Tone, string> = {
  default: 'bg-background',
  muted: 'bg-muted/50',
  brand: 'bg-sidebar text-sidebar-foreground bg-pattern',
};

export function Container({
  className,
  as: Tag = 'div',
  ...props
}: React.ComponentProps<'div'> & { as?: 'div' | 'section' | 'header' | 'nav' }) {
  return <Tag className={cn('container-page', className)} {...props} />;
}

export function Section({
  tone = 'default',
  className,
  containerClassName,
  children,
  ...props
}: React.ComponentProps<'section'> & { tone?: Tone; containerClassName?: string }) {
  return (
    <section className={cn('py-14 sm:py-20', TONES[tone], className)} {...props}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'start' | 'center';
  invert?: boolean;
  as?: 'h1' | 'h2';
  className?: string;
  action?: React.ReactNode;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'start',
  invert,
  as: Tag = 'h2',
  className,
  action,
}: SectionHeadingProps) {
  const centered = align === 'center';
  return (
    <div
      className={cn(
        'mb-10 flex flex-col gap-3 sm:mb-12',
        centered ? 'items-center text-center' : 'items-start sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className={cn('max-w-2xl', centered && 'mx-auto')}>
        {eyebrow && (
          <p
            className={cn(
              'mb-3 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase',
              invert ? 'text-gold' : 'text-primary',
            )}
          >
            <Star8 className="size-3" />
            {eyebrow}
          </p>
        )}
        <Tag className={cn('text-3xl font-semibold sm:text-4xl', invert && 'text-sidebar-foreground')}>{title}</Tag>
        {description && (
          <p className={cn('mt-3 text-base leading-relaxed sm:text-lg', invert ? 'text-sidebar-foreground/80' : 'text-muted-foreground')}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
