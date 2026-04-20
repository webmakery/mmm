import { defineRouteConfig } from "@medusajs/admin-sdk"
import { User } from "@medusajs/icons"
import { Button, Container, Drawer, Heading, Input, Label, Select, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { sdk } from "../../lib/sdk"

type CampaignStatus = "draft" | "scheduled" | "processing" | "sent" | "failed"

type Campaign = {
  id: string
  name: string
  subject: string
  sender_name: string
  sender_email: string
  template_id: string
  status: CampaignStatus
  scheduled_at?: string | null
}

type Template = {
  id: string
  name: string
}

type CampaignForm = {
  name: string
  subject: string
  sender_name: string
  sender_email: string
  template_id: string
  status: "draft" | "scheduled"
  scheduled_at: string
}

const defaultForm: CampaignForm = {
  name: "",
  subject: "",
  sender_name: "",
  sender_email: "",
  template_id: "",
  status: "draft",
  scheduled_at: "",
}

const formatDateTimeLocal = (value?: string | null) => {
  if (!value) {
    return ""
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const timezoneOffsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16)
}

const EmailCampaignsPage = () => {
  const queryClient = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [form, setForm] = useState<CampaignForm>(defaultForm)

  const { data, refetch, isLoading } = useQuery<{ campaigns: Campaign[]; count: number }>({
    queryKey: ["email-campaigns"],
    queryFn: () => sdk.client.fetch("/admin/email-marketing/campaigns", { query: { limit: 100, offset: 0 } }),
  })

  const { data: templateData } = useQuery<{ templates: Template[] }>({
    queryKey: ["email-templates-for-campaigns"],
    queryFn: () => sdk.client.fetch("/admin/email-marketing/templates", { query: { limit: 100, offset: 0 } }),
  })

  const templateOptions = useMemo(() => templateData?.templates || [], [templateData?.templates])

  const openCreateDrawer = () => {
    setEditingCampaign(null)
    setForm(defaultForm)
    setDrawerOpen(true)
  }

  const openEditDrawer = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setForm({
      name: campaign.name,
      subject: campaign.subject,
      sender_name: campaign.sender_name,
      sender_email: campaign.sender_email,
      template_id: campaign.template_id,
      status: campaign.status === "scheduled" ? "scheduled" : "draft",
      scheduled_at: formatDateTimeLocal(campaign.scheduled_at),
    })
    setDrawerOpen(true)
  }

  const refreshCampaigns = () => {
    queryClient.invalidateQueries({ queryKey: ["email-campaigns"] })
    void refetch()
  }

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const body = {
        name: form.name.trim(),
        subject: form.subject.trim(),
        sender_name: form.sender_name.trim(),
        sender_email: form.sender_email.trim(),
        template_id: form.template_id,
        status: form.status,
        scheduled_at: form.status === "scheduled" ? new Date(form.scheduled_at).toISOString() : null,
      }

      if (editingCampaign) {
        return sdk.client.fetch(`/admin/email-marketing/campaigns/${editingCampaign.id}`, {
          method: "POST",
          body,
        })
      }

      return sdk.client.fetch("/admin/email-marketing/campaigns", {
        method: "POST",
        body,
      })
    },
    onSuccess: () => {
      toast.success(editingCampaign ? "Campaign updated" : "Campaign created")
      setDrawerOpen(false)
      setEditingCampaign(null)
      setForm(defaultForm)
      refreshCampaigns()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to save campaign")
    },
  })

  const sendMutation = useMutation({
    mutationFn: (id: string) => sdk.client.fetch(`/admin/email-marketing/campaigns/${id}/send`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Campaign queued")
      refreshCampaigns()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to queue campaign")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sdk.client.fetch(`/admin/email-marketing/campaigns/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Campaign deleted")
      refreshCampaigns()
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete campaign")
    },
  })

  const canSubmit =
    form.name.trim() &&
    form.subject.trim() &&
    form.sender_name.trim() &&
    form.sender_email.trim() &&
    form.template_id &&
    (form.status === "draft" || !!form.scheduled_at)

  return (
    <Container>
      <div className="flex items-center justify-between gap-3">
        <div>
          <Heading>Email campaigns</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Draft, schedule, and send email campaigns.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button size="small" variant="secondary" onClick={() => refetch()} isLoading={isLoading}>
            Refresh
          </Button>
          <Button size="small" onClick={openCreateDrawer}>
            Create campaign
          </Button>
        </div>
      </div>

      <Table className="mt-4">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Subject</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell></Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {(data?.campaigns || []).map((campaign) => (
            <Table.Row key={campaign.id}>
              <Table.Cell>{campaign.name}</Table.Cell>
              <Table.Cell>{campaign.subject}</Table.Cell>
              <Table.Cell className="capitalize">{campaign.status}</Table.Cell>
              <Table.Cell>
                <div className="flex items-center justify-end gap-2">
                  <Button size="small" variant="secondary" onClick={() => openEditDrawer(campaign)}>
                    Edit
                  </Button>
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => sendMutation.mutate(campaign.id)}
                    disabled={campaign.status === "processing" || campaign.status === "sent"}
                    isLoading={sendMutation.isPending}
                  >
                    Send
                  </Button>
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => deleteMutation.mutate(campaign.id)}
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
            <Drawer.Title>{editingCampaign ? "Edit campaign" : "Create campaign"}</Drawer.Title>
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
                <Label>Sender name</Label>
                <Input
                  value={form.sender_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, sender_name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Label>Sender email</Label>
                <Input
                  type="email"
                  value={form.sender_email}
                  onChange={(e) => setForm((prev) => ({ ...prev, sender_email: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Label>Template</Label>
                <Select value={form.template_id} onValueChange={(value) => setForm((prev) => ({ ...prev, template_id: value }))}>
                  <Select.Trigger>
                    <Select.Value placeholder="Select template" />
                  </Select.Trigger>
                  <Select.Content>
                    {templateOptions.map((template) => (
                      <Select.Item key={template.id} value={template.id}>
                        {template.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value: "draft" | "scheduled") => setForm((prev) => ({ ...prev, status: value }))}
                >
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="draft">Draft</Select.Item>
                    <Select.Item value="scheduled">Scheduled</Select.Item>
                  </Select.Content>
                </Select>
              </div>

              {form.status === "scheduled" && (
                <div className="grid grid-cols-1 gap-2">
                  <Label>Scheduled at</Label>
                  <Input
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={(e) => setForm((prev) => ({ ...prev, scheduled_at: e.target.value }))}
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button disabled={!canSubmit || upsertMutation.isPending} onClick={() => upsertMutation.mutate()}>
                  {editingCampaign ? "Save changes" : "Create campaign"}
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
  label: "Campaigns",
  icon: User,
})

export default EmailCampaignsPage
