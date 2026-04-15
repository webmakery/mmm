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
      className="w-full"
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
    <div className="m-4 flex w-full max-w-[280px] flex-col items-center" data-testid="login-page">
      <div className="mb-4 flex flex-col items-center">
        <Heading>Welcome back</Heading>
        <Text size="small" className="text-ui-fg-subtle text-center">
          Sign in to continue to your account.
        </Text>
      </div>

      <form action={formAction} className="flex w-full flex-col gap-y-6">
        <div className="flex flex-col gap-y-1">
          <div className="flex flex-col gap-y-2">
            <Label size="small" weight="plus" htmlFor="email">
              Email
            </Label>
            <Input
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

        <div className="flex w-full flex-col gap-y-3">
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
