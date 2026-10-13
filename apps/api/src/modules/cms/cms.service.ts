import { Injectable, NotFoundException } from '@nestjs/common';
import {
  metaDescription,
  parseContent,
  type AccreditationDto,
  type FaqDto,
  type PageDto,
  type Paginated,
  type PostCategoryDto,
  type PostDto,
  type PostSummaryDto,
  type PublicSettingsDto,
  type TeamMemberDto,
} from '@umrah/shared';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { dateOnly, iso } from '../catalog/catalog.mappers';

type PostType = 'BLOG' | 'GUIDE' | 'NEWS';

const postSummaryInclude = {
  category: { select: { slug: true, name: true } },
  coverMedia: { select: { url: true } },
  author: { select: { firstName: true, lastName: true } },
} satisfies Prisma.PostInclude;

type PostRow = Prisma.PostGetPayload<{ include: typeof postSummaryInclude }>;

function toPostSummary(p: PostRow): PostSummaryDto {
  return {
    slug: p.slug,
    type: p.type,
    title: p.title,
    excerpt: p.excerpt,
    coverUrl: p.coverMedia?.url ?? null,
    category: p.category,
    tags: p.tags,
    readingMinutes: p.readingMinutes,
    publishedAt: p.publishedAt ? iso(p.publishedAt) : null,
    authorName: p.author ? `${p.author.firstName} ${p.author.lastName}` : null,
  };
}

/** A post is public when PUBLISHED and its publish time has arrived (future time = scheduled). */
const publishedPosts = (now = new Date()): Prisma.PostWhereInput => ({
  status: 'PUBLISHED',
  deletedAt: null,
  publishedAt: { lte: now },
});

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<PublicSettingsDto> {
    const rows = await this.prisma.setting.findMany({ where: { isPublic: true }, select: { key: true, value: true } });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  async getPage(slug: string, type?: 'STANDARD' | 'POLICY' | 'LANDING'): Promise<PageDto> {
    const page = await this.prisma.page.findFirst({ where: { slug, status: 'PUBLISHED', ...(type ? { type } : {}) } });
    if (!page) throw new NotFoundException('Page not found');
    const content = parseContent(page.content);
    return {
      slug: page.slug,
      title: page.title,
      type: page.type,
      excerpt: page.excerpt,
      content,
      seo: {
        title: page.seoTitle,
        description: metaDescription({ seo: page.seoDescription, excerpt: page.excerpt, content }) ?? null,
      },
      updatedAt: iso(page.updatedAt),
    };
  }

  async listPosts(opts: { type?: PostType; category?: string; q?: string; page: number; pageSize: number }): Promise<Paginated<PostSummaryDto>> {
    const where: Prisma.PostWhereInput = {
      ...publishedPosts(),
      ...(opts.type ? { type: opts.type } : {}),
      ...(opts.category ? { category: { slug: opts.category } } : {}),
      ...(opts.q
        ? { OR: [{ title: { contains: opts.q, mode: 'insensitive' } }, { excerpt: { contains: opts.q, mode: 'insensitive' } }] }
        : {}),
    };
    const total = await this.prisma.post.count({ where });
    const pageCount = Math.max(1, Math.ceil(total / opts.pageSize));
    const page = Math.min(opts.page, pageCount);
    const rows = await this.prisma.post.findMany({
      where,
      include: postSummaryInclude,
      orderBy: [{ type: 'asc' }, { publishedAt: 'desc' }],
      skip: (page - 1) * opts.pageSize,
      take: opts.pageSize,
    });
    // Guides keep editorial order (oldest first = reading order); blog/news are newest first.
    const items = rows.map(toPostSummary);
    if (opts.type === 'GUIDE') items.sort((a, b) => (a.publishedAt ?? '').localeCompare(b.publishedAt ?? ''));
    return { items, meta: { total, page, pageSize: opts.pageSize, pageCount } };
  }

  async getPost(slug: string, type?: PostType | PostType[]): Promise<PostDto> {
    const post = await this.prisma.post.findFirst({
      where: { slug, ...publishedPosts(), ...(type ? { type: Array.isArray(type) ? { in: type } : type } : {}) },
      include: postSummaryInclude,
    });
    if (!post) throw new NotFoundException('Post not found');
    const content = parseContent(post.content);
    const related = await this.prisma.post.findMany({
      where: { ...publishedPosts(), id: { not: post.id }, type: post.type, ...(post.categoryId ? { categoryId: post.categoryId } : {}) },
      include: postSummaryInclude,
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });
    return {
      ...toPostSummary(post),
      content,
      seo: { title: post.seoTitle, description: metaDescription({ seo: post.seoDescription, excerpt: post.excerpt, content }) ?? null },
      updatedAt: iso(post.updatedAt),
      related: related.map(toPostSummary),
    };
  }

  async postCategories(type?: PostType): Promise<PostCategoryDto[]> {
    const cats = await this.prisma.postCategory.findMany({
      where: type ? { type } : {},
      orderBy: { name: 'asc' },
      include: { _count: { select: { posts: { where: publishedPosts() } } } },
    });
    return cats.filter((c) => c._count.posts > 0).map((c) => ({ slug: c.slug, name: c.name, type: c.type, count: c._count.posts }));
  }

  async listFaqs(category?: string): Promise<FaqDto[]> {
    const rows = await this.prisma.faq.findMany({
      where: { isPublished: true, ...(category ? { category } : {}) },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((f) => ({ id: f.id, question: f.question, answer: f.answer, category: f.category }));
  }

  async listTeam(): Promise<TeamMemberDto[]> {
    const rows = await this.prisma.teamMember.findMany({ where: { isPublished: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
    return rows.map((m) => ({ id: m.id, name: m.name, roleTitle: m.roleTitle, bio: m.bio, photoUrl: m.photoUrl }));
  }

  async listAccreditations(): Promise<AccreditationDto[]> {
    const rows = await this.prisma.accreditation.findMany({ where: { isPublished: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
    return rows.map((a) => ({
      id: a.id,
      name: a.name,
      issuer: a.issuer,
      number: a.number,
      logoUrl: a.logoUrl,
      validUntil: a.validUntil ? dateOnly(a.validUntil) : null,
    }));
  }
}
