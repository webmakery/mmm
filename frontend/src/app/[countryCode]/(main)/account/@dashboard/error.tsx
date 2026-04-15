"use client"

import { Button, Container, Heading, Text } from "@medusajs/ui"

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <Container className="w-full" data-testid="account-dashboard-error">
      <div className="flex flex-col items-start gap-y-4 p-6">
        <Heading level="h2">Something went wrong</Heading>
        <Text className="text-ui-fg-subtle">
          We couldn&apos;t load your dashboard right now.
        </Text>
        <Button variant="secondary" onClick={reset}>
          Try again
        </Button>
      </div>
    </Container>
  )
}
