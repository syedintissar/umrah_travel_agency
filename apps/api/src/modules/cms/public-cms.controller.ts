import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { z } from 'zod';
import { PublicCacheInterceptor } from '../../common/http/public-cache.interceptor';
import { ZodPipe } from '../../common/http/zod.pipe';
import { CmsService } from './cms.service';

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200);
const postsQuery = z.object({
  type: z.enum(['BLOG', 'GUIDE', 'NEWS']).optional(),
  category: slug.optional(),
  q: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(9),
});
const categoriesQuery = z.object({ type: z.enum(['BLOG', 'GUIDE', 'NEWS']).optional() });
const faqQuery = z.object({ category: z.string().trim().min(1).max(50).optional() });
const pageQuery = z.object({ type: z.enum(['STANDARD', 'POLICY', 'LANDING']).optional() });

@Controller('public')
@UseInterceptors(PublicCacheInterceptor)
export class PublicCmsController {
  constructor(private readonly cms: CmsService) {}

  @Get('settings')
  settings() {
    return this.cms.getSettings();
  }

  @Get('pages/:slug')
  page(@Param('slug', new ZodPipe(slug)) slugValue: string, @Query(new ZodPipe(pageQuery)) q: z.infer<typeof pageQuery>) {
    return this.cms.getPage(slugValue, q.type);
  }

  @Get('posts')
  posts(@Query(new ZodPipe(postsQuery)) q: z.infer<typeof postsQuery>) {
    return this.cms.listPosts(q);
  }

  @Get('post-categories')
  categories(@Query(new ZodPipe(categoriesQuery)) q: z.infer<typeof categoriesQuery>) {
    return this.cms.postCategories(q.type);
  }

  @Get('posts/:slug')
  post(@Param('slug', new ZodPipe(slug)) slugValue: string, @Query(new ZodPipe(categoriesQuery)) q: z.infer<typeof categoriesQuery>) {
    return this.cms.getPost(slugValue, q.type);
  }

  @Get('faqs')
  faqs(@Query(new ZodPipe(faqQuery)) q: z.infer<typeof faqQuery>) {
    return this.cms.listFaqs(q.category);
  }

  @Get('team')
  team() {
    return this.cms.listTeam();
  }

  @Get('accreditations')
  accreditations() {
    return this.cms.listAccreditations();
  }
}
