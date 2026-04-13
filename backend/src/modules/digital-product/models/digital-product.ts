import { model } from "@medusajs/framework/utils"
import DigitalProductMedia from "./digital-product-media"
import DigitalProductOrder from "./digital-product-order"

const DigitalProduct = model.define("digital_product", {
  id: model.id().primaryKey(),
  title: model.text(),
  medias: model.hasMany(() => DigitalProductMedia, {
    mappedBy: "digitalProduct",
  }),
  orders: model.manyToMany(() => DigitalProductOrder, {
    mappedBy: "products",
    pivotTable: "digitalproduct_digitalproductorders",
  }),
})

export default DigitalProduct
