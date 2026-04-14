import {
  InferTypeOf,
  OrderDTO,
  OrderLineItemDTO,
} from "@medusajs/framework/types"
import { MedusaService } from "@medusajs/framework/utils"
import path from "node:path"
import { createRequire } from "node:module"
import { pathToFileURL } from "node:url"
import { InvoiceConfig } from "./models/invoice-config"
import { Invoice } from "./models/invoice"

const fonts = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
}

const getPdfPrinterConstructor = (resolved: any) => {
  const isPdfPrinterConstructor = (candidate: any) =>
    typeof candidate === "function" &&
    typeof candidate.prototype?.createPdfKitDocument === "function"

  const candidates = [
    resolved,
    resolved?.default,
    resolved?.Printer,
    resolved?.default?.Printer,
    resolved?.PdfPrinter,
    resolved?.default?.PdfPrinter,
    resolved?.default?.default,
    resolved?.default?.default?.Printer,
    resolved?.default?.default?.PdfPrinter,
  ]

  for (const candidate of candidates) {
    if (isPdfPrinterConstructor(candidate)) {
      return candidate
    }
  }

  const queue = [resolved]
  const visited = new Set<any>()

  while (queue.length) {
    const current = queue.shift()

    if (!current || (typeof current !== "object" && typeof current !== "function")) {
      continue
    }

    if (visited.has(current)) {
      continue
    }

    visited.add(current)

    if (isPdfPrinterConstructor(current)) {
      return current
    }

    for (const value of Object.values(current)) {
      if (typeof value === "object" || typeof value === "function") {
        queue.push(value)
      }
    }
  }

  return null
}

const resolvePdfPrinter = async () => {
  const localRequire = createRequire(import.meta.url)
  const resolutionErrors: string[] = []

  const candidates: Array<{ label: string; resolve: () => Promise<any> | any }> = [
    { label: "import(pdfmake)", resolve: () => import("pdfmake") },
    { label: "require(pdfmake)", resolve: () => localRequire("pdfmake") },
  ]

  try {
    const pdfmakeEntrypointPath = localRequire.resolve("pdfmake")
    const pdfmakeRoot = path.dirname(pdfmakeEntrypointPath)

    candidates.push(
      {
        label: `import(${path.join(pdfmakeRoot, "build/pdfmake.js")})`,
        resolve: () => import(pathToFileURL(path.join(pdfmakeRoot, "build/pdfmake.js")).href),
      },
      {
        label: `require(${path.join(pdfmakeRoot, "build/pdfmake.js")})`,
        resolve: () => localRequire(path.join(pdfmakeRoot, "build/pdfmake.js")),
      }
    )
  } catch (error: any) {
    resolutionErrors.push(`resolve(pdfmake): ${error?.message || String(error)}`)
  }

  for (const candidate of candidates) {
    try {
      const resolved = await candidate.resolve()
      const PdfPrinter = getPdfPrinterConstructor(resolved)

      if (PdfPrinter) {
        return PdfPrinter
      }
    } catch (error: any) {
      resolutionErrors.push(`${candidate.label}: ${error?.message || String(error)}`)
    }
  }

  throw new Error(
    `Unable to resolve PdfPrinter constructor from pdfmake. Attempts: ${resolutionErrors.join(" | ")}`
  )
}

let printer: { createPdfKitDocument: (docDefinition: any) => any } | null = null

const getPrinter = async (): Promise<{ createPdfKitDocument: (docDefinition: any) => any }> => {
  if (!printer) {
    const PdfPrinter = await resolvePdfPrinter()
    printer = new PdfPrinter(fonts)
  }

  if (!printer) {
    throw new Error("Unable to initialize PdfPrinter")
  }

  return printer
}

type GeneratePdfParams = {
  order: OrderDTO
  items: OrderLineItemDTO[]
}

