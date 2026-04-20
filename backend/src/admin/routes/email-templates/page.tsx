import { defineRouteConfig } from "@medusajs/admin-sdk"
import { User } from "@medusajs/icons"
import { Button, Container, Heading, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/sdk"

type Template = {
  id: string
  name: string
  subject: string
}

const EmailTemplatesPage = () => {
  const { data, refetch, isLoading } = useQuery<{ templates: Template[]; count: number }>({
    queryKey: ["email-templates"],
    queryFn: () => sdk.client.fetch("/admin/email-marketing/templates", { query: { limit: 100, offset: 0 } }),
  })

  return (
    <Container>
      <div className="flex items-center justify-between gap-3">
        <div>
          <Heading>Email templates</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Reusable templates for campaign rendering.
          </Text>
        </div>
        <Button size="small" variant="secondary" onClick={() => refetch()} isLoading={isLoading}>
          Refresh
        </Button>
      </div>

      <Table className="mt-4">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Subject</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {(data?.templates || []).map((template) => (
            <Table.Row key={template.id}>
              <Table.Cell>{template.name}</Table.Cell>
              <Table.Cell>{template.subject}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Templates",
  icon: User,
})

export default EmailTemplatesPage
