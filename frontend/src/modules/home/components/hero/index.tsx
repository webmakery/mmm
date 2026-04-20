import { Button, Heading } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = () => {
  return (
    <section className="relative h-[75vh] w-full overflow-hidden border-b border-ui-border-base bg-ui-bg-subtle">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source
          src="https://pub-ba24c3daf8c64c0289537005de0266f9.r2.dev/Assets/video/webmaker-hero.mp4"
          type="video/mp4"
        />
      </video>

      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-screen-2xl items-center px-6 py-10 small:px-10">
        <div className="flex max-w-xl flex-col gap-6">
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
            pricing.
          </p>

          <div className="flex flex-col gap-3 small:flex-row">
            <Button className="w-full small:w-auto" variant="primary" asChild>
              <LocalizedClientLink href="/signup">Start for free</LocalizedClientLink>
            </Button>
            <Button className="w-full small:w-auto" variant="secondary" asChild>
              <LocalizedClientLink href="/plans">View plans</LocalizedClientLink>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
