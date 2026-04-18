import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { LEAD_MODULE } from "../../../../../modules/lead"
import { buildLeadAgentService } from "../../../../../modules/lead/agent/service"
import LeadModuleService from "../../../../../modules/lead/service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const agentService = buildLeadAgentService(req.scope)
  const leadService: LeadModuleService = req.scope.resolve(LEAD_MODULE)

  const result = await agentService.approveAndSendOutreach(leadService, req.params.id)

  res.json(result)
}
