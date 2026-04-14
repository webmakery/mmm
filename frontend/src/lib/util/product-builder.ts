export const PRODUCT_BUILDER_KEY = "product_builder"
export const LINE_ITEM_PRODUCT_BUILDER_KEY = "product_builder_selection"

type BuilderOptionType = "select" | "text"

export type ProductBuilderOption = {
  id: string
  title: string
  type: BuilderOptionType
  values?: string[]
  required?: boolean
}

export type ProductBuilderConfig = {
  enabled?: boolean
  options: ProductBuilderOption[]
}

export type ProductBuilderSelection = Record<string, string>

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length ? value.trim() : null
}

export function parseProductBuilderConfig(metadata: Record<string, unknown> | null | undefined) {
  const raw = metadata?.[PRODUCT_BUILDER_KEY]

  if (!raw || typeof raw !== "object") {
    return null
  }

  const config = raw as Record<string, unknown>
  const rawOptions = Array.isArray(config.options) ? config.options : []

  const options = rawOptions
    .map((option, index) => {
      if (!option || typeof option !== "object") {
        return null
      }

      const value = option as Record<string, unknown>
      const id = asString(value.id) || `option_${index + 1}`
      const title = asString(value.title) || `Option ${index + 1}`
      const type = value.type === "text" ? "text" : "select"
      const values = Array.isArray(value.values)
        ? value.values.filter((item): item is string => typeof item === "string" && !!item.trim())
        : undefined

      if (type === "select" && (!values || values.length === 0)) {
        return null
      }

      return {
        id,
        title,
        type,
        values,
        required: value.required !== false,
      } as ProductBuilderOption
    })
    .filter((option): option is ProductBuilderOption => !!option)

  if (!options.length || config.enabled === false) {
    return null
  }

  return {
    enabled: true,
    options,
  } as ProductBuilderConfig
}

export function isBuilderSelectionValid(
  config: ProductBuilderConfig | null,
  selection: ProductBuilderSelection
) {
  if (!config) {
    return true
  }

  return config.options.every((option) => {
    if (!option.required) {
      return true
    }

    const selected = selection[option.id]

    if (!selected?.trim()) {
      return false
    }

    if (option.type === "select") {
      return !!option.values?.includes(selected)
    }

    return true
  })
}

export function toLineItemBuilderMetadata(
  config: ProductBuilderConfig | null,
  selection: ProductBuilderSelection
) {
  if (!config) {
    return undefined
  }

  const values = config.options
    .map((option) => {
      const selected = selection[option.id]

      if (!selected?.trim()) {
        return null
      }

      return {
        id: option.id,
        title: option.title,
        value: selected,
      }
    })
    .filter((option) => !!option)

  if (!values.length) {
    return undefined
  }

  return {
    [LINE_ITEM_PRODUCT_BUILDER_KEY]: values,
  }
}

export function readLineItemBuilderSelection(metadata: Record<string, unknown> | null | undefined) {
  const raw = metadata?.[LINE_ITEM_PRODUCT_BUILDER_KEY]

  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null
      }

      const value = entry as Record<string, unknown>
      const title = asString(value.title)
      const selected = asString(value.value)

      if (!title || !selected) {
        return null
      }

      return {
        title,
        value: selected,
      }
    })
    .filter((entry): entry is { title: string; value: string } => !!entry)
}
