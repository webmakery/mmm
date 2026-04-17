import { defineRouteConfig } from "@medusajs/admin-sdk"
import { SquaresPlus } from "@medusajs/icons"
import { Button, Container, Heading, Text } from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { sdk } from "../../../lib/sdk"

type Lead = {
  id: string
  first_name: string
  last_name?: string
  company?: string
  email?: string
  owner_user_id?: string
  next_follow_up_at?: string
  stage_id?: string
}

type LeadStage = {
  id: string
  name: string
  slug: string
  sort_order: number
}

const PipelineBoardPage = () => {
  const { data: stageData, refetch: refetchStages } = useQuery<{ stages: LeadStage[] }>({
    queryKey: ["lead-stages"],
    queryFn: () => sdk.client.fetch("/admin/lead-stages"),
  })

  const { data: leadsData, refetch: refetchLeads } = useQuery<{ leads: Lead[] }>({
    queryKey: ["pipeline-leads"],
    queryFn: () => sdk.client.fetch("/admin/leads", { query: { limit: 200, offset: 0 } }),
  })

  const moveMutation = useMutation({
    mutationFn: ({ leadId, stageId }: { leadId: string; stageId: string }) =>
      sdk.client.fetch(`/admin/leads/${leadId}/move-stage`, {
        method: "POST",
        body: { stage_id: stageId },
      }),
    onSuccess: () => {
      refetchLeads()
      refetchStages()
    },
  })

  const stages = stageData?.stages || []
  const leads = leadsData?.leads || []

  return (
    <div className="flex flex-col gap-y-4">
      <Container className="px-6 py-4">
        <Heading>Pipeline board</Heading>
      </Container>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {stages.map((stage) => (
          <Container key={stage.id} className="space-y-3 px-4 py-4">
            <Heading level="h2">{stage.name}</Heading>
            {leads
              .filter((lead) => lead.stage_id === stage.id)
              .map((lead) => (
                <Container key={lead.id} className="space-y-2 px-4 py-3">
                  <div>
                    <Link to={`/leads/${lead.id}`}>{[lead.first_name, lead.last_name].filter(Boolean).join(" ")}</Link>
                  </div>
                  <Text size="small" className="text-ui-fg-subtle">
                    {lead.company || "-"}
                  </Text>
                  <Text size="small" className="text-ui-fg-subtle">
                    {lead.email || "-"}
                  </Text>
                  <Text size="small" className="text-ui-fg-subtle">
                    Owner: {lead.owner_user_id || "-"}
                  </Text>
                  <Text size="small" className="text-ui-fg-subtle">
                    Follow-up: {lead.next_follow_up_at ? new Date(lead.next_follow_up_at).toLocaleString() : "-"}
                  </Text>
                  <div className="flex flex-wrap gap-2">
                    {stages
                      .filter((candidate) => candidate.id !== stage.id)
                      .slice(0, 2)
                      .map((candidate) => (
                        <Button
                          key={candidate.id}
                          variant="secondary"
                          size="small"
                          onClick={() => moveMutation.mutate({ leadId: lead.id, stageId: candidate.id })}
                        >
                          Move to {candidate.name}
                        </Button>
                      ))}
                  </div>
                </Container>
              ))}
          </Container>
        ))}
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Pipeline",
  icon: SquaresPlus,
})

export default PipelineBoardPage
