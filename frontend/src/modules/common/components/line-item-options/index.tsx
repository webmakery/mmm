import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import { readLineItemBuilderSelection } from "@lib/util/product-builder"

type LineItemOptionsProps = {
  variant: HttpTypes.StoreProductVariant | undefined
  metadata?: Record<string, unknown> | null
  "data-testid"?: string
  "data-value"?: HttpTypes.StoreProductVariant
}

const LineItemOptions = ({
  variant,
  metadata,
  "data-testid": dataTestid,
  "data-value": dataValue,
}: LineItemOptionsProps) => {
  const productBuilderSelection = readLineItemBuilderSelection(metadata)

  return (
    <div className="flex flex-col">
      <Text
        data-testid={dataTestid}
        data-value={dataValue}
        className="inline-block txt-medium text-ui-fg-subtle w-full overflow-hidden text-ellipsis"
      >
        Variant: {variant?.title}
      </Text>
      {productBuilderSelection.map((selection) => (
        <Text
          key={selection.title}
          className="inline-block txt-medium text-ui-fg-subtle w-full overflow-hidden text-ellipsis"
        >
          {selection.title}: {selection.value}
        </Text>
      ))}
    </div>
  )
}

export default LineItemOptions
