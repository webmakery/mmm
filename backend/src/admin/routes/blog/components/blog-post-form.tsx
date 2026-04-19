import { Button, Checkbox, Input, Select, Text, Textarea } from "@medusajs/ui"
import { Controller, UseFormReturn } from "react-hook-form"
import { BaseSyntheticEvent } from "react"
import { BlogCategory, BlogPostFormState, toSlug } from "../blog-utils"

type BlogPostFormProps = {
  form: UseFormReturn<BlogPostFormState>
  editingPostId?: string | null
  onSubmit: (event?: BaseSyntheticEvent) => Promise<void>
  onCancel: () => void
  categoryData?: { categories: BlogCategory[] }
  categoryName: string
  setCategoryName: (value: string) => void
  onCreateCategory: () => Promise<void>
  creatingCategory: boolean
  submitting: boolean
  isFetchingPost?: boolean
}

const BlogPostForm = ({
  form,
  editingPostId,
  onSubmit,
  onCancel,
  categoryData,
  categoryName,
  setCategoryName,
  onCreateCategory,
  creatingCategory,
  submitting,
  isFetchingPost,
}: BlogPostFormProps) => {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div>
        <Text size="small" weight="plus">
          Title
        </Text>
        <Controller
          control={form.control}
          name="title"
          render={({ field }) => (
            <Input
              {...field}
              onChange={(event) => {
                const title = event.target.value

                field.onChange(title)

                if (!editingPostId) {
                  form.setValue("slug", toSlug(title), { shouldDirty: true })
                }
              }}
              required
            />
          )}
        />
      </div>

      <div>
        <Text size="small" weight="plus">
          Slug
        </Text>
        <Controller
          control={form.control}
          name="slug"
          render={({ field }) => (
            <Input {...field} onChange={(event) => field.onChange(toSlug(event.target.value))} required />
          )}
        />
      </div>

      <div>
        <Text size="small" weight="plus">
          Excerpt
        </Text>
        <Controller control={form.control} name="excerpt" render={({ field }) => <Textarea {...field} rows={3} />} />
      </div>

      <div>
        <Text size="small" weight="plus">
          Content
        </Text>
        <Controller control={form.control} name="content" render={({ field }) => <Textarea {...field} rows={8} />} />
      </div>

      <div>
        <Text size="small" weight="plus">
          Featured image URL
        </Text>
        <Controller
          control={form.control}
          name="featured_image"
          render={({ field }) => <Input {...field} type="url" placeholder="https://..." />}
        />
      </div>

      <div>
        <Text size="small" weight="plus">
          Featured image alt text
        </Text>
        <Controller control={form.control} name="image_alt" render={({ field }) => <Input {...field} />} />
      </div>

      <div>
        <Text size="small" weight="plus">
          Meta title
        </Text>
        <Controller control={form.control} name="seo_title" render={({ field }) => <Input {...field} />} />
      </div>

      <div>
        <Text size="small" weight="plus">
          Meta description
        </Text>
        <Controller control={form.control} name="seo_description" render={({ field }) => <Textarea {...field} rows={3} />} />
      </div>

      <div>
        <Text size="small" weight="plus">
          Canonical URL
        </Text>
        <Controller
          control={form.control}
          name="canonical_url"
          render={({ field }) => <Input {...field} type="url" placeholder="https://..." />}
        />
      </div>

      <div>
        <Text size="small" weight="plus">
          Status
        </Text>
        <Controller
          control={form.control}
          name="status"
          render={({ field }) => (
            <Select value={field.value} onValueChange={(value) => field.onChange(value as "draft" | "published")}>
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="draft">Draft</Select.Item>
                <Select.Item value="published">Published</Select.Item>
              </Select.Content>
            </Select>
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Text size="small" weight="plus">
          Categories
        </Text>
        <div className="flex gap-2">
          <Input placeholder="Category name" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
          <Button
            type="button"
            variant="secondary"
            onClick={onCreateCategory}
            isLoading={creatingCategory}
            disabled={!categoryName.trim()}
          >
            Add category
          </Button>
        </div>
        <Controller
          control={form.control}
          name="category_ids"
          render={({ field }) => (
            <div className="flex flex-col gap-2">
              {(categoryData?.categories || []).map((category) => {
                const checked = field.value.includes(category.id)

                return (
                  <label key={category.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => {
                        field.onChange(value ? [...field.value, category.id] : field.value.filter((id) => id !== category.id))
                      }}
                    />
                    <Text size="small">{category.name}</Text>
                  </label>
                )
              })}
            </div>
          )}
        />
      </div>

      <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t bg-ui-bg-base pt-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={submitting || isFetchingPost} disabled={isFetchingPost}>
          {editingPostId ? "Save" : "Create"}
        </Button>
      </div>
    </form>
  )
}

export default BlogPostForm
