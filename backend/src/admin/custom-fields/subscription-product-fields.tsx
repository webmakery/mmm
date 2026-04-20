import { Input, Select, Switch, Text, Textarea } from "@medusajs/ui"

type FieldProps<T = string> = {
  value?: T
  onChange: (value: T) => void
}

const toStringValue = (value: unknown) => (typeof value === "string" ? value : "")

const SubscriptionToggleField = ({ value, onChange }: FieldProps<boolean>) => {
  return (
    <div className="flex items-center justify-between gap-3">
      <Text size="small" leading="compact" className="text-ui-fg-subtle">
        Enable this when the product should use the Stripe subscription flow.
      </Text>
      <Switch
        checked={Boolean(value)}
        onCheckedChange={(checked) => onChange(Boolean(checked))}
      />
    </div>
  )
}

const SubscriptionIntervalField = ({ value, onChange }: FieldProps<string>) => {
  const selected = toStringValue(value) || "monthly"

  return (
    <Select value={selected} onValueChange={onChange}>
      <Select.Trigger>
        <Select.Value />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="monthly">Monthly</Select.Item>
        <Select.Item value="yearly">Yearly</Select.Item>
      </Select.Content>
    </Select>
  )
}

const TextInputField = ({ value, onChange }: FieldProps<string>) => {
  return (
    <Input
      value={toStringValue(value)}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

const MetadataField = ({ value, onChange }: FieldProps<string>) => {
  return (
    <Textarea
      rows={5}
      value={toStringValue(value)}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

// The admin vite plugin looks for this exact function name.
const unstable_defineCustomFieldsConfig = <T,>(config: T) => config

export default unstable_defineCustomFieldsConfig({
  model: "product",
  link: {},
  forms: [
    {
      zone: "create",
      tab: "general",
      fields: {
        "metadata.subscription.is_subscription_product": {
          label: "Subscription Product",
          description: "Mark this product as a subscription.",
          component: SubscriptionToggleField,
        },
        "metadata.subscription.interval": {
          label: "Billing Interval",
          description: "Billing cadence used by the current subscription flow.",
          component: SubscriptionIntervalField,
        },
        "metadata.subscription.stripe_product_id": {
          label: "Stripe Product ID",
          description: "Optional. Stripe product reference for this subscription product.",
          component: TextInputField,
        },
        "metadata.subscription.stripe_price_id": {
          label: "Stripe Price ID",
          description: "Required for Stripe checkout session creation.",
          component: TextInputField,
        },
        "metadata.subscription.extra_metadata_json": {
          label: "Subscription Metadata (JSON)",
          description: "Optional JSON object merged into Stripe checkout metadata.",
          component: MetadataField,
        },
      },
    },
    {
      zone: "edit",
      fields: {
        "metadata.subscription.is_subscription_product": {
          label: "Subscription Product",
          description: "Mark this product as a subscription.",
          component: SubscriptionToggleField,
        },
        "metadata.subscription.interval": {
          label: "Billing Interval",
          description: "Billing cadence used by the current subscription flow.",
          component: SubscriptionIntervalField,
        },
        "metadata.subscription.stripe_product_id": {
          label: "Stripe Product ID",
          description: "Optional. Stripe product reference for this subscription product.",
          component: TextInputField,
        },
        "metadata.subscription.stripe_price_id": {
          label: "Stripe Price ID",
          description: "Required for Stripe checkout session creation.",
          component: TextInputField,
        },
        "metadata.subscription.extra_metadata_json": {
          label: "Subscription Metadata (JSON)",
          description: "Optional JSON object merged into Stripe checkout metadata.",
          component: MetadataField,
        },
      },
    },
  ],
})
