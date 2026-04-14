import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, clx } from "@medusajs/ui"
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types"

type BuilderLineItemMetadata = {
  is_builder_main_product?: boolean
  main_product_line_item_id?: string
  product_builder_id?: string
  custom_fields?: {
    field_id: string
    name?: string
    value: string
  }[]
  is_addon?: boolean
  cart_line_item_id?: string
}

type LineItemWithBuilderMetadata = {
  id: string
  product_title: string
  variant_title?: string
  quantity: number
  metadata?: BuilderLineItemMetadata
}

const OrderBuilderDetailsWidget = ({
  data: order,
}: DetailWidgetProps<AdminOrder>) => {
  const orderItems = (order.items || []) as LineItemWithBuilderMetadata[]

  const builderItems = orderItems.filter(
    (item) =>
      item.metadata?.is_builder_main_product === true ||
      (item.metadata?.custom_fields?.length ?? 0) > 0
  )

  if (builderItems.length === 0) {
    return null
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Items with Builder Configurations</Heading>
      </div>

      <div className="px-6 py-4">
        {builderItems.map((item, index) => {
          const addons = orderItems.filter(
            (orderItem) =>
              orderItem.metadata?.main_product_line_item_id ===
                item.metadata?.cart_line_item_id &&
              orderItem.metadata?.is_addon === true
          )

          return (
            <div
              key={item.id}
              className={clx(
                "mb-6 last:mb-0",
                index < builderItems.length - 1 && "border-ui-border-base border-b pb-6"
              )}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <Text className="font-medium text-ui-fg-base">{item.product_title}</Text>
                  {item.variant_title && (
                    <Text className="text-sm text-ui-fg-muted">
                      Variant: {item.variant_title}
                    </Text>
                  )}
                  <Text className="text-sm text-ui-fg-muted">Quantity: {item.quantity}</Text>
                </div>
              </div>

              {item.metadata?.custom_fields && item.metadata.custom_fields.length > 0 && (
                <div className="bg-ui-bg-field mb-4 rounded-lg p-3">
                  <Text className="txt-compact-medium mb-2 font-medium text-ui-fg-base">
                    Custom Fields
                  </Text>
                  <div className="space-y-1">
                    {item.metadata.custom_fields.map((field, fieldIndex) => (
                      <div
                        key={field.field_id || fieldIndex}
                        className="flex items-center justify-between gap-4"
                      >
                        <Text className="txt-compact-sm text-ui-fg-subtle">
                          {field.name || `Field ${fieldIndex + 1}`}
                        </Text>
                        <Text className="txt-compact-sm text-ui-fg-subtle">{field.value}</Text>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {addons.length > 0 && (
                <div className="bg-ui-bg-field rounded-lg p-3">
                  <Text className="txt-compact-medium mb-2 font-medium text-ui-fg-base">
                    Add-on Products
                  </Text>
                  <div className="space-y-2">
                    {addons.map((addon) => (
                      <div key={addon.id}>
                        <Text className="txt-compact-sm text-ui-fg-base">{addon.product_title}</Text>
                        {addon.variant_title && (
                          <Text className="txt-compact-xs text-ui-fg-muted">
                            Variant: {addon.variant_title}
                          </Text>
                        )}
                        <Text className="txt-compact-sm text-ui-fg-muted">
                          Quantity: {addon.quantity}
                        </Text>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default OrderBuilderDetailsWidget
