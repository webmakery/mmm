import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { updateStoresWorkflow } from "@medusajs/medusa/core-flows"

export const PostAdminStoreBrandingSchema = z.object({
  store_name: z.string().min(1).optional(),
  store_logo_url: z.string().url().nullable().optional(),
})

type PostAdminStoreBranding = z.infer<typeof PostAdminStoreBrandingSchema>

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeModuleService = req.scope.resolve(Modules.STORE)
  const [store] = await storeModuleService.listStores()

  res.json({
    store_name: store?.name || "Store",
    store_logo_url: (store?.metadata?.logo_url as string | undefined) || null,
  })
}

export async function POST(
  req: MedusaRequest<PostAdminStoreBranding>,
  res: MedusaResponse
) {
  const storeModuleService = req.scope.resolve(Modules.STORE)
  const [store] = await storeModuleService.listStores()

  if (!store?.id) {
    return res.status(404).json({ message: "Store not found" })
  }

  const { result } = await updateStoresWorkflow(req.scope).run({
    input: {
      selector: { id: store.id },
      update: {
        ...(req.validatedBody.store_name
          ? { name: req.validatedBody.store_name }
          : {}),
        metadata: {
          ...(store.metadata || {}),
          logo_url:
            req.validatedBody.store_logo_url === undefined
              ? ((store.metadata?.logo_url as string | undefined) ?? null)
              : req.validatedBody.store_logo_url,
        },
      },
    },
  })

  const updatedStore = result?.[0]

  res.json({
    store_name: updatedStore?.name || "Store",
    store_logo_url: (updatedStore?.metadata?.logo_url as string | undefined) || null,
  })
}
