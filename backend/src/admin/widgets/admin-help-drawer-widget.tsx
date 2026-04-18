import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { AdminHelpDrawer } from "../components/admin-help-drawer"

const AdminHelpDrawerWidget = () => {
  return <AdminHelpDrawer />
}

export const config = defineWidgetConfig({
  zone: [
    "order.list.before",
    "order.details.before",
    "product.list.before",
    "product.details.before",
    "store.details.before",
  ],
})

export default AdminHelpDrawerWidget
