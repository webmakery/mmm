import { CrmSyncPayload, CustomerJourneyCrmAdapter } from "./types"

export class StubCustomerJourneyCrmAdapter implements CustomerJourneyCrmAdapter {
  async syncCustomerSummary(_payload: CrmSyncPayload) {
    return {
      status: "skipped" as const,
      message: "CRM sync skipped (missing CRM credentials or adapter implementation)",
    }
  }
}
