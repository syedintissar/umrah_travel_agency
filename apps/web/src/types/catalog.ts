import type { HotelBriefDto, PackageSummaryDto, PackageTierKey } from '@umrah/shared';

/** UI aliases for the public API contract (defined once in @umrah/shared). */
export type PackageSummary = PackageSummaryDto;
export type HotelBrief = HotelBriefDto;
export type PackageTier = PackageTierKey;

export const TIER_LABEL: Record<PackageTier, string> = {
  ECONOMY: 'Economy',
  STANDARD: 'Standard',
  PREMIUM: 'Premium',
  VIP: 'VIP',
};
