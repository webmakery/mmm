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
    <div className="flex-1 small:py-12" data-testid="account-page">
      <div className="content-container mx-auto flex h-full w-full max-w-7xl flex-col gap-y-6 px-0 small:px-6">
        <div className="border-b border-gray-200 px-6 py-4 small:px-0">
          <h1 className="text-xl-semi">Customer Dashboard</h1>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-6 small:grid-cols-[240px_1fr]">
          <div className="small:sticky small:top-6 small:self-start">
            {customer && <AccountNav customer={customer} />}
          </div>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
