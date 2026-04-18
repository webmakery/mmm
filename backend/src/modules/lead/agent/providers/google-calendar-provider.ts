import { LeadCalendarProvider } from "../types"

export class GoogleCalendarProvider implements LeadCalendarProvider {
  constructor(
    private readonly accessToken: string,
    private readonly calendarId: string
  ) {}

  async createFollowUpEvent(input: {
    lead_id: string
    company: string
    when: Date
    owner_email?: string
    notes: string
  }): Promise<{ event_id: string }> {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.calendarId)}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          summary: `Lead follow-up: ${input.company}`,
          description: `${input.notes}\n\nLead ID: ${input.lead_id}`,
          start: {
            dateTime: input.when.toISOString(),
          },
          end: {
            dateTime: new Date(input.when.getTime() + 30 * 60 * 1000).toISOString(),
          },
          attendees: input.owner_email ? [{ email: input.owner_email }] : undefined,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Google Calendar events.insert failed (${response.status})`)
    }

    const payload = (await response.json()) as { id?: string }

    if (!payload.id) {
      throw new Error("Google Calendar events.insert returned no event id")
    }

    return {
      event_id: payload.id,
    }
  }
}
