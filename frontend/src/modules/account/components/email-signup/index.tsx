"use client"

import { useActionState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { signupWithEmailPassword } from "@lib/data/customer"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ErrorMessage from "@modules/checkout/components/error-message"
import { Button } from "@medusajs/ui"
import { ChevronDownMini } from "@medusajs/icons"
import NativeSelect from "@modules/common/components/native-select"

type Props = {
  storeName: string
  countryCode: string
  regions: HttpTypes.StoreRegion[]
}

const toFlag = (countryCode: string) =>
  countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397))

const EmailSignup = ({ storeName, countryCode, regions }: Props) => {
  const [message, formAction] = useActionState(signupWithEmailPassword, null)
  const router = useRouter()

  const regionOptions = useMemo(() => {
    return regions
      .flatMap((region) =>
        (region.countries ?? []).map((country) => ({
          value: country.iso_2 ?? "",
          label: country.display_name ?? (country.iso_2 ?? "").toUpperCase(),
          flag: toFlag(country.iso_2 ?? ""),
        }))
      )
      .filter((country) => country.value)
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [regions])

  const currentRegion =
    regionOptions.find((option) => option.value === countryCode) ?? regionOptions[0]

  return (
    <div className="min-h-screen w-full bg-black text-white flex items-center justify-center px-6 py-8">
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
        </div>

        <div className="relative w-full max-w-[220px]">
          <NativeSelect
            aria-label="Select region"
            className="w-full h-10 border-white bg-transparent text-ui-fg-base hover:bg-transparent"
            value={currentRegion?.value}
            onChange={(event) => {
              const nextCountry = event.target.value
              if (nextCountry && nextCountry !== countryCode) {
                router.push(`/${nextCountry}/signup`)
              }
            }}
          >
            {regionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {`${option.flag} ${option.label}`}
              </option>
            ))}
          </NativeSelect>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-x-2 text-small-regular text-ui-fg-base">
            <span aria-hidden>{currentRegion?.flag}</span>
            <span>{currentRegion?.label}</span>
            <ChevronDownMini className="opacity-0" />
          </div>
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
