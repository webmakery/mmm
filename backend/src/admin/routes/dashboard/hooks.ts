import { useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/sdk"
import { DashboardResponse } from "./types"

export const useDashboardData = () => {
  return useQuery<DashboardResponse>({
    queryKey: ["admin-dashboard-overview"],
    queryFn: () => sdk.client.fetch("/admin/dashboard/overview"),
  })
}
