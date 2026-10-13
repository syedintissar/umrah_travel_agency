/** CRM pipeline (proposal §11): New Lead > Contacted > Qualified > Quotation Sent > Follow-up > Negotiation > Converted. LOST is a terminal exit. */
export const LEAD_STAGES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'QUOTATION_SENT',
  'FOLLOW_UP',
  'NEGOTIATION',
  'CONVERTED',
  'LOST',
] as const;
export type LeadStageKey = (typeof LEAD_STAGES)[number];

export const LEAD_PIPELINE_STAGES = LEAD_STAGES.filter((s) => s !== 'LOST');

/** Payment transaction statuses (proposal §9) plus offline verification and cancelled. */
export const PAYMENT_STATUSES = [
  'PENDING',
  'AWAITING_VERIFICATION',
  'PROCESSING',
  'SUCCESSFUL',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
] as const;
export type PaymentStatusKey = (typeof PAYMENT_STATUSES)[number];
