/**
 * Booking lifecycle (proposal §7: ... Booking Confirmation > Visa/Document Processing > Travel Preparation > Completion). Values mirror the Prisma `BookingStatus` / `BookingStep` enums.
 * Transition rules are enforced server-side; the UI uses them to render progress.
 */

export const BOOKING_STEPS = [
  'PACKAGE',
  'DATE',
  'TRAVELERS',
  'ROOMS',
  'TRAVELER_DETAILS',
  'DOCUMENTS',
  'PAYMENT',
  'CONFIRMATION',
] as const;
export type BookingStepKey = (typeof BOOKING_STEPS)[number];

export const BOOKING_STATUSES = [
  'DRAFT',
  'PENDING_PAYMENT',
  'CONFIRMED',
  'VISA_PROCESSING',
  'TRAVEL_PREPARATION',
  'COMPLETED',
  'CANCELLED',
] as const;
export type BookingStatusKey = (typeof BOOKING_STATUSES)[number];

export const BOOKING_TRANSITIONS: Record<BookingStatusKey, readonly BookingStatusKey[]> = {
  DRAFT: ['PENDING_PAYMENT', 'CANCELLED'],
  PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['VISA_PROCESSING', 'CANCELLED'],
  VISA_PROCESSING: ['TRAVEL_PREPARATION', 'CANCELLED'],
  TRAVEL_PREPARATION: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransitionBooking(from: BookingStatusKey, to: BookingStatusKey): boolean {
  return BOOKING_TRANSITIONS[from].includes(to);
}
