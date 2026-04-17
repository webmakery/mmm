import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeModuleService = req.scope.resolve(Modules.STORE)
  const [store] = await storeModuleService.listStores()

  res.json({
    store_name: store?.name || "Store",
    store_logo_url: (store?.metadata?.logo_url as string | undefined) || null,
  })
}
