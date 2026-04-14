import React from "react"

import UnderlineLink from "@modules/common/components/interactive-link"
import { Container } from "@medusajs/ui"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <div className="flex-1 small:py-12 bg-ui-bg-subtle" data-testid="account-page">
      <div className="flex-1 content-container h-full max-w-6xl mx-auto flex flex-col gap-y-6">
        <div className="grid grid-cols-1 small:grid-cols-[260px_1fr] gap-4">
          <div>{customer && <AccountNav customer={customer} />}</div>
          <Container className="p-6 small:p-8">{children}</Container>
        </div>
        <Container className="flex flex-col small:flex-row items-end justify-between gap-8 p-6 small:p-8">
          <div>
            <h3 className="text-ui-fg-base text-large-semi mb-2">Got questions?</h3>
            <span className="txt-medium text-ui-fg-subtle">
              You can find frequently asked questions and answers on our
              customer service page.
            </span>
          </div>
          <div>
            <UnderlineLink href="/customer-service">
              Customer Service
            </UnderlineLink>
          </div>
        </Container>
      </div>
    </div>
  )
}

export default AccountLayout
