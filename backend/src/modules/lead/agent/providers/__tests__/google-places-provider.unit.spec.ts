import { GooglePlacesLeadDiscoveryProvider } from "../google-places-provider"

describe("GooglePlacesLeadDiscoveryProvider", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  it("fetches place details for each shortlisted place and maps required fields", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              place_id: "place_1",
              name: "Acme Dental",
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "place_1",
          displayName: { text: "Acme Dental" },
          formattedAddress: "123 Main St, Austin, TX",
          websiteUri: "https://acmedental.example",
          nationalPhoneNumber: "+1 555-1111",
          googleMapsUri: "https://maps.google.com/?cid=123",
          primaryType: "dentist",
          types: ["dentist", "health"],
          rating: 4.7,
          userRatingCount: 89,
        }),
      }) as unknown as typeof fetch

    const provider = new GooglePlacesLeadDiscoveryProvider("api-key")

    const leads = await provider.fetchColdLeads({
      query: "dentist",
      location: "Austin, TX",
      max_results: 1,
    })

    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "https://places.googleapis.com/v1/places/place_1",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Goog-Api-Key": "api-key",
          "X-Goog-FieldMask":
            "id,displayName,formattedAddress,websiteUri,nationalPhoneNumber,googleMapsUri,primaryType,types,rating,userRatingCount",
        }),
      })
    )

    expect(leads[0]).toEqual(
      expect.objectContaining({
        name: "Acme Dental",
        place_id: "place_1",
        address: "123 Main St, Austin, TX",
        website: "https://acmedental.example",
        phone: "+1 555-1111",
        google_maps_uri: "https://maps.google.com/?cid=123",
        primary_type: "dentist",
        types: ["dentist", "health"],
        rating: 4.7,
        review_count: 89,
      })
    )
    expect(leads[0].metadata).toEqual(
      expect.objectContaining({
        place_id: "place_1",
        source_place_details: expect.objectContaining({
          returned_fields: expect.arrayContaining([
            "displayName",
            "formattedAddress",
            "websiteUri",
            "nationalPhoneNumber",
            "googleMapsUri",
            "primaryType",
            "types",
            "rating",
            "userRatingCount",
          ]),
          missing_fields: [],
        }),
        website_email_enrichment: expect.objectContaining({
          status: "pending",
          optional: true,
        }),
      })
    )
  })
})
