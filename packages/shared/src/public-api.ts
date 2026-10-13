import type { CmsContent } from './cms';

/**
 * Response shapes of the public (unauthenticated, read-only) API.
 * Money is a decimal string, dates are ISO strings (date-only values are `YYYY-MM-DD`).
 */

export type City = 'MAKKAH' | 'MADINAH' | 'JEDDAH' | 'TAIF' | 'OTHER';
export type PackageTierKey = 'ECONOMY' | 'STANDARD' | 'PREMIUM' | 'VIP';
export type MealPlanKey = 'ROOM_ONLY' | 'BREAKFAST' | 'HALF_BOARD' | 'FULL_BOARD';

export interface Paginated<T> {
  items: T[];
  meta: { total: number; page: number; pageSize: number; pageCount: number };
}

export interface HotelBriefDto {
  slug: string;
  name: string;
  city: City;
  starRating: number;
  distanceToHaramMeters: number | null;
}

export interface PackageSummaryDto {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  summary: string | null;
  tier: PackageTierKey;
  categoryName: string | null;
  durationDays: number;
  nightsMakkah: number;
  nightsMadinah: number;
  departureCities: string[];
  mealPlan: MealPlanKey;
  startingPrice: string | null;
  currency: string;
  coverUrl: string | null;
  coverAlt: string | null;
  makkahHotel: HotelBriefDto | null;
  madinahHotel: HotelBriefDto | null;
  visaIncluded: boolean;
  flightIncluded: boolean;
  transportIncluded: boolean;
  ziyaratIncluded: boolean;
  isFeatured: boolean;
  /** Next bookable departure, if any. */
  nextDepartureDate: string | null;
  seatsLeft: number | null;
}

export interface PackageFacetsDto {
  cities: string[];
  categories: { slug: string; name: string; count: number }[];
  tiers: { tier: PackageTierKey; count: number }[];
  price: { min: number; max: number } | null;
  durations: { min: number; max: number } | null;
}

export interface PackageListDto extends Paginated<PackageSummaryDto> {
  facets: PackageFacetsDto;
}

export interface DeparturePriceDto {
  occupancy: string;
  adultPrice: string;
  childPrice: string | null;
  infantPrice: string | null;
  currency: string;
}

export interface DepartureDto {
  id: string;
  departureDate: string;
  returnDate: string;
  departureCity: string | null;
  airline: string | null;
  flightDetails: string | null;
  seatsLeft: number;
  bookingCutoffDate: string | null;
  /** True when open for booking, not past cut-off, and seats remain. */
  bookable: boolean;
  prices: DeparturePriceDto[];
}

export interface MediaDto {
  url: string;
  alt: string | null;
}

export interface ItineraryDayDto {
  dayNumber: number;
  title: string;
  description: string | null;
  city: City | null;
}

export interface TransportDto {
  id: string;
  name: string;
  type: string;
  serviceKind: 'AIRPORT_TRANSFER' | 'INTERCITY' | 'ZIYARAT_TOUR' | 'LOCAL';
  isShared: boolean;
  vehicleModel: string | null;
  capacity: number | null;
  fromLocation: string | null;
  toLocation: string | null;
  description: string | null;
  priceBasis: 'PER_PERSON' | 'PER_VEHICLE';
  basePrice: string | null;
  currency: string;
}

export interface ZiyaratDto {
  slug: string;
  name: string;
  city: City;
  summary: string | null;
  description: string | null;
  coverUrl: string | null;
}

export interface RoomTypeDto {
  name: string;
  occupancy: string;
  maxGuests: number;
  description: string | null;
  amenities: string[];
  fromPricePerNight: string | null;
  currency: string;
}

export interface HotelDto extends HotelBriefDto {
  id: string;
  walkingMinutes: number | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  summary: string | null;
  description: string | null;
  amenities: string[];
  checkInTime: string | null;
  checkOutTime: string | null;
  images: MediaDto[];
  roomTypes: RoomTypeDto[];
  fromPricePerNight: string | null;
  currency: string;
  seo: SeoDto;
}

export interface SeoDto {
  title: string | null;
  description: string | null;
}

export interface ReviewDto {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  authorName: string;
  packageTitle: string | null;
  createdAt: string;
  adminResponse: string | null;
}

export interface ReviewsDto {
  summary: { average: number | null; count: number };
  items: ReviewDto[];
}

export interface PackageDetailDto extends PackageSummaryDto {
  description: string | null;
  inclusions: string[];
  exclusions: string[];
  terms: string | null;
  depositType: 'PERCENTAGE' | 'FIXED_PER_PERSON' | 'FIXED_PER_BOOKING';
  depositValue: string;
  images: MediaDto[];
  hotels: { city: City; nights: number; notes: string | null; hotel: HotelBriefDto & { summary: string | null; amenities: string[] } }[];
  itinerary: ItineraryDayDto[];
  transport: TransportDto[];
  ziyarat: ZiyaratDto[];
  departures: DepartureDto[];
  reviews: ReviewsDto;
  related: PackageSummaryDto[];
  seo: SeoDto;
  updatedAt: string;
}

export interface PageDto {
  slug: string;
  title: string;
  type: 'STANDARD' | 'POLICY' | 'LANDING';
  excerpt: string | null;
  content: CmsContent;
  seo: SeoDto;
  updatedAt: string;
}

export interface PostSummaryDto {
  slug: string;
  type: 'BLOG' | 'GUIDE' | 'NEWS';
  title: string;
  excerpt: string | null;
  coverUrl: string | null;
  category: { slug: string; name: string } | null;
  tags: string[];
  readingMinutes: number | null;
  publishedAt: string | null;
  authorName: string | null;
}

export interface PostDto extends PostSummaryDto {
  content: CmsContent;
  seo: SeoDto;
  updatedAt: string;
  related: PostSummaryDto[];
}

export interface PostCategoryDto {
  slug: string;
  name: string;
  type: 'BLOG' | 'GUIDE' | 'NEWS';
  count: number;
}

export interface FaqDto {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface TeamMemberDto {
  id: string;
  name: string;
  roleTitle: string;
  bio: string | null;
  photoUrl: string | null;
}

export interface AccreditationDto {
  id: string;
  name: string;
  issuer: string | null;
  number: string | null;
  logoUrl: string | null;
  validUntil: string | null;
}

export type PublicSettingsDto = Record<string, unknown>;

export interface SitemapDto {
  packages: { slug: string; updatedAt: string }[];
  hotels: { slug: string; updatedAt: string }[];
  ziyarat: { slug: string; updatedAt: string }[];
  posts: { slug: string; type: 'BLOG' | 'GUIDE' | 'NEWS'; updatedAt: string }[];
  pages: { slug: string; type: 'STANDARD' | 'POLICY' | 'LANDING'; updatedAt: string }[];
}
