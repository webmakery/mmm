import { DiscoveryInput, LeadDiscoveryProvider, RawBusinessLead } from "../types"

const GOOGLE_PLACES_TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"

export class GooglePlacesLeadDiscoveryProvider implements LeadDiscoveryProvider {
  constructor(private readonly apiKey: string) {}

  async fetchColdLeads(input: DiscoveryInput): Promise<RawBusinessLead[]> {
    const params = new URLSearchParams({
      key: this.apiKey,
      query: input.location ? `${input.query} in ${input.location}` : input.query,
    })

    const response = await fetch(`${GOOGLE_PLACES_TEXT_SEARCH_URL}?${params.toString()}`)
    if (!response.ok) {
      throw new Error(`Google Places request failed (${response.status})`)
    }

    const payload = (await response.json()) as {
      results?: Array<{
        place_id?: string
        name?: string
        website?: string
        formatted_address?: string
        formatted_phone_number?: string
        types?: string[]
        rating?: number
        user_ratings_total?: number
      }>
    }

    const records = payload.results ?? []
    const maxResults = Math.max(1, Math.min(input.max_results ?? 20, 50))

    return records.slice(0, maxResults).map((lead) => ({
      external_id: lead.place_id || `${lead.name || "unknown"}-${Math.random().toString(36).slice(2)}`,
      name: lead.name || "Unknown business",
      website: lead.website || null,
      phone: lead.formatted_phone_number || null,
      address: lead.formatted_address || null,
      category: lead.types?.[0] || null,
      rating: typeof lead.rating === "number" ? lead.rating : null,
      review_count: typeof lead.user_ratings_total === "number" ? lead.user_ratings_total : null,
      source: "google_places",
      metadata: {
        google_types: lead.types || [],
      },
    }))
  }
}
