import { defineRouteConfig } from "@medusajs/admin-sdk"
import { User } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"

const EmailAnalyticsPage = () => {
  return (
    <Container>
      <Heading>Email analytics</Heading>
      <Text size="small" className="text-ui-fg-subtle mt-2">
        Use campaign details endpoint (/admin/email-marketing/campaigns/:id/analytics) to monitor recipients, sent,
        delivered, failed, open rate, and click rate metrics.
      </Text>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Email Analytics",
  icon: User,
})

export default EmailAnalyticsPage
