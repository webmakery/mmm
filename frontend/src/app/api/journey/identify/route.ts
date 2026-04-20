import { getAuthHeaders } from "@lib/data/cookies"

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function POST(request: Request) {
  const headers = new Headers({
    accept: "application/json",
    "content-type": "application/json",
  })

  if (process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY) {
    headers.set("x-publishable-api-key", process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY)
  }

  const authHeaders = await getAuthHeaders()

  if ("authorization" in authHeaders) {
    headers.set("authorization", authHeaders.authorization)
  }

  const response = await fetch(`${MEDUSA_BACKEND_URL}/store/journey/identify`, {
    method: "POST",
    headers,
    body: await request.text(),
    cache: "no-store",
  })

  const body = await response.text()

  return new Response(body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") || "application/json",
    },
  })
}
