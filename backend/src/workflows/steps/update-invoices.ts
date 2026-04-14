import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { INVOICE_MODULE } from "../../modules/invoice-generator"
import { InvoiceStatus } from "../../modules/invoice-generator/models/invoice"

type StepInput = {
  selector: {
    order_id: string
  }
  data: {
    status: InvoiceStatus
  }
}

export const updateInvoicesStep = createStep(
  "update-invoices",
  async ({ selector, data }: StepInput, { container }) => {
    const invoiceGeneratorService = container.resolve(INVOICE_MODULE) as any

    const prevData = await invoiceGeneratorService.listInvoices(selector)

    const updatedInvoices = await invoiceGeneratorService.updateInvoices({
      selector,
      data,
    })

    return new StepResponse(updatedInvoices, prevData)
  },
  async (prevData, { container }) => {
    if (!prevData) {
      return
    }

    const invoiceGeneratorService = container.resolve(INVOICE_MODULE) as any

    await invoiceGeneratorService.updateInvoices(
      prevData.map((invoice) => ({
        id: invoice.id,
        status: invoice.status,
      }))
    )
  }
)
