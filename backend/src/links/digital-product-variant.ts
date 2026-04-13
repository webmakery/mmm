import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import DigitalProductModule from "../modules/digital-product"

export default defineLink(
  {
    linkable: DigitalProductModule.linkable.digitalProduct,
    deleteCascade: true,
  },
  ProductModule.linkable.productVariant
)
