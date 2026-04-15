"use client"

import { login } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import { Button, Heading, Hint, Input, Label, Text } from "@medusajs/ui"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const LoginSubmitButton = ({
  "data-testid": dataTestId,
}: {
  "data-testid"?: string
}) => {
  const { pending } = useFormStatus()

  return (
    <Button
      className="h-11 w-full rounded-md text-sm font-medium"
      type="submit"
      isLoading={pending}
      data-testid={dataTestId}
    >
      Sign in
    </Button>
  )
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)

  return (
    <div
      className="bg-ui-bg-base border-ui-border-base shadow-elevation-card flex w-full flex-col rounded-xl border p-6 small:p-8"
      data-testid="login-page"
    >
      <div className="mb-6 flex flex-col gap-y-2 text-center">
        <Heading level="h1" className="text-xl leading-8">
          Welcome back
        </Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Sign in to continue to your account.
        </Text>
      </div>

      <form action={formAction} className="flex w-full flex-col gap-y-5">
        <div className="flex flex-col gap-y-4">
          <div className="flex flex-col gap-y-2">
            <Label size="small" weight="plus" htmlFor="email">
              Email
            </Label>
            <Input
              className="h-11"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              data-testid="email-input"
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label size="small" weight="plus" htmlFor="password">
              Password
            </Label>
            <Input
              className="h-11"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              data-testid="password-input"
            />
          </div>
        </div>

        {message && (
          <div className="text-center" data-testid="login-error-message">
            <Hint className="inline-flex" variant="error">
              {message}
            </Hint>
          </div>
        )}

        <div className="mt-1 flex w-full flex-col gap-y-3">
          <LoginSubmitButton data-testid="sign-in-button" />
          <span className="text-ui-fg-muted txt-small text-center">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
              className="text-ui-fg-interactive transition-fg hover:text-ui-fg-interactive-hover focus-visible:text-ui-fg-interactive-hover font-medium outline-none"
              data-testid="register-button"
              type="button"
            >
              Create one
            </button>
            .
          </span>
        </div>
      </form>
    </div>
  )
}

export default Login