class InvoiceGeneratorService extends MedusaService({
  InvoiceConfig,
  Invoice,
}) {
  async generatePdf(
    params: GeneratePdfParams & {
      invoice_id: string
    }
  ): Promise<Buffer> {
    const invoice = await this.retrieveInvoice(params.invoice_id)

    const pdfContent = Object.keys(invoice.pdfContent || {}).length
      ? invoice.pdfContent
      : await this.createInvoiceContent(params, invoice)

    await this.updateInvoices({
      id: invoice.id,
      pdfContent,
    })

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      void getPrinter()
        .then((resolvedPrinter) => {
          const pdfDoc = resolvedPrinter.createPdfKitDocument(pdfContent as any)

          pdfDoc.on("data", (chunk) => chunks.push(chunk))
          pdfDoc.on("end", () => {
            resolve(Buffer.concat(chunks))
          })
          pdfDoc.on("error", (err) => reject(err))

          pdfDoc.end()
        })
        .catch((err) => reject(err))
    })
  }

  private async createInvoiceContent(
    params: GeneratePdfParams,
    invoice: InferTypeOf<typeof Invoice>
  ): Promise<Record<string, any>> {
    const [config] = await this.listInvoiceConfigs()

    const itemsTable = [
      [
        { text: "Item", style: "tableHeader" },
        { text: "Quantity", style: "tableHeader" },
        { text: "Unit Price", style: "tableHeader" },
        { text: "Total", style: "tableHeader" },
      ],
      ...(await Promise.all(
        params.items.map(async (item) => [
          { text: item.title || "Unknown Item", style: "tableRow" },
          { text: item.quantity.toString(), style: "tableRow" },
          {
            text: await this.formatAmount(item.unit_price, params.order.currency_code),
            style: "tableRow",
          },
          {
            text: await this.formatAmount(Number(item.total), params.order.currency_code),
            style: "tableRow",
          },
        ])
      )),
    ]

    const invoiceId = `INV-${invoice.display_id.toString().padStart(6, "0")}`
    const invoiceDate = new Date(invoice.created_at).toLocaleDateString()

    return {
      pageSize: "A4",
      pageMargins: [40, 60, 40, 60],
      header: {
        margin: [40, 20, 40, 0],
        columns: [
          {
            width: "*",
            stack: [
              ...(config?.company_logo
                ? [
                    {
                      image: await this.imageUrlToBase64(config.company_logo),
                      width: 80,
                      height: 40,
                      fit: [80, 40],
                      margin: [0, 0, 0, 10],
                    },
                  ]
                : []),
              {
                text: config?.company_name || "Your Company Name",
                style: "companyName",
              },
            ],
          },
          {
            width: "auto",
            stack: [
              {
                text: "INVOICE",
                style: "invoiceTitle",
                alignment: "right",
              },
            ],
          },
        ],
      },
      content: [
        {
          margin: [0, 20, 0, 0],
          columns: [
            {
              width: "*",
              stack: [
                {
                  text: "COMPANY DETAILS",
                  style: "sectionHeader",
                  margin: [0, 0, 0, 8],
                },
                config?.company_address
                  ? {
                      text: config.company_address,
                      style: "companyAddress",
                      margin: [0, 0, 0, 4],
                    }
                  : undefined,
                config?.company_phone
                  ? {
                      text: config.company_phone,
                      style: "companyContact",
                      margin: [0, 0, 0, 4],
                    }
                  : undefined,
                config?.company_email
                  ? {
                      text: config.company_email,
                      style: "companyContact",
                    }
                  : undefined,
              ].filter(Boolean),
            },
            {
              width: "auto",
              table: {
                widths: [80, 120],
                body: [
                  [
                    { text: "Invoice ID:", style: "label" },
                    { text: invoiceId, style: "value" },
                  ],
                  [
                    { text: "Invoice Date:", style: "label" },
                    { text: invoiceDate, style: "value" },
                  ],
                  [
                    { text: "Order ID:", style: "label" },
                    { text: params.order.display_id.toString().padStart(6, "0"), style: "value" },
                  ],
                  [
                    { text: "Order Date:", style: "label" },
                    { text: new Date(params.order.created_at).toLocaleDateString(), style: "value" },
                  ],
                ],
              },
              layout: "noBorders",
              margin: [0, 0, 0, 20],
            },
          ],
        },
        { text: "\n" },
        {
          columns: [
            {
              width: "*",
              stack: [
                { text: "BILL TO", style: "sectionHeader", margin: [0, 0, 0, 8] },
                {
                  text: params.order.billing_address
                    ? `${params.order.billing_address.first_name || ""} ${params.order.billing_address.last_name || ""}\n${params.order.billing_address.address_1 || ""}${params.order.billing_address.address_2 ? `\n${params.order.billing_address.address_2}` : ""}\n${params.order.billing_address.city || ""}, ${params.order.billing_address.province || ""} ${params.order.billing_address.postal_code || ""}\n${params.order.billing_address.country_code || ""}${params.order.billing_address.phone ? `\n${params.order.billing_address.phone}` : ""}`
                    : "No billing address provided",
                  style: "addressText",
                },
              ],
            },
            {
              width: "*",
              stack: [
                { text: "SHIP TO", style: "sectionHeader", margin: [0, 0, 0, 8] },
                {
                  text: params.order.shipping_address
                    ? `${params.order.shipping_address.first_name || ""} ${params.order.shipping_address.last_name || ""}\n${params.order.shipping_address.address_1 || ""}${params.order.shipping_address.address_2 ? `\n${params.order.shipping_address.address_2}` : ""}\n${params.order.shipping_address.city || ""}, ${params.order.shipping_address.province || ""} ${params.order.shipping_address.postal_code || ""}\n${params.order.shipping_address.country_code || ""}${params.order.shipping_address.phone ? `\n${params.order.shipping_address.phone}` : ""}`
                    : "No shipping address provided",
                  style: "addressText",
                },
              ],
            },
          ],
        },
        { text: "\n\n" },
        {
          table: {
            headerRows: 1,
            widths: ["*", "auto", "auto", "auto"],
            body: itemsTable,
          },
        },
        { text: "\n" },
        {
          columns: [
            { width: "*", text: "" },
            {
              width: "auto",
              table: {
                widths: ["auto", "auto"],
                body: [
                  [
                    { text: "Subtotal:", style: "totalLabel" },
                    { text: await this.formatAmount(Number(params.order.subtotal), params.order.currency_code), style: "totalValue" },
                  ],
                  [
                    { text: "Tax:", style: "totalLabel" },
                    { text: await this.formatAmount(Number(params.order.tax_total), params.order.currency_code), style: "totalValue" },
                  ],
                  [
                    { text: "Shipping:", style: "totalLabel" },
                    { text: await this.formatAmount(Number(params.order.shipping_methods?.[0]?.total || 0), params.order.currency_code), style: "totalValue" },
                  ],
                  [
                    { text: "Discount:", style: "totalLabel" },
                    { text: await this.formatAmount(Number(params.order.discount_total), params.order.currency_code), style: "totalValue" },
                  ],
                  [
                    { text: "Total:", style: "totalLabel" },
                    { text: await this.formatAmount(Number(params.order.total), params.order.currency_code), style: "totalValue" },
                  ],
                ],
              },
            },
          ],
        },
        ...(config?.notes
          ? [
              { text: "\n\n" },
              { text: "Notes", style: "sectionHeader", margin: [0, 20, 0, 10] },
              { text: config.notes, style: "notesText", margin: [0, 0, 0, 20] },
            ]
          : []),
        {
          text: "Thank you for your business!",
          style: "thankYouText",
          alignment: "center",
          margin: [0, 30, 0, 0],
        },
      ],
      styles: {
        companyName: { fontSize: 18, bold: true },
        companyAddress: { fontSize: 10 },
        companyContact: { fontSize: 10 },
        invoiceTitle: { fontSize: 22, bold: true },
        label: { fontSize: 10 },
        value: { fontSize: 10, bold: true },
        sectionHeader: { fontSize: 11, bold: true },
        addressText: { fontSize: 10 },
        tableHeader: { fontSize: 10, bold: true },
        tableRow: { fontSize: 9 },
        totalLabel: { fontSize: 10, bold: true },
        totalValue: { fontSize: 10, bold: true },
        notesText: { fontSize: 10, italics: true },
        thankYouText: { fontSize: 11, italics: true },
      },
      defaultStyle: {
        font: "Helvetica",
      },
    }
  }

  private async formatAmount(amount: number, currency: string): Promise<string> {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount)
  }

  private async imageUrlToBase64(url: string): Promise<string> {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Unable to fetch image at URL: ${url}`)
    }

    const contentType = response.headers.get("content-type") || "image/png"
    const buffer = Buffer.from(await response.arrayBuffer())
    return `data:${contentType};base64,${buffer.toString("base64")}`
  }
}

export default InvoiceGeneratorService
