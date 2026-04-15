import { Container } from "@medusajs/ui"
import { Metadata } from "next"
import { notFound } from "next/navigation"

import DigitalProductsList from "@modules/account/components/digital-products-list"
import { getCustomerDigitalProducts } from "@lib/data/digital-products"

export const metadata: Metadata = {
  title: "Digital Products",
  description: "View and download your digital products.",
}

export default async function DigitalProductsPage() {
  const digitalProducts = await getCustomerDigitalProducts().catch(() => null)

  if (!digitalProducts) {
    notFound()
  }

  return (
    <Container className="w-full" data-testid="digital-products-page-wrapper">
      <section className="mb-6 rounded-lg border border-ui-border-base p-6">
        <div className="flex flex-col gap-y-4">
          <h1 className="text-2xl-semi">Digital Products</h1>
          <p className="text-base-regular">
            View your purchased digital products and download your files.
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-ui-border-base p-6">
        <DigitalProductsList digitalProducts={digitalProducts} />
      </section>
    </Container>
  )
}
