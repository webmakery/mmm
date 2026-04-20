"use client"

import { trackJourneyEvent } from "@lib/analytics/customer-journey"
import { ReactNode } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function TrackedCtaLink({
  href,
  ctaLocation,
  ctaType,
  children,
  className,
}: {
  href: string
  ctaLocation: string
  ctaType: "primary" | "secondary" | "tertiary"
  children: ReactNode
  className?: string
}) {
  const onClick = () => {
    void trackJourneyEvent("signup_started", {
      cta_location: ctaLocation,
      cta_type: ctaType,
      cta_target: href,
    })
  }

  return (
    <LocalizedClientLink href={href} onClick={onClick} className={className}>
      {children}
    </LocalizedClientLink>
  )
}
