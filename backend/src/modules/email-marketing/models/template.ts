import { model } from "@medusajs/framework/utils"
import EmailCampaign from "./campaign"

const EmailTemplate = model.define("email_template", {
  id: model.id().primaryKey(),
  name: model.text(),
  description: model.text().nullable(),
  subject: model.text(),
  html_content: model.text(),
  text_content: model.text().nullable(),
  variables: model.json().nullable(),
  campaigns: model.hasMany(() => EmailCampaign, {
    mappedBy: "template",
  }),
  metadata: model.json().nullable(),
})

export default EmailTemplate
