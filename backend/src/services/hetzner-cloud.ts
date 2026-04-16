export type HetznerCreateServerConfig = {
  name: string
  serverType: string
  image: string
  location: string
  labels: Record<string, string>
  userData?: string
}

export type HetznerServerResponse = {
  id: number
  name: string
  publicIpV4: string | null
  cpuCores: number | null
  ramGb: number | null
}

export class HetznerApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = "HetznerApiError"
    this.status = status
  }
}

export default class HetznerCloudService {
  private readonly token: string
  private readonly baseUrl = "https://api.hetzner.cloud/v1"

  constructor(token = process.env.HETZNER_CLOUD_API_TOKEN) {
    if (!token) {
      throw new Error("Missing HETZNER_CLOUD_API_TOKEN configuration")
    }

    this.token = token
  }

  async createServer(config: HetznerCreateServerConfig): Promise<HetznerServerResponse> {
    const response = await fetch(`${this.baseUrl}/servers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        name: config.name,
        server_type: config.serverType,
        image: config.image,
        location: config.location,
        labels: config.labels,
        user_data: config.userData,
      }),
    })

    const payload = (await response.json()) as Record<string, unknown>

    if (!response.ok) {
      throw new HetznerApiError(
        `Failed to create Hetzner server: ${JSON.stringify(payload)}`,
        response.status
      )
    }

    const server = payload.server as Record<string, unknown> | undefined

    if (!server?.id || !server?.name) {
      throw new HetznerApiError("Hetzner create response did not include a server payload")
    }

    return {
      id: Number(server.id),
      name: String(server.name),
      publicIpV4:
        (server.public_net as { ipv4?: { ip?: string | null } } | undefined)?.ipv4?.ip || null,
      cpuCores:
        typeof (server.server_type as { cores?: unknown } | undefined)?.cores === "number"
          ? Number((server.server_type as { cores: number }).cores)
          : null,
      ramGb:
        typeof (server.server_type as { memory?: unknown } | undefined)?.memory === "number"
          ? Number((server.server_type as { memory: number }).memory)
          : null,
    }
  }

  async deleteServer(serverId: string | number): Promise<{ deleted: boolean; alreadyDeleted: boolean }> {
    const response = await fetch(`${this.baseUrl}/servers/${serverId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    })

    if (response.status === 404) {
      return { deleted: true, alreadyDeleted: true }
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>
      throw new HetznerApiError(
        `Failed to delete Hetzner server ${serverId}: ${JSON.stringify(payload)}`,
        response.status
      )
    }

    return { deleted: true, alreadyDeleted: false }
  }
}
