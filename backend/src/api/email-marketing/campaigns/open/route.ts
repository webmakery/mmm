import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { EMAIL_MARKETING_MODULE } from "../../../../modules/email-marketing"
import EmailMarketingModuleService from "../../../../modules/email-marketing/service"

export const GetEmailCampaignOpenSchema = z.object({
  t: z.string().min(1),
})

export async function GET(req: MedusaRequest<z.infer<typeof GetEmailCampaignOpenSchema>>, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)

  logger.info(
    `[email-marketing] open tracking route hit token_length=${req.validatedQuery.t.length} ip=${req.ip || "n/a"} ua=${String(req.headers["user-agent"] || "").slice(0, 120)}`
  )

  const result = await service.applyOpenTrackingToken(req.validatedQuery.t, {
    user_agent: req.headers["user-agent"] || null,
    ip: req.ip || null,
  })

  if (result.updated) {
    logger.info(
      `[email-marketing] open tracking event applied subscriber_id=${result.subscriber_id || "n/a"} log_id=${result.log_id || "n/a"}`
    )
  } else {
    logger.warn(`[email-marketing] open tracking event skipped reason=${result.reason}`)
  }

  res.setHeader("Content-Type", "image/gif")
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
  res.setHeader("Pragma", "no-cache")
  res.setHeader("Expires", "0")
  res.status(200).send(service.getTransparentTrackingPixelBuffer())
}
