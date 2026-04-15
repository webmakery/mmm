import { Container } from "@medusajs/ui"

export default function Loading() {
  return (
    <Container className="w-full" data-testid="account-dashboard-loading">
      <div className="flex flex-col gap-y-6 p-6">
        <div className="h-6 w-48 animate-pulse rounded bg-ui-bg-subtle" />
        <div className="grid grid-cols-1 gap-4 small:grid-cols-2">
          <div className="h-28 animate-pulse rounded bg-ui-bg-subtle" />
          <div className="h-28 animate-pulse rounded bg-ui-bg-subtle" />
        </div>
        <div className="h-64 animate-pulse rounded bg-ui-bg-subtle" />
      </div>
    </Container>
  )
}
