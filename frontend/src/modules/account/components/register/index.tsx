"use client"

import { signup } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button, Heading, Hint, Input, Label, Text } from "@medusajs/ui"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const RegisterSubmitButton = ({
  "data-testid": dataTestId,
}: {
  "data-testid"?: string
}) => {
  const { pending } = useFormStatus()

  return (
    <Button
      className="w-full"
      type="submit"
      isLoading={pending}
      data-testid={dataTestId}
    >
      Create account
    </Button>
  )
}

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(signup, null)

  return (
    <div className="m-4 flex w-full max-w-[280px] flex-col items-center" data-testid="register-page">
      <div className="mb-4 flex flex-col items-center">
        <Heading>Create your account</Heading>
        <Text size="small" className="text-ui-fg-subtle text-center">
          Enter your details to get started.
        </Text>
      </div>

      <form className="flex w-full flex-col gap-y-6" action={formAction}>
        <div className="flex flex-col gap-y-1">
          <div className="flex flex-col gap-y-2">
            <Label size="small" weight="plus" htmlFor="first_name">
              First name
            </Label>
            <Input
              id="first_name"
              name="first_name"
              required
              autoComplete="given-name"
              data-testid="first-name-input"
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label size="small" weight="plus" htmlFor="last_name">
              Last name
            </Label>
            <Input
              id="last_name"
              name="last_name"
              required
              autoComplete="family-name"
              data-testid="last-name-input"
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label size="small" weight="plus" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              required
              type="email"
              autoComplete="email"
              data-testid="email-input"
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label size="small" weight="plus" htmlFor="phone">
              Phone
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              data-testid="phone-input"
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label size="small" weight="plus" htmlFor="password">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              required
              type="password"
              autoComplete="new-password"
              data-testid="password-input"
            />
          </div>
        </div>

        {message && (
          <div className="text-center" data-testid="register-error">
            <Hint className="inline-flex" variant="error">
              {message}
            </Hint>
          </div>
        )}

        <div className="flex w-full flex-col gap-y-3">
          <Text size="small" className="text-ui-fg-muted text-center">
            By creating an account, you agree to our{" "}
            <LocalizedClientLink
              href="/content/privacy-policy"
              className="text-ui-fg-interactive transition-fg hover:text-ui-fg-interactive-hover focus-visible:text-ui-fg-interactive-hover font-medium outline-none"
            >
              Privacy Policy
            </LocalizedClientLink>{" "}
            and{" "}
            <LocalizedClientLink
              href="/content/terms-of-use"
              className="text-ui-fg-interactive transition-fg hover:text-ui-fg-interactive-hover focus-visible:text-ui-fg-interactive-hover font-medium outline-none"
            >
              Terms of Use
            </LocalizedClientLink>
            .
          </Text>

          <RegisterSubmitButton data-testid="register-button" />

          <span className="text-ui-fg-muted txt-small text-center">
            Already have an account?{" "}
            <button
              onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
              className="text-ui-fg-interactive transition-fg hover:text-ui-fg-interactive-hover focus-visible:text-ui-fg-interactive-hover font-medium outline-none"
              type="button"
            >
              Sign in
            </button>
            .
          </span>
        </div>
      </form>
    </div>
  )
}

export default Register
