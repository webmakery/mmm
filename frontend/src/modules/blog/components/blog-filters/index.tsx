"use client"

import { Button, Input } from "@medusajs/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { FormEvent, useState } from "react"

type BlogFiltersProps = {
  categories: { id: string; name: string; slug: string }[]
}

const BlogFilters = ({ categories }: BlogFiltersProps) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState(searchParams.get("q") || "")

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const params = new URLSearchParams(searchParams)

    if (query.trim()) {
      params.set("q", query.trim())
    } else {
      params.delete("q")
    }

    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  const onCategoryChange = (nextCategory: string) => {
    const params = new URLSearchParams(searchParams)

    if (nextCategory) {
      params.set("category", nextCategory)
    } else {
      params.delete("category")
    }

    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-y-4 mb-8">
      <form onSubmit={onSubmit} className="flex gap-x-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search blog posts"
          aria-label="Search blog posts"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Button
          size="small"
          variant={!searchParams.get("category") ? "primary" : "secondary"}
          onClick={() => onCategoryChange("")}
        >
          All
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            size="small"
            variant={searchParams.get("category") === category.slug ? "primary" : "secondary"}
            onClick={() => onCategoryChange(category.slug)}
          >
            {category.name}
          </Button>
        ))}
      </div>
    </div>
  )
}

export default BlogFilters
