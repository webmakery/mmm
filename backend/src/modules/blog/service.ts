import { EntityManager } from "@medusajs/framework/mikro-orm/knex"
import { Context } from "@medusajs/framework/types"
import { InjectManager, MedusaContext, MedusaError, MedusaService } from "@medusajs/framework/utils"
import BlogCategory from "./models/blog-category"
import BlogPost from "./models/blog-post"
import BlogPostCategory from "./models/blog-post-category"

type AdminCategory = { id: string; name: string; slug: string }

type AdminPostRow = {
  categories?: AdminCategory[] | string | null
  [key: string]: unknown
}

const normalizeCategories = (categories: AdminPostRow["categories"]): AdminCategory[] => {
  if (!categories) {
    return []
  }

  if (Array.isArray(categories)) {
    return categories.filter((category): category is AdminCategory => Boolean(category?.id))
  }

  if (typeof categories === "string") {
    try {
      const parsed = JSON.parse(categories)
      return Array.isArray(parsed)
        ? parsed.filter((category): category is AdminCategory => Boolean(category?.id))
        : []
    } catch {
      return []
    }
  }

  return []
}

const normalizeAdminPost = (post: AdminPostRow) => {
  const categories = normalizeCategories(post.categories)

  return {
    ...post,
    categories,
    category_ids: categories.map((category) => category.id),
  }
}

type UpsertPostInput = {
  title: string
  slug: string
  excerpt?: string | null
  content?: unknown
  featured_image?: string | null
  author_name?: string | null
  seo_title?: string | null
  seo_description?: string | null
  publish_date?: string | null
  status?: "draft" | "published"
  category_ids?: string[]
  tags?: string[]
}

