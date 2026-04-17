"use client"

import { useActionState } from "react"
import { signupWithEmailPassword } from "@lib/data/customer"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ErrorMessage from "@modules/checkout/components/error-message"
import { Button } from "@medusajs/ui"

type Props = {
  storeName: string
  storeLogoUrl: string | null
}

const EmailSignup = ({ storeName, storeLogoUrl }: Props) => {
  const [message, formAction] = useActionState(signupWithEmailPassword, null)

  return (
    <div className="min-h-screen w-full bg-ui-bg-subtle flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-sm flex flex-col items-center gap-y-6">
        {storeLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={storeLogoUrl} alt={storeName} className="h-10 w-auto" />
        ) : (
          <h2 className="text-large-semi uppercase">{storeName}</h2>
        )}

        <div className="w-full border border-ui-border-base bg-ui-bg-base rounded-rounded p-6 flex flex-col gap-y-4">
          <div className="text-center">
            <h1 className="text-large-semi uppercase">Start for free</h1>
            <p className="text-base-regular text-ui-fg-base mt-2">
              Create your account to get started.
            </p>
          </div>

          <form className="w-full flex flex-col gap-y-2" action={formAction}>
            <Input
              label="Email"
              name="email"
              type="email"
              title="Enter a valid email address."
              autoComplete="email"
              required
              data-testid="signup-email-input"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              data-testid="signup-password-input"
            />

            <ErrorMessage error={message} data-testid="signup-error-message" />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-4"
              data-testid="signup-submit-button"
            >
              Continue with email
            </Button>
          </form>

          <span className="text-center text-ui-fg-base text-small-regular">
            Already have an account? <LocalizedClientLink href="/account" className="underline">Sign in</LocalizedClientLink>.
          </span>
        </div>

        <LocalizedClientLink
          href="/"
          className="text-small-regular text-ui-fg-subtle underline"
        >
          Back to home
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default EmailSignup
