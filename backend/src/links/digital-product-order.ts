import { defineLink } from "@medusajs/framework/utils"
import OrderModule from "@medusajs/medusa/order"
import DigitalProductModule from "../modules/digital-product"

export default defineLink(
  {
    linkable: DigitalProductModule.linkable.digitalProductOrder,
    deleteCascade: true,
  },
  OrderModule.linkable.order
)