class BlogModuleService extends MedusaService({
  BlogPost,
  BlogCategory,
  BlogPostCategory,
}) {
  @InjectManager()
  async ensureUniqueSlug(
    slug: string,
    excludeId?: string,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const manager = sharedContext?.manager

    const rows = await manager?.execute(
      `
      select id from blog_post
      where slug = ? and deleted_at is null and (? is null or id != ?)
      limit 1
      `,
      [slug, excludeId || null, excludeId || null]
    )

    if (rows?.length) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "A blog post with this slug already exists")
    }
  }

  @InjectManager()
  async createPostWithCategories(input: UpsertPostInput, @MedusaContext() sharedContext?: Context<EntityManager>) {
    await this.ensureUniqueSlug(input.slug, undefined, sharedContext)

    const post = await this.createBlogPosts(
      {
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt,
        content: input.content,
        featured_image: input.featured_image,
        author_name: input.author_name,
        seo_title: input.seo_title,
        seo_description: input.seo_description,
        publish_date: input.publish_date ? new Date(input.publish_date) : null,
        status: input.status || "draft",
        tags: input.tags || [],
      },
      sharedContext
    )

    if (input.category_ids?.length) {
      await this.createBlogPostCategories(
        input.category_ids.map((category_id) => ({
          post_id: post.id,
          category_id,
        })),
        sharedContext
      )
    }

    return this.retrieveAdminPost(post.id, sharedContext)
  }

  @InjectManager()
  async updatePostWithCategories(
    id: string,
    input: Partial<UpsertPostInput>,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const existing = await this.retrieveBlogPost(id, {}, sharedContext)

    if (input.slug && input.slug !== existing.slug) {
      await this.ensureUniqueSlug(input.slug, id, sharedContext)
    }

    const nextStatus = input.status || existing.status
    const publishDate =
      input.publish_date !== undefined
        ? input.publish_date
          ? new Date(input.publish_date)
          : null
        : nextStatus === "published" && !existing.publish_date
        ? new Date()
        : existing.publish_date

    await this.updateBlogPosts(
      {
        id,
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
        ...(input.content !== undefined ? { content: input.content } : {}),
        ...(input.featured_image !== undefined ? { featured_image: input.featured_image } : {}),
        ...(input.author_name !== undefined ? { author_name: input.author_name } : {}),
        ...(input.seo_title !== undefined ? { seo_title: input.seo_title } : {}),
        ...(input.seo_description !== undefined ? { seo_description: input.seo_description } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
        publish_date: publishDate,
      },
      sharedContext
    )

    if (input.category_ids) {
      const previousLinks = await this.listBlogPostCategories({ post_id: id }, {}, sharedContext)

      if (previousLinks.length) {
        await this.deleteBlogPostCategories(
          previousLinks.map((link) => link.id),
          sharedContext
        )
      }

      if (input.category_ids.length) {
        await this.createBlogPostCategories(
          input.category_ids.map((category_id) => ({
            post_id: id,
            category_id,
          })),
          sharedContext
        )
      }
    }

    return this.retrieveAdminPost(id, sharedContext)
  }

  @InjectManager()
  async deletePostWithRelations(id: string, @MedusaContext() sharedContext?: Context<EntityManager>) {
    const links = await this.listBlogPostCategories({ post_id: id }, {}, sharedContext)

    if (links.length) {
      await this.deleteBlogPostCategories(
        links.map((link) => link.id),
        sharedContext
      )
    }

    await this.deleteBlogPosts(id, sharedContext)
  }

  @InjectManager()
  async retrieveAdminPost(id: string, @MedusaContext() sharedContext?: Context<EntityManager>) {
    const manager = sharedContext?.manager

    const rows = await manager?.execute(
      `
      select
        p.*,
        coalesce(
          json_agg(
            distinct jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug)
          ) filter (where c.id is not null),
          '[]'::json
        ) as categories
      from blog_post p
      left join blog_post_category pc on pc.post_id = p.id and pc.deleted_at is null
      left join blog_category c on c.id = pc.category_id and c.deleted_at is null
      where p.id = ? and p.deleted_at is null
      group by p.id
      limit 1
      `,
      [id]
    )

    if (!rows?.length) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Blog post not found")
    }

    return normalizeAdminPost(rows[0])
  }

  @InjectManager()
  async listAdminPosts(
    filters: {
      q?: string
      status?: "draft" | "published"
      category_id?: string
    },
    pagination: { limit: number; offset: number },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const manager = sharedContext?.manager
    const values: unknown[] = []
    const where = ["p.deleted_at is null"]

    if (filters.q) {
      values.push(`%${filters.q}%`)
      where.push("p.title ilike ?")
    }

    if (filters.status) {
      values.push(filters.status)
      where.push("p.status = ?")
    }

    if (filters.category_id) {
      values.push(filters.category_id)
      where.push("exists (select 1 from blog_post_category pc2 where pc2.post_id = p.id and pc2.category_id = ? and pc2.deleted_at is null)")
    }

    const whereSql = where.join(" and ")

    const posts = await manager?.execute(
      `
      select
        p.*,
        coalesce(
          json_agg(
            distinct jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug)
          ) filter (where c.id is not null),
          '[]'::json
        ) as categories
      from blog_post p
      left join blog_post_category pc on pc.post_id = p.id and pc.deleted_at is null
      left join blog_category c on c.id = pc.category_id and c.deleted_at is null
      where ${whereSql}
      group by p.id
      order by coalesce(p.publish_date, p.created_at) desc
      limit ? offset ?
      `,
      [...values, pagination.limit, pagination.offset]
    )

    const countResult = await manager?.execute(`select count(*)::int as count from blog_post p where ${whereSql}`, values)

    return {
      posts: (posts || []).map((post: AdminPostRow) => normalizeAdminPost(post)),
      count: countResult?.[0]?.count || 0,
    }
  }

  @InjectManager()
  async listStorePublishedPosts(
    filters: {
      q?: string
      category?: string
    },
    pagination: { limit: number; offset: number },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const manager = sharedContext?.manager
    const values: unknown[] = []
    const where = ["p.deleted_at is null", "p.status = 'published'", "coalesce(p.publish_date, p.created_at) <= now()"]

    if (filters.q) {
      values.push(`%${filters.q}%`)
      where.push("p.title ilike ?")
    }

    if (filters.category) {
      values.push(filters.category)
      where.push(
        "exists (select 1 from blog_post_category pc2 join blog_category c2 on c2.id = pc2.category_id where pc2.post_id = p.id and pc2.deleted_at is null and c2.deleted_at is null and (c2.slug = ? or c2.id = ?))"
      )
      values.push(filters.category)
    }

    const whereSql = where.join(" and ")

    const posts = await manager?.execute(
      `
      select
        p.id,
        p.title,
        p.slug,
        p.excerpt,
        p.featured_image,
        p.author_name,
        p.publish_date,
        p.tags,
        coalesce(
          json_agg(
            distinct jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug)
          ) filter (where c.id is not null),
          '[]'::json
        ) as categories
      from blog_post p
      left join blog_post_category pc on pc.post_id = p.id and pc.deleted_at is null
      left join blog_category c on c.id = pc.category_id and c.deleted_at is null
      where ${whereSql}
      group by p.id
      order by coalesce(p.publish_date, p.created_at) desc
      limit ? offset ?
      `,
      [...values, pagination.limit, pagination.offset]
    )

    const countResult = await manager?.execute(`select count(*)::int as count from blog_post p where ${whereSql}`, values)

    return {
      posts: posts || [],
      count: countResult?.[0]?.count || 0,
    }
  }

  @InjectManager()
  async retrievePublishedPostBySlug(slug: string, @MedusaContext() sharedContext?: Context<EntityManager>) {
    const manager = sharedContext?.manager

    const rows = await manager?.execute(
      `
      select
        p.*,
        coalesce(
          json_agg(
            distinct jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug)
          ) filter (where c.id is not null),
          '[]'::json
        ) as categories
      from blog_post p
      left join blog_post_category pc on pc.post_id = p.id and pc.deleted_at is null
      left join blog_category c on c.id = pc.category_id and c.deleted_at is null
      where
        p.slug = ?
        and p.deleted_at is null
        and p.status = 'published'
        and coalesce(p.publish_date, p.created_at) <= now()
      group by p.id
      limit 1
      `,
      [slug]
    )

    if (!rows?.length) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Blog post not found")
    }

    return rows[0]
  }

  @InjectManager()
  async listRelatedPosts(
    input: { post_id: string; category_ids: string[]; limit?: number },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    if (!input.category_ids.length) {
      return []
    }

    const manager = sharedContext?.manager
    const rows = await manager?.execute(
      `
      select distinct p.id, p.title, p.slug, p.excerpt, p.featured_image, p.author_name, p.publish_date
      from blog_post p
      join blog_post_category pc on pc.post_id = p.id and pc.deleted_at is null
      where
        p.id != ?
        and p.deleted_at is null
        and p.status = 'published'
        and coalesce(p.publish_date, p.created_at) <= now()
        and pc.category_id = any(?::text[])
      order by coalesce(p.publish_date, p.created_at) desc
      limit ?
      `,
      [input.post_id, input.category_ids, input.limit || 3]
    )

    return rows || []
  }
}

export default BlogModuleService
