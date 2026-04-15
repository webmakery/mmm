import React from "react"

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
    <div className="flex-1 bg-ui-bg-subtle py-6 small:py-10" data-testid="account-page">
      <div className="content-container mx-auto flex h-full w-full max-w-7xl flex-col gap-y-6 px-0 small:px-6">
        <div className="border-b border-ui-border-base px-6 pb-4 small:px-0 small:pb-6">
          <p className="txt-compact-small-plus text-ui-fg-subtle mb-2 uppercase">
            Account
          </p>
          <h1 className="text-xl-semi">Customer Dashboard</h1>
        </div>

        <div className="grid flex-1 grid-cols-1 border-y border-ui-border-base bg-ui-bg-base small:grid-cols-[280px_1fr] small:rounded-lg small:border">
          <div className="small:sticky small:top-6 small:self-start small:h-fit small:border-r small:border-ui-border-base">
            {customer && <AccountNav customer={customer} />}
          </div>
          <div className="min-w-0 p-6 small:p-8">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
