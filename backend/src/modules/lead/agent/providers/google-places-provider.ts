import { LeadAgentInputError } from "../errors"
import { DiscoveryInput, LeadDiscoveryProvider, RawBusinessLead } from "../types"

const GOOGLE_PLACES_TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"
const GOOGLE_PLACES_DETAILS_URL = "https://places.googleapis.com/v1/places"

const PLACE_DETAILS_FIELD_MASK =
  "id,displayName,formattedAddress,websiteUri,nationalPhoneNumber,googleMapsUri,primaryType,types,rating,userRatingCount"

export class GooglePlacesLeadDiscoveryProvider implements LeadDiscoveryProvider {
  constructor(private readonly apiKey: string) {}

  private async fetchPlaceDetails(placeId: string) {
    const response = await fetch(`${GOOGLE_PLACES_DETAILS_URL}/${encodeURIComponent(placeId)}`, {
      headers: {
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask": PLACE_DETAILS_FIELD_MASK,
      },
    })

    if (!response.ok) {
      throw new Error(`Google Places details request failed (${response.status}) for place_id=${placeId}`)
    }

    return (await response.json()) as {
      id?: string
      displayName?: { text?: string }
      formattedAddress?: string
      websiteUri?: string
      nationalPhoneNumber?: string
      googleMapsUri?: string
      primaryType?: string
      types?: string[]
      rating?: number
      userRatingCount?: number
    }
  }

  async fetchColdLeads(input: DiscoveryInput): Promise<RawBusinessLead[]> {
    console.info("[lead-agent] action=provider_discovery_payload", { input })

    if (!input?.location?.trim()) {
      throw new LeadAgentInputError("location is required for Google Places discovery")
    }

    const params = new URLSearchParams({
      key: this.apiKey,
      query: `${input.query} in ${input.location.trim()}`,
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
    const shortlisted = records.slice(0, maxResults)
    const requestedFieldNames = [
      "displayName",
      "formattedAddress",
      "websiteUri",
      "nationalPhoneNumber",
      "googleMapsUri",
      "primaryType",
      "types",
      "rating",
      "userRatingCount",
    ]

    const enrichedLeads: RawBusinessLead[] = []

    for (const place of shortlisted) {
      const fallbackPlaceId = place.place_id || null
      const details = fallbackPlaceId ? await this.fetchPlaceDetails(fallbackPlaceId) : null
      const returnedFieldNames = requestedFieldNames.filter((name) => {
        switch (name) {
          case "displayName":
            return Boolean(details?.displayName?.text)
          case "formattedAddress":
            return Boolean(details?.formattedAddress)
          case "websiteUri":
            return Boolean(details?.websiteUri)
          case "nationalPhoneNumber":
            return Boolean(details?.nationalPhoneNumber)
          case "googleMapsUri":
            return Boolean(details?.googleMapsUri)
          case "primaryType":
            return Boolean(details?.primaryType)
          case "types":
            return Boolean(details?.types?.length)
          case "rating":
            return typeof details?.rating === "number"
          case "userRatingCount":
            return typeof details?.userRatingCount === "number"
          default:
            return false
        }
      })
      const missingFieldNames = requestedFieldNames.filter((name) => !returnedFieldNames.includes(name))

      const lead: RawBusinessLead = {
        external_id: details?.id || fallbackPlaceId || `${place.name || "unknown"}-${Math.random().toString(36).slice(2)}`,
        place_id: details?.id || fallbackPlaceId,
        name: details?.displayName?.text || place.name || "Unknown business",
        website: details?.websiteUri || place.website || null,
        phone: details?.nationalPhoneNumber || place.formatted_phone_number || null,
        address: details?.formattedAddress || place.formatted_address || null,
        google_maps_uri: details?.googleMapsUri || null,
        primary_type: details?.primaryType || null,
        types: details?.types || place.types || [],
        category: details?.primaryType || details?.types?.[0] || place.types?.[0] || null,
        rating: typeof details?.rating === "number" ? details.rating : typeof place.rating === "number" ? place.rating : null,
        review_count:
          typeof details?.userRatingCount === "number"
            ? details.userRatingCount
            : typeof place.user_ratings_total === "number"
              ? place.user_ratings_total
              : null,
        source: "google_places",
        metadata: {
          google_types: details?.types || place.types || [],
          google_primary_type: details?.primaryType || null,
          place_id: details?.id || fallbackPlaceId,
          google_maps_uri: details?.googleMapsUri || null,
          source_place_details: {
            returned_fields: returnedFieldNames,
            missing_fields: missingFieldNames,
          },
          website_email_enrichment: details?.websiteUri
            ? {
                status: "pending",
                optional: true,
                strategy: "extract_from_business_website",
              }
            : undefined,
        },
      }

      console.info("[lead-agent] action=google_place_details_field_coverage", {
        place_id: lead.place_id,
        returned_fields: returnedFieldNames,
        missing_fields: missingFieldNames,
      })

      enrichedLeads.push(lead)
    }

    return enrichedLeads
  }
}
