export const ACCOUNT_CREATED_TAG = "Account Created"
export const PURCHASED_TAG = "Purchased"

const toTrimmedString = (value: unknown) => (typeof value === "string" ? value.trim() : "")

export const normalizeTagLabel = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, " ")

export const dedupeTags = (tags: string[]) => {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const tag of tags) {
    const sanitized = normalizeTagLabel(tag)

    if (!sanitized) {
      continue
    }

    const identity = sanitized.toLowerCase()

    if (seen.has(identity)) {
      continue
    }

    seen.add(identity)
    normalized.push(sanitized)
  }

  return normalized
}

export const extractTagsFromMetadata = (metadata: Record<string, unknown> | null | undefined) => {
  const rawTags = metadata?.tags

  if (Array.isArray(rawTags)) {
    return dedupeTags(rawTags.map((value) => toTrimmedString(value)).filter(Boolean))
  }

  if (typeof rawTags === "string") {
    return dedupeTags(rawTags.split(",").map((value) => value.trim()).filter(Boolean))
  }

  return []
}

export const mergeTags = (currentTags: string[], additionalTags: string[]) =>
  dedupeTags([...currentTags, ...additionalTags])

export const tagsToRecord = (tags: string[]) =>
  tags.reduce<Record<string, boolean>>((acc, tag) => {
    acc[tag] = true
    return acc
  }, {})
