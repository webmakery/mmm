import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { INVOICE_MODULE } from "../../modules/invoice-generator"

type StepInput = {
  id?: string
  company_name?: string
  company_address?: string
  company_phone?: string
  company_email?: string
  company_logo?: string
  notes?: string
}

export const updateInvoiceConfigStep = createStep(
  "update-invoice-config",
  async ({ id, ...updateData }: StepInput, { container }) => {
    const invoiceGeneratorService = container.resolve(INVOICE_MODULE) as any

    const previousConfig = id
      ? await invoiceGeneratorService.retrieveInvoiceConfig(id)
      : (await invoiceGeneratorService.listInvoiceConfigs())[0]

    const updatedConfig = await invoiceGeneratorService.updateInvoiceConfigs({
      id: previousConfig.id,
      ...updateData,
    })

    return new StepResponse(updatedConfig, previousConfig)
  },
  async (previousConfig, { container }) => {
    if (!previousConfig) {
      return
    }

    const invoiceGeneratorService = container.resolve(INVOICE_MODULE) as any

    await invoiceGeneratorService.updateInvoiceConfigs({
      id: previousConfig.id,
      company_name: previousConfig.company_name,
      company_address: previousConfig.company_address,
      company_phone: previousConfig.company_phone,
      company_email: previousConfig.company_email,
      company_logo: previousConfig.company_logo,
      notes: previousConfig.notes,
    })
  }
)
