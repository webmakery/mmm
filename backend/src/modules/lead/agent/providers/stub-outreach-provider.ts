import { OutreachProvider } from "../types"

export class StubOutreachProvider implements OutreachProvider {
  async sendOutreach(_input: { lead_id: string; message: string; company: string }): Promise<{ provider_id?: string }> {
    return {
      provider_id: undefined,
    }
  }
}
