import { Metadata } from "next"

import ProfilePhone from "@modules/account//components/profile-phone"
import ProfileBillingAddress from "@modules/account/components/profile-billing-address"
import ProfileEmail from "@modules/account/components/profile-email"
import ProfileName from "@modules/account/components/profile-name"
import ProfilePassword from "@modules/account/components/profile-password"

import { notFound } from "next/navigation"
import { listRegions } from "@lib/data/regions"
import { retrieveCustomer } from "@lib/data/customer"
import { Container } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"

export const metadata: Metadata = {
  title: "Profile",
  description: "View and edit your Medusa Store profile.",
}

export default async function Profile() {
  const customer = await retrieveCustomer()
  const regions = await listRegions()

  if (!customer || !regions) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="profile-page-wrapper">
      <div className="mb-6 flex flex-col gap-y-2">
        <h1 className="text-2xl-semi">Profile</h1>
        <p className="text-base-regular text-ui-fg-subtle">
          View and update your profile information, including your name, email,
          and phone number. You can also update your billing address, or change
          your password.
        </p>
      </div>
      <Container className="flex flex-col gap-y-6 w-full p-5">
        <ProfileName customer={customer} />
        <Divider className="bg-ui-border-base" />
        <ProfileEmail customer={customer} />
        <Divider className="bg-ui-border-base" />
        <ProfilePhone customer={customer} />
        <Divider className="bg-ui-border-base" />
        {/* <ProfilePassword customer={customer} />
        <Divider /> */}
        <ProfileBillingAddress customer={customer} regions={regions} />
      </Container>
    </div>
  )
}
