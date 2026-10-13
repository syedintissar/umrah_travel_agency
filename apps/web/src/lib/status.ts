import type { BookingStatusKey, LeadStageKey, PaymentStatusKey } from '@umrah/shared';
import { humanize } from './format';

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'gold';

export interface StatusMeta {
  label: string;
  tone: Tone;
}

/** Visual treatment for every status enum in the Prisma schema. Unknown values fall back to a neutral humanized label. */
export const STATUS_META = {
  booking: {
    DRAFT: { label: 'Draft', tone: 'neutral' },
    PENDING_PAYMENT: { label: 'Awaiting payment', tone: 'warning' },
    CONFIRMED: { label: 'Confirmed', tone: 'success' },
    VISA_PROCESSING: { label: 'Visa processing', tone: 'info' },
    TRAVEL_PREPARATION: { label: 'Travel preparation', tone: 'gold' },
    COMPLETED: { label: 'Completed', tone: 'success' },
    CANCELLED: { label: 'Cancelled', tone: 'danger' },
  } satisfies Record<BookingStatusKey, StatusMeta>,

  bookingPayment: {
    UNPAID: { label: 'Unpaid', tone: 'neutral' },
    DEPOSIT_PAID: { label: 'Deposit paid', tone: 'info' },
    PARTIALLY_PAID: { label: 'Partially paid', tone: 'warning' },
    PAID: { label: 'Paid in full', tone: 'success' },
    OVERDUE: { label: 'Overdue', tone: 'danger' },
    REFUND_PENDING: { label: 'Refund pending', tone: 'warning' },
    PARTIALLY_REFUNDED: { label: 'Partially refunded', tone: 'info' },
    REFUNDED: { label: 'Refunded', tone: 'neutral' },
  } satisfies Record<string, StatusMeta>,

  payment: {
    PENDING: { label: 'Pending', tone: 'neutral' },
    AWAITING_VERIFICATION: { label: 'Awaiting verification', tone: 'warning' },
    PROCESSING: { label: 'Processing', tone: 'info' },
    SUCCESSFUL: { label: 'Successful', tone: 'success' },
    FAILED: { label: 'Failed', tone: 'danger' },
    CANCELLED: { label: 'Cancelled', tone: 'neutral' },
    REFUNDED: { label: 'Refunded', tone: 'neutral' },
    PARTIALLY_REFUNDED: { label: 'Partially refunded', tone: 'info' },
  } satisfies Record<PaymentStatusKey, StatusMeta>,

  visa: {
    NOT_STARTED: { label: 'Not started', tone: 'neutral' },
    DOCUMENTS_PENDING: { label: 'Documents pending', tone: 'warning' },
    UNDER_REVIEW: { label: 'Under review', tone: 'info' },
    READY_TO_SUBMIT: { label: 'Ready to submit', tone: 'info' },
    SUBMITTED: { label: 'Submitted', tone: 'info' },
    IN_PROCESS: { label: 'In process', tone: 'info' },
    APPROVED: { label: 'Approved', tone: 'success' },
    ISSUED: { label: 'Visa issued', tone: 'success' },
    REJECTED: { label: 'Rejected', tone: 'danger' },
    CANCELLED: { label: 'Cancelled', tone: 'neutral' },
  } satisfies Record<string, StatusMeta>,

  document: {
    PENDING_REVIEW: { label: 'Pending review', tone: 'warning' },
    APPROVED: { label: 'Approved', tone: 'success' },
    REJECTED: { label: 'Needs re-upload', tone: 'danger' },
    EXPIRED: { label: 'Expired', tone: 'danger' },
  } satisfies Record<string, StatusMeta>,

  lead: {
    NEW: { label: 'New lead', tone: 'info' },
    CONTACTED: { label: 'Contacted', tone: 'neutral' },
    QUALIFIED: { label: 'Qualified', tone: 'info' },
    QUOTATION_SENT: { label: 'Quotation sent', tone: 'gold' },
    FOLLOW_UP: { label: 'Follow-up', tone: 'warning' },
    NEGOTIATION: { label: 'Negotiation', tone: 'gold' },
    CONVERTED: { label: 'Converted', tone: 'success' },
    LOST: { label: 'Lost', tone: 'danger' },
  } satisfies Record<LeadStageKey, StatusMeta>,

  invoice: {
    DRAFT: { label: 'Draft', tone: 'neutral' },
    ISSUED: { label: 'Issued', tone: 'info' },
    PARTIALLY_PAID: { label: 'Partially paid', tone: 'warning' },
    PAID: { label: 'Paid', tone: 'success' },
    OVERDUE: { label: 'Overdue', tone: 'danger' },
    VOID: { label: 'Void', tone: 'neutral' },
    REFUNDED: { label: 'Refunded', tone: 'neutral' },
  } satisfies Record<string, StatusMeta>,

  quotation: {
    DRAFT: { label: 'Draft', tone: 'neutral' },
    SENT: { label: 'Sent', tone: 'info' },
    VIEWED: { label: 'Viewed', tone: 'info' },
    ACCEPTED: { label: 'Accepted', tone: 'success' },
    REJECTED: { label: 'Rejected', tone: 'danger' },
    EXPIRED: { label: 'Expired', tone: 'neutral' },
    CONVERTED: { label: 'Booked', tone: 'success' },
  } satisfies Record<string, StatusMeta>,

  publish: {
    DRAFT: { label: 'Draft', tone: 'neutral' },
    PUBLISHED: { label: 'Published', tone: 'success' },
    ARCHIVED: { label: 'Archived', tone: 'neutral' },
  } satisfies Record<string, StatusMeta>,

  review: {
    PENDING: { label: 'Pending', tone: 'warning' },
    APPROVED: { label: 'Approved', tone: 'success' },
    REJECTED: { label: 'Rejected', tone: 'danger' },
  } satisfies Record<string, StatusMeta>,
} as const;

export type StatusDomain = keyof typeof STATUS_META;

export function getStatusMeta(domain: StatusDomain, value: string): StatusMeta {
  const table = STATUS_META[domain] as Record<string, StatusMeta>;
  return table[value] ?? { label: humanize(value), tone: 'neutral' };
}

/** Tailwind classes per tone (tinted background + readable text in light & dark). */
export const TONE_CLASSES: Record<Tone, { badge: string; dot: string }> = {
  neutral: { badge: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground/60' },
  info: { badge: 'bg-info/12 text-info', dot: 'bg-info' },
  success: { badge: 'bg-success/12 text-success', dot: 'bg-success' },
  warning: { badge: 'bg-warning/15 text-warning', dot: 'bg-warning' },
  danger: { badge: 'bg-destructive/12 text-destructive', dot: 'bg-destructive' },
  gold: { badge: 'bg-gold/20 text-gold-foreground dark:text-gold', dot: 'bg-gold' },
};
