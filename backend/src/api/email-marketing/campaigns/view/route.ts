import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { EMAIL_MARKETING_MODULE } from "../../../../modules/email-marketing"
import EmailMarketingModuleService from "../../../../modules/email-marketing/service"

export const GetEmailCampaignViewSchema = z.object({
  t: z.string().min(1),
})

const renderMissingViewHtml = () => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Email not available</title>
  </head>
  <body style="font-family:Arial,sans-serif;padding:32px;line-height:1.5;color:#111827;">
    <h1 style="font-size:20px;margin:0 0 12px;">Email not available</h1>
    <p style="margin:0;">This email view link is invalid or has expired.</p>
  </body>
</html>`

export async function GET(req: MedusaRequest<z.infer<typeof GetEmailCampaignViewSchema>>, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)

  logger.info(
    `[email-marketing] browser view route hit token_length=${req.validatedQuery.t.length} ip=${req.ip || "n/a"} ua=${String(req.headers["user-agent"] || "").slice(0, 120)}`
  )

  const browserView = await service.getCampaignBrowserViewHtmlByToken(req.validatedQuery.t)

  if (!browserView) {
    logger.warn("[email-marketing] browser view route skipped reason=invalid_token")
    res.setHeader("Content-Type", "text/html; charset=utf-8")
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
    res.setHeader("Pragma", "no-cache")
    res.setHeader("Expires", "0")
    return res.status(404).send(renderMissingViewHtml())
  }

  logger.info(
    `[email-marketing] browser view route success campaign_id=${browserView.campaign_id} subscriber_id=${browserView.subscriber_id}`
  )

  res.setHeader("Content-Type", "text/html; charset=utf-8")
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
  res.setHeader("Pragma", "no-cache")
  res.setHeader("Expires", "0")
  return res.status(200).send(browserView.html)
}
