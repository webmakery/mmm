import { getAuthHeaders } from "@lib/data/cookies"

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  const headers = new Headers({
    accept: "application/pdf",
  })

  const authHeaders = await getAuthHeaders()

  if ("authorization" in authHeaders) {
    headers.set("authorization", authHeaders.authorization)
  }

  if (process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY) {
    headers.set("x-publishable-api-key", process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY)
  }

  const response = await fetch(`${MEDUSA_BACKEND_URL}/store/orders/${id}/invoices`, {
    method: "GET",
    headers,
    cache: "no-store",
  })

  if (!response.ok) {
    return new Response("Unable to download invoice", { status: response.status })
  }

  const body = await response.arrayBuffer()

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=\"invoice-${id}.pdf\"`,
      "Content-Length": `${body.byteLength}`,
    },
  })
}
