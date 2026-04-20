import { defineRouteConfig } from "@medusajs/admin-sdk"
import { User } from "@medusajs/icons"
import { Button, Container, Drawer, Heading, Input, Label, Table, Text, Textarea, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/sdk"

type Template = {
  id: string
  name: string
  subject: string
  description?: string | null
  html_content: string
  text_content?: string | null
  variables?: Record<string, unknown> | null
}

type TemplateForm = {
  name: string
  subject: string
  description: string
  html_content: string
  text_content: string
  variables: string
}

const defaultForm: TemplateForm = {
  name: "",
  subject: "",
  description: "",
  html_content: "",
  text_content: "",
  variables: "{}",
}

const formatVariables = (variables?: Record<string, unknown> | null) => {
  if (!variables || Object.keys(variables).length === 0) {
    return "{}"
  }

  return JSON.stringify(variables, null, 2)
}

const EmailTemplatesPage = () => {
  const queryClient = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [form, setForm] = useState<TemplateForm>(defaultForm)

  const { data, refetch, isLoading } = useQuery<{ templates: Template[]; count: number }>({
    queryKey: ["email-templates"],
    queryFn: () => sdk.client.fetch("/admin/email-marketing/templates", { query: { limit: 100, offset: 0 } }),
  })

  const refreshTemplates = () => {
    queryClient.invalidateQueries({ queryKey: ["email-templates"] })
    void refetch()
  }

  const openCreateDrawer = () => {
    setEditingTemplate(null)
    setForm(defaultForm)
    setDrawerOpen(true)
  }

  const openEditDrawer = (template: Template) => {
    setEditingTemplate(template)
    setForm({
      name: template.name,
      subject: template.subject,
      description: template.description || "",
      html_content: template.html_content || "",
      text_content: template.text_content || "",
      variables: formatVariables(template.variables),
    })
    setDrawerOpen(true)
  }

  const upsertMutation = useMutation({
    mutationFn: async () => {
      let parsedVariables: Record<string, unknown> = {}

      try {
        parsedVariables = form.variables.trim() ? JSON.parse(form.variables) : {}
      } catch {
        throw new Error("Variables must be valid JSON")
      }

      const body = {
        name: form.name.trim(),
        subject: form.subject.trim(),
        description: form.description.trim() || null,
        html_content: form.html_content.trim(),
        text_content: form.text_content.trim() || null,
        variables: parsedVariables,
      }

      if (editingTemplate) {
        return sdk.client.fetch(`/admin/email-marketing/templates/${editingTemplate.id}`, {
          method: "POST",
          body,
        })
      }

      return sdk.client.fetch("/admin/email-marketing/templates", {
        method: "POST",
        body,
      })
    },
    onSuccess: () => {
      toast.success(editingTemplate ? "Template updated" : "Template created")
      setDrawerOpen(false)
      setEditingTemplate(null)
      setForm(defaultForm)
      refreshTemplates()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to save template")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sdk.client.fetch(`/admin/email-marketing/templates/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Template deleted")
      refreshTemplates()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete template")
    },
  })

  const canSubmit = form.name.trim() && form.subject.trim() && form.html_content.trim()

  return (
    <Container>
      <div className="flex items-center justify-between gap-3">
        <div>
          <Heading>Email templates</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Reusable templates for campaign rendering.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button size="small" variant="secondary" onClick={() => refetch()} isLoading={isLoading}>
            Refresh
          </Button>
          <Button size="small" onClick={openCreateDrawer}>
            Create template
          </Button>
        </div>
      </div>

      <Table className="mt-4">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Subject</Table.HeaderCell>
            <Table.HeaderCell></Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {(data?.templates || []).map((template) => (
            <Table.Row key={template.id}>
              <Table.Cell>{template.name}</Table.Cell>
              <Table.Cell>{template.subject}</Table.Cell>
              <Table.Cell>
                <div className="flex items-center justify-end gap-2">
                  <Button size="small" variant="secondary" onClick={() => openEditDrawer(template)}>
                    Edit
                  </Button>
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => deleteMutation.mutate(template.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>{editingTemplate ? "Edit template" : "Create template"}</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <div className="grid grid-cols-1 gap-4 pb-6">
              <div className="grid grid-cols-1 gap-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Label>Subject</Label>
                <Input value={form.subject} onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))} />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Label>HTML content</Label>
                <Textarea
                  rows={10}
                  value={form.html_content}
                  onChange={(e) => setForm((prev) => ({ ...prev, html_content: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Label>Text content</Label>
                <Textarea
                  rows={4}
                  value={form.text_content}
                  onChange={(e) => setForm((prev) => ({ ...prev, text_content: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Label>Variables (JSON)</Label>
                <Textarea
                  rows={4}
                  value={form.variables}
                  onChange={(e) => setForm((prev) => ({ ...prev, variables: e.target.value }))}
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button disabled={!canSubmit || upsertMutation.isPending} onClick={() => upsertMutation.mutate()}>
                  {editingTemplate ? "Save changes" : "Create template"}
                </Button>
              </div>
            </div>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Templates",
  icon: User,
})

export default EmailTemplatesPage
