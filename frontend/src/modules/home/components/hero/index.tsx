import { Heading } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import EmailSignup from "@modules/account/components/email-signup"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type HeroProps = {
  storeName: string
  countryCode: string
  regions: HttpTypes.StoreRegion[]
}

const Hero = ({ storeName, countryCode, regions }: HeroProps) => {
  return (
    <section className="relative w-full overflow-hidden border-b border-ui-border-base bg-gradient-to-br from-[#19060f] via-[#2b0913] via-40% to-[#081a38]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(120,23,52,0.35),transparent_48%),radial-gradient(circle_at_bottom_right,rgba(15,45,95,0.3),transparent_52%)]" />

      <div className="relative z-10 mx-auto grid w-full max-w-screen-2xl gap-10 px-6 py-12 small:px-10 small:py-16 medium:grid-cols-[minmax(0,1fr)_420px] medium:items-center">
        <div className="flex max-w-2xl flex-col gap-6">
          <Heading
            level="h1"
            className="text-3xl font-normal leading-10 text-white small:text-5xl small:leading-[1.1]"
          >
            Start and grow your online store without platform lock-in
          </Heading>
          <Heading
            level="h2"
            className="text-large-regular text-white/90 small:text-xl"
          >
            Built for new merchants, growing brands, and teams migrating from
            Shopify or WooCommerce.
          </Heading>
          <p className="text-small-regular text-white/90">
            Launch in days with support, flexible storefronts, and predictable
            pricing. Switching from Shopify or WooCommerce?{" "}
            <LocalizedClientLink
              href="/compare/shopify"
              className="underline underline-offset-4"
            >
              Compare migration options
            </LocalizedClientLink>
            .
          </p>
        </div>

        <div className="w-full">
          <EmailSignup
            embedded
            storeName={storeName}
            countryCode={countryCode}
            regions={regions}
          />
        </div>
      </div>
    </section>
  )
}

export default Hero
