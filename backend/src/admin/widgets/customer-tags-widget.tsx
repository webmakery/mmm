import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps } from "@medusajs/framework/types"
import { Button, Container, Heading, Input, Label, Text, toast } from "@medusajs/ui"
import { useMutation } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { sdk } from "../lib/sdk"

type AdminCustomerWithMetadata = {
  id: string
  metadata?: Record<string, unknown> | null
}

const parseTags = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

const toTagString = (metadata?: Record<string, unknown> | null) => {
  const rawTags = metadata?.tags

  if (Array.isArray(rawTags)) {
    return rawTags.filter((value) => typeof value === "string").join(", ")
  }

  if (typeof rawTags === "string") {
    return rawTags
  }

  return ""
}

const CustomerTagsWidget = ({ data }: DetailWidgetProps<AdminCustomerWithMetadata>) => {
  const initialTagString = useMemo(() => toTagString(data.metadata), [data.metadata])
  const [tagsInput, setTagsInput] = useState(initialTagString)

  useEffect(() => {
    setTagsInput(initialTagString)
  }, [initialTagString])

  const updateTagsMutation = useMutation({
    mutationFn: async () => {
      return sdk.client.fetch(`/admin/customers/${data.id}/tags`, {
        method: "POST",
        body: {
          tags: parseTags(tagsInput),
        },
      })
    },
    onSuccess: () => {
      toast.success("Customer tags updated")
    },
    onError: () => {
      toast.error("Failed to update customer tags")
    },
  })

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Customer Tags</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Tags are synced to email marketing audiences for campaign targeting.
        </Text>
      </div>

      <div className="flex flex-col gap-2 px-6 py-4">
        <Label size="small" weight="plus">
          Tags (comma separated)
        </Label>
        <Input
          value={tagsInput}
          onChange={(event) => setTagsInput(event.target.value)}
          placeholder="Account Created, VIP, Purchased"
          disabled={updateTagsMutation.isPending}
        />
        <Button
          size="small"
          onClick={() => updateTagsMutation.mutate()}
          isLoading={updateTagsMutation.isPending}
        >
          Save tags
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "customer.details.side.after",
})

export default CustomerTagsWidget
