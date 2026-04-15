"use client"

import { clx } from "@medusajs/ui"
import { ArrowRightOnRectangle, Photo } from "@medusajs/icons"
import { useParams, usePathname } from "next/navigation"

import ChevronDown from "@modules/common/icons/chevron-down"
import User from "@modules/common/icons/user"
import MapPin from "@modules/common/icons/map-pin"
import Package from "@modules/common/icons/package"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { signout } from "@lib/data/customer"

const AccountNav = ({
  customer,
}: {
  customer: HttpTypes.StoreCustomer | null
}) => {
  const route = usePathname()
  const { countryCode } = useParams() as { countryCode: string }

  const handleLogout = async () => {
    await signout(countryCode)
  }

  return (
    <div>
      <div className="small:hidden" data-testid="mobile-account-nav">
        {route !== `/${countryCode}/account` ? (
          <LocalizedClientLink
            href="/account"
            className="flex items-center gap-x-2 px-6 py-4 text-small-regular text-ui-fg-subtle"
            data-testid="account-main-link"
          >
            <>
              <ChevronDown className="transform rotate-90" />
              <span>Account</span>
            </>
          </LocalizedClientLink>
        ) : (
          <>
            <div className="border-b border-ui-border-base px-6 pb-4 pt-6">
              <p className="txt-compact-small-plus text-ui-fg-subtle mb-2 uppercase">
                Account
              </p>
              <div className="text-xl-semi">Hello {customer?.first_name}</div>
            </div>
            <div className="px-6 pb-6 pt-2">
              <p className="txt-compact-small-plus text-ui-fg-subtle mb-2 uppercase">
                Navigation
              </p>
            </div>
            <div className="text-base-regular border-y border-ui-border-base">
              <ul className="divide-y divide-ui-border-base">
                <li>
                  <LocalizedClientLink
                    href="/account/profile"
                    className="flex items-center justify-between px-6 py-4"
                    data-testid="profile-link"
                  >
                    <>
                      <div className="flex items-center gap-x-2">
                        <User size={20} />
                        <span>Profile</span>
                      </div>
                      <ChevronDown className="transform -rotate-90" />
                    </>
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account/addresses"
                    className="flex items-center justify-between px-6 py-4"
                    data-testid="addresses-link"
                  >
                    <>
                      <div className="flex items-center gap-x-2">
                        <MapPin size={20} />
                        <span>Addresses</span>
                      </div>
                      <ChevronDown className="transform -rotate-90" />
                    </>
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account/orders"
                    className="flex items-center justify-between px-6 py-4"
                    data-testid="orders-link"
                  >
                    <div className="flex items-center gap-x-2">
                      <Package size={20} />
                      <span>Orders</span>
                    </div>
                    <ChevronDown className="transform -rotate-90" />
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account/subscriptions"
                    className="flex items-center justify-between px-6 py-4"
                    data-testid="subscriptions-link"
                  >
                    <div className="flex items-center gap-x-2">
                      <Package size={20} />
                      <span>Subscriptions</span>
                    </div>
                    <ChevronDown className="transform -rotate-90" />
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account/digital-products"
                    className="flex items-center justify-between px-6 py-4"
                    data-testid="digital-products-link"
                  >
                    <div className="flex items-center gap-x-2">
                      <Photo size={20} />
                      <span>Digital Products</span>
                    </div>
                    <ChevronDown className="transform -rotate-90" />
                  </LocalizedClientLink>
                </li>
                <li>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-6 py-4"
                    onClick={handleLogout}
                    data-testid="logout-button"
                  >
                    <div className="flex items-center gap-x-2">
                      <ArrowRightOnRectangle size={20} />
                      <span>Log out</span>
                    </div>
                    <ChevronDown className="transform -rotate-90" />
                  </button>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
      <div className="hidden small:block" data-testid="account-nav">
        <div className="p-6">
          <div className="border-b border-ui-border-base pb-4">
            <h3 className="txt-compact-small-plus text-ui-fg-subtle uppercase">
              Account
            </h3>
          </div>
          <div className="pt-4">
            <p className="txt-compact-small-plus text-ui-fg-subtle mb-2 uppercase">
              Navigation
            </p>
            <div className="text-base-regular">
              <ul className="mb-0 flex flex-col items-start justify-start gap-y-1">
                <li className="w-full">
                  <AccountNavLink
                    href="/account"
                    route={route!}
                    data-testid="overview-link"
                  >
                    Overview
                  </AccountNavLink>
                </li>
                <li className="w-full">
                  <AccountNavLink
                    href="/account/profile"
                    route={route!}
                    data-testid="profile-link"
                  >
                    Profile
                  </AccountNavLink>
                </li>
                <li className="w-full">
                  <AccountNavLink
                    href="/account/addresses"
                    route={route!}
                    data-testid="addresses-link"
                  >
                    Addresses
                  </AccountNavLink>
                </li>
                <li className="w-full">
                  <AccountNavLink
                    href="/account/orders"
                    route={route!}
                    data-testid="orders-link"
                  >
                    Orders
                  </AccountNavLink>
                </li>
                <li className="w-full">
                  <AccountNavLink
                    href="/account/subscriptions"
                    route={route!}
                    data-testid="subscriptions-link"
                  >
                    Subscriptions
                  </AccountNavLink>
                </li>
                <li className="w-full">
                  <AccountNavLink
                    href="/account/digital-products"
                    route={route!}
                    data-testid="digital-products-link"
                  >
                    Digital Products
                  </AccountNavLink>
                </li>
                <li className="mt-3 w-full border-t border-ui-border-base pt-3">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="txt-compact-small-plus flex w-full items-center rounded-md px-3 py-2 text-ui-fg-subtle transition-colors hover:bg-ui-bg-base-hover hover:text-ui-fg-base"
                    data-testid="logout-button"
                  >
                    Log out
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

type AccountNavLinkProps = {
  href: string
  route: string
  children: React.ReactNode
  "data-testid"?: string
}

const AccountNavLink = ({
  href,
  route,
  children,
  "data-testid": dataTestId,
}: AccountNavLinkProps) => {
  const { countryCode }: { countryCode: string } = useParams()

  const active = route.split(countryCode)[1] === href
  return (
    <LocalizedClientLink
      href={href}
      className={clx(
        "txt-compact-small-plus flex w-full items-center rounded-md px-3 py-2 text-ui-fg-subtle transition-colors hover:bg-ui-bg-base-hover hover:text-ui-fg-base",
        {
          "bg-ui-bg-base-hover text-ui-fg-base": active,
        }
      )}
      data-testid={dataTestId}
    >
      {children}
    </LocalizedClientLink>
  )
}

export default AccountNav
