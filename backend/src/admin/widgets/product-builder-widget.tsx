import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, AdminProduct } from "@medusajs/types"
import { Button, Container, Heading, Label, Switch, Text, Textarea } from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"

type BuilderOptionType = "select" | "text"

type BuilderOption = {
  id: string
  title: string
  type: BuilderOptionType
  values?: string[]
  required?: boolean
}

type BuilderConfig = {
  enabled?: boolean
  options: BuilderOption[]
}

const METADATA_KEY = "product_builder"

const parseBuilderConfig = (metadata: AdminProduct["metadata"]): BuilderConfig => {
  const raw = metadata?.[METADATA_KEY]

  if (!raw || typeof raw !== "object") {
    return {
      enabled: false,
      options: [],
    }
  }

  const config = raw as Record<string, unknown>
  const options = Array.isArray(config.options)
    ? config.options
        .map((option, index) => {
          if (!option || typeof option !== "object") {
            return null
          }

          const value = option as Record<string, unknown>
          const type = value.type === "text" ? "text" : "select"
          const list = Array.isArray(value.values)
            ? value.values
                .filter((item): item is string => typeof item === "string" && !!item.trim())
                .map((item) => item.trim())
            : []

          return {
            id:
              (typeof value.id === "string" && value.id.trim()) ||
              `option_${index + 1}`,
            title:
              (typeof value.title === "string" && value.title.trim()) ||
              `Option ${index + 1}`,
            type,
            values: type === "select" ? list : undefined,
            required: value.required !== false,
          } as BuilderOption
        })
        .filter((option): option is BuilderOption => !!option)
    : []

  return {
    enabled: config.enabled !== false,
    options,
  }
}

const ProductBuilderWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const [config, setConfig] = useState<BuilderConfig>({ enabled: false, options: [] })
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setConfig(parseBuilderConfig(data.metadata))
  }, [data.metadata])

  const optionsText = useMemo(
    () =>
      config.options
        .map((option) => {
          const values = option.type === "select" ? (option.values || []).join("|") : ""
          return [option.id, option.title, option.type, values, option.required ? "required" : "optional"].join(";")
        })
        .join("\n"),
    [config.options]
  )

  const updateOptionsFromText = (value: string) => {
    const options = value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [id, title, typeValue, valuesText, requiredText] = line.split(";")
        const type: BuilderOptionType = typeValue === "text" ? "text" : "select"

        return {
          id: id?.trim() || `option_${index + 1}`,
          title: title?.trim() || `Option ${index + 1}`,
          type,
          values:
            type === "select"
              ? (valuesText || "")
                  .split("|")
                  .map((entry) => entry.trim())
                  .filter(Boolean)
              : undefined,
          required: requiredText?.trim() !== "optional",
        } as BuilderOption
      })
      .filter((option) => option.type === "text" || (option.values && option.values.length))

    setConfig((prev) => ({
      ...prev,
      options,
    }))
  }

  const save = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch(`/admin/products/${data.id}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          metadata: {
            ...(data.metadata || {}),
            [METADATA_KEY]: config,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save")
      }

      setMessage("Saved")
    } catch {
      setMessage("Failed to save")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Container>
      <Heading level="h2">Product Builder</Heading>
      <Text>Configure product builder options as one option per line.</Text>
      <Label htmlFor="product-builder-enabled">Enable Product Builder</Label>
      <Switch
        id="product-builder-enabled"
        checked={!!config.enabled}
        onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, enabled: checked }))}
      />
      <Label htmlFor="product-builder-options">
        Format: id;title;type(select|text);values(separated with |);required(optional|required)
      </Label>
      <Textarea
        id="product-builder-options"
        rows={8}
        value={optionsText}
        onChange={(event) => updateOptionsFromText(event.target.value)}
      />
      <Button onClick={save} isLoading={isSaving}>
        Save
      </Button>
      {message ? <Text>{message}</Text> : null}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductBuilderWidget
