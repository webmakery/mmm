import { listCategories } from "@lib/data/categories"
import { getStoreBranding } from "@lib/data/store-branding"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import type { ReactNode } from "react"

const supportLinks = [
  { label: "Orders and delivery", href: "/" },
  { label: "Returns and refunds", href: "/" },
  { label: "Payment and pricing", href: "/" },
]

const aboutLinks = [
  { label: "About us", href: "/" },
  { label: "Blog", href: "/" },
  { label: "Careers", href: "/" },
]

const helpLinks = [
  { label: "FAQs", href: "/" },
  { label: "Support center", href: "/" },
  { label: "Contact us", href: "/" },
]

const legalLinks = [
  { label: "Privacy Policy", href: "/" },
  { label: "Terms & Conditions", href: "/" },
]

export default async function Footer() {
  const [productCategories, branding] = await Promise.all([
    listCategories(),
    getStoreBranding(),
  ])

  const rootCategories =
    productCategories
      ?.filter((category) => !category.parent_category)
      .slice(0, 4)
      .map((category) => ({
        id: category.id,
        name: category.name,
        href: `/categories/${category.handle}`,
      })) ?? []

  return (
    <footer className="w-full border-t border-ui-border-base bg-black text-white">
      <div className="content-container w-full py-16 small:py-20">
        <div className="grid grid-cols-1 gap-12 small:grid-cols-2 large:grid-cols-5">
          <div className="flex flex-col gap-y-10 large:col-span-1">
            <LocalizedClientLink
              href="/"
              className="txt-compact-xlarge-plus text-white"
            >
              {branding.store_logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={branding.store_logo_url}
                  alt={branding.store_name}
                  className="h-8 w-auto"
                />
              ) : (
                <span className="uppercase">{branding.store_name}</span>
              )}
            </LocalizedClientLink>

            <div className="flex items-center gap-8 text-2xl-semi text-ui-fg-base">
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white/80"
              >
                in
              </a>
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white/80"
              >
                f
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white/80"
              >
                X
              </a>
            </div>
          </div>

          <div className="hidden large:flex flex-col gap-y-4">
            <span className="txt-small-plus text-white">Categories</span>
            <ul
              className="grid gap-y-3 text-ui-fg-muted txt-small"
              data-testid="footer-categories"
            >
              {rootCategories.map((category) => (
                <li key={category.id}>
                  <LocalizedClientLink
                    className="hover:text-white"
                    href={category.href}
                    data-testid="category-link"
                  >
                    {category.name}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>

          <DesktopSection title="Orders" links={supportLinks} />
          <DesktopSection title="About" links={aboutLinks} />
          <DesktopSection title="Need help?" links={helpLinks} />
        </div>

        <div className="mt-12 border-t border-ui-border-base pt-10 large:hidden">
          <MobileSection title="Categories" dataTestId="footer-categories">
            {rootCategories.map((category) => (
              <li key={category.id}>
                <LocalizedClientLink
                  className="hover:text-white"
                  href={category.href}
                  data-testid="category-link"
                >
                  {category.name}
                </LocalizedClientLink>
              </li>
            ))}
          </MobileSection>

          <MobileSection title="Orders">
            {supportLinks.map((link) => (
              <li key={link.label}>
                <LocalizedClientLink
                  className="hover:text-white"
                  href={link.href}
                >
                  {link.label}
                </LocalizedClientLink>
              </li>
            ))}
          </MobileSection>

          <MobileSection title="About">
            {aboutLinks.map((link) => (
              <li key={link.label}>
                <LocalizedClientLink
                  className="hover:text-white"
                  href={link.href}
                >
                  {link.label}
                </LocalizedClientLink>
              </li>
            ))}
          </MobileSection>

          <MobileSection title="Need help?">
            {helpLinks.map((link) => (
              <li key={link.label}>
                <LocalizedClientLink
                  className="hover:text-white"
                  href={link.href}
                >
                  {link.label}
                </LocalizedClientLink>
              </li>
            ))}
          </MobileSection>
        </div>

        <div className="mt-10 flex flex-col gap-y-3 border-t border-ui-border-base pt-8 txt-compact-small text-ui-fg-muted small:flex-row small:items-center small:justify-between">
          <span>
            © {new Date().getFullYear()} {branding.store_name}. All rights
            reserved.
          </span>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {legalLinks.map((link) => (
              <LocalizedClientLink
                key={link.label}
                href={link.href}
                className="hover:text-white"
              >
                {link.label}
              </LocalizedClientLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

type FooterLink = {
  label: string
  href: string
}

const DesktopSection = ({
  title,
  links,
}: {
  title: string
  links: FooterLink[]
}) => {
  return (
    <div className="hidden large:flex flex-col gap-y-4">
      <span className="txt-small-plus text-white">{title}</span>
      <ul className="grid gap-y-3 text-ui-fg-muted txt-small">
        {links.map((link) => (
          <li key={link.label}>
            <LocalizedClientLink className="hover:text-white" href={link.href}>
              {link.label}
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

const MobileSection = ({
  title,
  children,
  dataTestId,
}: {
  title: string
  children: ReactNode
  dataTestId?: string
}) => {
  return (
    <details className="group border-b border-ui-border-base py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-base-semi text-white">
        {title}
        <ChevronDown
          className="text-ui-fg-muted transition-transform group-open:rotate-180"
          size={16}
        />
      </summary>
      <ul
        className="mt-4 grid gap-y-3 pl-0 text-ui-fg-muted txt-small"
        data-testid={dataTestId}
      >
        {children}
      </ul>
    </details>
  )
}
