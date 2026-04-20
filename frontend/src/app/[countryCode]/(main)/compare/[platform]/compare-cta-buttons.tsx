"use client"

import { trackJourneyEvent } from "@lib/analytics/customer-journey"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@medusajs/ui"

export default function CompareCtaButtons({
  platform,
}: {
  platform: "shopify" | "woocommerce"
}) {
  const trackPrimaryCta = () => {
    void trackJourneyEvent("signup_started", {
      cta_location: "compare_page",
      cta_type: "primary",
      compare_platform: platform,
    })
  }

  const trackSecondaryCta = () => {
    void trackJourneyEvent("signup_started", {
      cta_location: "compare_page",
      cta_type: "secondary",
      compare_platform: platform,
    })
  }

  return (
    <div className="flex flex-col gap-3 small:flex-row">
      <Button className="w-full small:w-auto" variant="primary" asChild>
        <LocalizedClientLink href="/signup" onClick={trackPrimaryCta}>
          Start migration trial
        </LocalizedClientLink>
      </Button>
      <Button className="w-full small:w-auto" variant="secondary" asChild>
        <LocalizedClientLink href="/booking" onClick={trackSecondaryCta}>
          Talk to migration specialist
        </LocalizedClientLink>
      </Button>
    </div>
  )
}
