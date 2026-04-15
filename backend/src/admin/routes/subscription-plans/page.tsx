import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CurrencyDollar } from "@medusajs/icons"
import {
  Button,
  Container,
  createDataTableColumnHelper,
  DataTable,
  DataTablePaginationState,
  Drawer,
  Heading,
  Input,
  Select,
  Switch,
  Text,
  toast,
  useDataTable,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { FormEvent, useMemo, useState } from "react"
import { sdk } from "../../lib/sdk"
import { SubscriptionInterval, SubscriptionPlanData } from "../../types"

type SubscriptionPlanFormState = {
  name: string
  stripe_product_id: string
  stripe_price_id: string
  interval: SubscriptionInterval
  active: boolean
  metadata: string
}

const emptyFormState: SubscriptionPlanFormState = {
  name: "",
  stripe_product_id: "",
  stripe_price_id: "",
  interval: SubscriptionInterval.MONTHLY,
  active: true,
  metadata: "",
}

const getFormStateFromPlan = (
  plan: SubscriptionPlanData
): SubscriptionPlanFormState => ({
  name: plan.name,
  stripe_product_id: plan.stripe_product_id,
  stripe_price_id: plan.stripe_price_id,
  interval: plan.interval,
  active: plan.active,
  metadata: plan.metadata ? JSON.stringify(plan.metadata, null, 2) : "",
})

const parseMetadata = (metadata: string) => {
  if (!metadata.trim()) {
    return null
  }

  return JSON.parse(metadata) as Record<string, unknown>
}

const columnHelper = createDataTableColumnHelper<SubscriptionPlanData>()

const columns = [
  columnHelper.accessor("name", {
    header: "Name",
  }),
  columnHelper.accessor("stripe_product_id", {
    header: "Stripe Product",
  }),
  columnHelper.accessor("stripe_price_id", {
    header: "Stripe Price",
  }),
  columnHelper.accessor("interval", {
    header: "Interval",
    cell: ({ getValue }) => {
      const value = getValue()
      return value.charAt(0).toUpperCase() + value.substring(1)
    },
  }),
  columnHelper.accessor("active", {
    header: "Active",
    cell: ({ getValue }) => (getValue() ? "Yes" : "No"),
  }),
]

const SubscriptionPlansPage = () => {
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: 15,
    pageIndex: 0,
  })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanData | null>(null)
  const [formState, setFormState] = useState<SubscriptionPlanFormState>(emptyFormState)
  const [submitting, setSubmitting] = useState(false)

  const query = useMemo(() => {
    return new URLSearchParams({
      limit: `${pagination.pageSize}`,
      offset: `${pagination.pageIndex * pagination.pageSize}`,
    })
  }, [pagination])

  const { data, isLoading, refetch } = useQuery<{
    subscription_plans: SubscriptionPlanData[]
    count: number
  }>({
    queryKey: ["subscription-plans", query.toString()],
    queryFn: () => sdk.client.fetch(`/admin/subscription-plans?${query.toString()}`),
  })

  const resetForm = () => {
    setEditingPlan(null)
    setFormState(emptyFormState)
  }

  const openCreateDrawer = () => {
    resetForm()
    setDrawerOpen(true)
  }

  const openEditDrawer = (plan: SubscriptionPlanData) => {
    setEditingPlan(plan)
    setFormState(getFormStateFromPlan(plan))
    setDrawerOpen(true)
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setSubmitting(true)

    try {
      const payload = {
        ...formState,
        metadata: parseMetadata(formState.metadata),
      }

      if (editingPlan) {
        await sdk.client.fetch(`/admin/subscription-plans/${editingPlan.id}`, {
          method: "POST",
          body: payload,
        })
        toast.success("Subscription plan updated")
      } else {
        await sdk.client.fetch("/admin/subscription-plans", {
          method: "POST",
          body: payload,
        })
        toast.success("Subscription plan created")
      }

      setDrawerOpen(false)
      resetForm()
      refetch()
    } catch (error) {
      console.error(error)
      toast.error("Failed to save subscription plan")
    } finally {
      setSubmitting(false)
    }
  }

  const table = useDataTable({
    columns,
    data: data?.subscription_plans || [],
    getRowId: (plan) => plan.id,
    rowCount: data?.count || 0,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
    onRowClick: (_, row) => openEditDrawer(row),
  })

  return (
    <Container>
      <DataTable instance={table}>
        <DataTable.Toolbar>
          <Heading level="h1">Subscription Plans</Heading>
          <Button onClick={openCreateDrawer}>Create</Button>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
      <Drawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open)
          if (!open) {
            resetForm()
          }
        }}
      >
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>
              {editingPlan ? "Edit Subscription Plan" : "Create Subscription Plan"}
            </Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <form onSubmit={onSubmit}>
              <Text size="small" weight="plus">Name</Text>
              <Input
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />

              <Text size="small" weight="plus">Stripe Product ID</Text>
              <Input
                value={formState.stripe_product_id}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, stripe_product_id: event.target.value }))
                }
                required
              />

              <Text size="small" weight="plus">Stripe Price ID</Text>
              <Input
                value={formState.stripe_price_id}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, stripe_price_id: event.target.value }))
                }
                required
              />

              <Text size="small" weight="plus">Interval</Text>
              <Select
                value={formState.interval}
                onValueChange={(value) =>
                  setFormState((prev) => ({
                    ...prev,
                    interval: value as SubscriptionInterval,
                  }))
                }
              >
                <Select.Trigger>
                  <Select.Value placeholder="Select interval" />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value={SubscriptionInterval.MONTHLY}>Monthly</Select.Item>
                  <Select.Item value={SubscriptionInterval.YEARLY}>Yearly</Select.Item>
                </Select.Content>
              </Select>

              <Text size="small" weight="plus">Metadata (JSON)</Text>
              <Input
                value={formState.metadata}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, metadata: event.target.value }))
                }
                placeholder='{"feature": "premium"}'
              />

              <Text size="small" weight="plus">Active</Text>
              <Switch
                checked={formState.active}
                onCheckedChange={(checked) =>
                  setFormState((prev) => ({ ...prev, active: checked }))
                }
              />

              <Button type="submit" isLoading={submitting}>
                Save
              </Button>
            </form>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Subscription Plans",
  icon: CurrencyDollar,
})

export default SubscriptionPlansPage
