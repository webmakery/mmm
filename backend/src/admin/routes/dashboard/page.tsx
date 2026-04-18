import { defineRouteConfig } from "@medusajs/admin-sdk"
import { User } from "@medusajs/icons"
import DashboardPageContent from "./page-content"

export const config = defineRouteConfig({
  label: "Dashboard",
  icon: User,
})

export default DashboardPageContent
