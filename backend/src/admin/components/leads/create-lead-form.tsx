import { Button, Input, Label, Select, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { sdk } from "../../lib/sdk"

type LeadStage = {
  id: string
  name: string
}

type CreateLeadFormProps = {
  onSuccess: () => void
}

type FormState = {
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
  source: "manual" | "website" | "ads"
  status: "new" | "contacted" | "qualified" | "won" | "lost"
  stage_id: string
  value_estimate: string
  next_follow_up_at: string
}

const CreateLeadForm = ({ onSuccess }: CreateLeadFormProps) => {
  const [form, setForm] = useState<FormState>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    source: "manual",
    status: "new",
    stage_id: "",
    value_estimate: "",
    next_follow_up_at: "",
  })

  const { data: stageData, isLoading: isStageLoading } = useQuery<{ stages: LeadStage[] }>({
    queryKey: ["lead-stages", "create-lead"],
    queryFn: () => sdk.client.fetch("/admin/lead-stages"),
  })

  const isFormValid = useMemo(
    () => !!form.first_name.trim() && !!form.last_name.trim() && !!form.email.trim(),
    [form.first_name, form.last_name, form.email]
  )

  const createLeadMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch("/admin/leads", {
        method: "POST",
        body: {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          company: form.company.trim() || undefined,
          source: form.source,
          status: form.status,
          stage_id: form.stage_id || undefined,
          value_estimate: form.value_estimate ? Number(form.value_estimate) : undefined,
          next_follow_up_at: form.next_follow_up_at ? new Date(form.next_follow_up_at).toISOString() : undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Lead created")
      onSuccess()
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create lead")
    },
  })

  return (
    <form
      className="flex flex-col gap-y-4"
      onSubmit={(event) => {
        event.preventDefault()

        if (!isFormValid) {
          toast.error("First name, last name, and email are required")
          return
        }

        createLeadMutation.mutate()
      }}
    >
      <div>
        <Label htmlFor="first_name">First name</Label>
        <Input
          id="first_name"
          value={form.first_name}
          onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
          required
        />
      </div>
      <div>
        <Label htmlFor="last_name">Last name</Label>
        <Input
          id="last_name"
          value={form.last_name}
          onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
          required
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          required
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={form.phone}
          onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
        />
      </div>
      <div>
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          value={form.company}
          onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
        />
      </div>
      <div>
        <Label>Source</Label>
        <Select value={form.source} onValueChange={(value: FormState["source"]) => setForm((current) => ({ ...current, source: value }))}>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="manual">Manual</Select.Item>
            <Select.Item value="website">Website</Select.Item>
            <Select.Item value="ads">Ads</Select.Item>
          </Select.Content>
        </Select>
      </div>
      <div>
        <Label>Status</Label>
        <Select value={form.status} onValueChange={(value: FormState["status"]) => setForm((current) => ({ ...current, status: value }))}>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="new">New</Select.Item>
            <Select.Item value="contacted">Contacted</Select.Item>
            <Select.Item value="qualified">Qualified</Select.Item>
            <Select.Item value="won">Won</Select.Item>
            <Select.Item value="lost">Lost</Select.Item>
          </Select.Content>
        </Select>
      </div>
      <div>
        <Label>Stage</Label>
        <Select
          value={form.stage_id || "__none"}
          onValueChange={(value) => setForm((current) => ({ ...current, stage_id: value === "__none" ? "" : value }))}
          disabled={isStageLoading}
        >
          <Select.Trigger>
            <Select.Value placeholder="Select stage" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__none">No stage</Select.Item>
            {stageData?.stages.map((stage) => (
              <Select.Item key={stage.id} value={stage.id}>
                {stage.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>
      <div>
        <Label htmlFor="value_estimate">Value estimate</Label>
        <Input
          id="value_estimate"
          type="number"
          value={form.value_estimate}
          onChange={(event) => setForm((current) => ({ ...current, value_estimate: event.target.value }))}
        />
      </div>
      <div>
        <Label htmlFor="next_follow_up_at">Next follow-up</Label>
        <Input
          id="next_follow_up_at"
          type="datetime-local"
          value={form.next_follow_up_at}
          onChange={(event) => setForm((current) => ({ ...current, next_follow_up_at: event.target.value }))}
        />
      </div>
      {createLeadMutation.isError ? (
        <Text size="small" className="text-ui-fg-error">
          Failed to create lead. Please check the form and try again.
        </Text>
      ) : null}
      <Button type="submit" isLoading={createLeadMutation.isPending} disabled={!isFormValid || createLeadMutation.isPending}>
        Create lead
      </Button>
    </form>
  )
}

export default CreateLeadForm
