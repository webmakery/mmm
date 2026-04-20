"use client"

import { useActionState, useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import { signupWithEmailPassword } from "@lib/data/customer"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ErrorMessage from "@modules/checkout/components/error-message"
import { Button } from "@medusajs/ui"
import ReactCountryFlag from "react-country-flag"
import { trackJourneyEvent } from "@lib/analytics/customer-journey"

type Props = {
  storeName: string
  countryCode: string
  regions: HttpTypes.StoreRegion[]
}

const EmailSignup = ({ storeName, countryCode, regions }: Props) => {
  const [message, formAction] = useActionState(signupWithEmailPassword, null)
  const isSignupComplete = message === "signup_success"

  const regionOptions = useMemo(() => {
    return regions
      .flatMap((region) =>
        (region.countries ?? []).map((country) => ({
          value: country.iso_2 ?? "",
          label: country.display_name ?? (country.iso_2 ?? "").toUpperCase(),
        }))
      )
      .filter((country) => country.value)
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [regions])

  const currentRegion =
    regionOptions.find((option) => option.value === countryCode) ?? regionOptions[0]

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-black text-white flex items-center justify-center px-6 py-8">
      <div className="relative w-full max-w-md flex flex-col items-center gap-y-6">
        <div className="pointer-events-none absolute left-1/2 top-[180px] h-[420px] w-[540px] -translate-x-1/2 rounded-full bg-ui-bg-subtle/25 blur-3xl" />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://pub-ba24c3daf8c64c0289537005de0266f9.r2.dev/Assets/loading-icon.svg"
          alt={storeName}
          className="h-12 w-12"
        />

        <div className="text-center">
          <h1 className="text-3xl font-normal">Start your free trial</h1>
          <p className="text-base-regular text-ui-fg-subtle mt-2">
            3 days free, then 3 months for €1/month
          </p>
        </div>

        <div className="relative w-full border border-ui-border-base bg-ui-bg-base rounded-rounded p-5 small:p-6 flex flex-col gap-y-3 text-ui-fg-base">
          {isSignupComplete ? (
            <div className="w-full flex flex-col gap-y-3 text-center">
              <h2 className="text-2xl font-normal">Thank you for signing up</h2>
              <p className="text-base-regular text-ui-fg-subtle">
                Your account has been created successfully.
              </p>
              <p className="text-base-regular text-ui-fg-subtle">
                We appreciate your trust and look forward to supporting your journey.
              </p>
            </div>
          ) : (
            <>
              <form
                className="w-full flex flex-col gap-y-3"
                action={formAction}
                onSubmitCapture={() => {
                  void trackJourneyEvent("signup_started", {}, { debounceMs: 5000 })
                }}
              >
                <Input
                  label="Email address"
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
                <input type="hidden" name="country_code" value={countryCode} />

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

              <Button variant="secondary" className="w-full justify-start gap-x-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://pub-ba24c3daf8c64c0289537005de0266f9.r2.dev/Assets/google.svg"
                  alt="Google"
                  className="h-5 w-5"
                />
                Continue with Google
              </Button>
              <Button variant="secondary" className="w-full justify-start gap-x-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://pub-ba24c3daf8c64c0289537005de0266f9.r2.dev/Assets/facebook.svg"
                  alt="Facebook"
                  className="h-5 w-5"
                />
                Continue with Facebook
              </Button>

              <span className="text-center text-small-regular text-ui-fg-base mt-2">
                Already have a {storeName} account?{" "}
                <LocalizedClientLink href="/account" className="underline">
                  Log in
                </LocalizedClientLink>
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-x-2 text-small-regular text-ui-fg-base">
          {currentRegion?.value ? (
            <>
              {/* @ts-ignore */}
              <ReactCountryFlag
                svg
                style={{
                  width: "16px",
                  height: "16px",
                }}
                countryCode={currentRegion.value}
              />
              <span>{currentRegion.label}</span>
            </>
          ) : null}
        </div>

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
