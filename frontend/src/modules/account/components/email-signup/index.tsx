"use client"

import { useActionState } from "react"
import { signupWithEmailPassword } from "@lib/data/customer"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ErrorMessage from "@modules/checkout/components/error-message"
import { Button } from "@medusajs/ui"
import { ChevronDownMini } from "@medusajs/icons"

type Props = {
  storeName: string
  storeLogoUrl: string | null
}

const EmailSignup = ({ storeName, storeLogoUrl }: Props) => {
  const [message, formAction] = useActionState(signupWithEmailPassword, null)

  return (
    <div className="min-h-screen w-full bg-black text-white flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-md flex flex-col items-center gap-y-6">
        {storeLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={storeLogoUrl} alt={storeName} className="h-14 w-auto" />
        ) : (
          <h2 className="text-large-semi uppercase">{storeName}</h2>
        )}

        <div className="text-center">
          <h1 className="text-3xl font-normal">Start your free trial</h1>
          <p className="text-base-regular text-ui-fg-subtle mt-2">
            3 days free, then 3 months for €1/month
          </p>
        </div>

        <div className="w-full border border-ui-border-base bg-ui-bg-base rounded-rounded p-5 small:p-6 flex flex-col gap-y-3 text-ui-fg-base">
          <form className="w-full flex flex-col gap-y-3" action={formAction}>
            <Input
              label="Email address"
              name="email"
              type="email"
              title="Enter a valid email address."
              autoComplete="email"
              required
              data-testid="signup-email-input"
            />

            <ErrorMessage error={message} data-testid="signup-error-message" />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              data-testid="signup-submit-button"
            >
              Continue with email
            </Button>
          </form>

          <div className="flex items-center gap-x-4 py-1">
            <span className="h-px flex-1 bg-ui-border-base" />
            <span className="text-small-regular text-ui-fg-subtle">or</span>
            <span className="h-px flex-1 bg-ui-border-base" />
          </div>

          <Button variant="secondary" className="w-full justify-start">
            Continue with Google
          </Button>
          <Button variant="secondary" className="w-full justify-start">
            Continue with Apple
          </Button>
          <Button variant="secondary" className="w-full justify-start">
            Continue with Facebook
          </Button>

          <span className="text-center text-small-regular text-ui-fg-base mt-2">
            Already have a {storeName} account?{" "}
            <LocalizedClientLink href="/account" className="underline">
              Log in
            </LocalizedClientLink>
          </span>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-x-2 rounded-rounded border border-ui-border-base px-5 py-2 text-small-regular text-ui-fg-base"
        >
          Germany
          <ChevronDownMini />
        </button>

        <div className="text-center text-small-regular text-ui-fg-subtle mt-12 space-y-2">
          <p className="text-ui-fg-base">Need Help?</p>
          <p>
            By continuing, you agree to the{" "}
            <LocalizedClientLink href="/content/terms-of-use" className="underline">
              Terms
            </LocalizedClientLink>{" "}
            and{" "}
            <LocalizedClientLink href="/content/privacy-policy" className="underline">
              Privacy Policy
            </LocalizedClientLink>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

export default EmailSignup
