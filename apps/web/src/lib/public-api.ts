import 'server-only';
import { cache } from 'react';
import type {
  AccreditationDto,
  FaqDto,
  HotelDto,
  PackageDetailDto,
  PackageListDto,
  PackageListQuery,
  PageDto,
  Paginated,
  PostCategoryDto,
  PostDto,
  PostSummaryDto,
  ReviewsDto,
  SitemapDto,
  TeamMemberDto,
  TransportDto,
  ZiyaratDto,
} from '@umrah/shared';
import { apiGet, apiGetOrNull, qs } from './api';
import { companyFromSettings, type CompanyInfo } from './company';

/** Typed accessors for the public API. `cache()` de-duplicates calls between generateMetadata and the page. */

export const getCompany = cache(async (): Promise<CompanyInfo> => {
  try {
    return companyFromSettings(await apiGet<Record<string, unknown>>('/public/settings', { revalidate: 300, tags: ['settings'] }));
  } catch {
    // The shell must still render if settings are unavailable.
    return companyFromSettings({});
  }
});

export const getPackages = (query: Partial<PackageListQuery> = {}) =>
  apiGet<PackageListDto>(`/public/packages${qs(query)}`, { tags: ['packages'] });

export const getPackage = cache((slug: string) => apiGetOrNull<PackageDetailDto>(`/public/packages/${encodeURIComponent(slug)}`, { tags: ['packages', `package:${slug}`] }));

export const getHotels = (params: { city?: string; stars?: string; q?: string } = {}) => apiGet<HotelDto[]>(`/public/hotels${qs(params)}`, { tags: ['hotels'] });
export const getHotel = cache((slug: string) => apiGetOrNull<HotelDto>(`/public/hotels/${encodeURIComponent(slug)}`, { tags: ['hotels'] }));

export const getTransport = () => apiGet<TransportDto[]>('/public/transport', { tags: ['transport'] });

export const getZiyarat = (city?: string) => apiGet<ZiyaratDto[]>(`/public/ziyarat${qs({ city })}`, { tags: ['ziyarat'] });
export const getZiyaratItem = cache((slug: string) => apiGetOrNull<ZiyaratDto>(`/public/ziyarat/${encodeURIComponent(slug)}`, { tags: ['ziyarat'] }));

export const getPage = cache((slug: string, type?: 'STANDARD' | 'POLICY' | 'LANDING') =>
  apiGetOrNull<PageDto>(`/public/pages/${encodeURIComponent(slug)}${qs({ type })}`, { tags: ['pages', `page:${slug}`] }),
);

export const getPosts = (params: { type?: 'BLOG' | 'GUIDE' | 'NEWS'; category?: string; q?: string; page?: number; pageSize?: number } = {}) =>
  apiGet<Paginated<PostSummaryDto>>(`/public/posts${qs(params)}`, { tags: ['posts'] });
export const getPost = cache((slug: string, type?: 'BLOG' | 'GUIDE' | 'NEWS') =>
  apiGetOrNull<PostDto>(`/public/posts/${encodeURIComponent(slug)}${qs({ type })}`, { tags: ['posts', `post:${slug}`] }),
);
export const getPostCategories = (type?: 'BLOG' | 'GUIDE' | 'NEWS') => apiGet<PostCategoryDto[]>(`/public/post-categories${qs({ type })}`, { tags: ['posts'] });

export const getFaqs = (category?: string) => apiGet<FaqDto[]>(`/public/faqs${qs({ category })}`, { tags: ['faqs'] });
export const getTeam = () => apiGet<TeamMemberDto[]>('/public/team', { tags: ['team'] });
export const getAccreditations = () => apiGet<AccreditationDto[]>('/public/accreditations', { tags: ['accreditations'] });
export const getReviews = (limit = 6) => apiGet<ReviewsDto>(`/public/reviews${qs({ limit })}`, { tags: ['reviews'] });
export const getSitemap = () => apiGet<SitemapDto>('/public/sitemap', { revalidate: 300, tags: ['sitemap'] });
