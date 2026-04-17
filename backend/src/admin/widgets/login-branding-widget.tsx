import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"

const LoginBrandingWidget = () => {
  useEffect(() => {
    const loginCard = document.querySelector(".max-w-\\[280px\\]")
    if (!loginCard) {
      return
    }

    const iconHost = loginCard.firstElementChild as HTMLElement | null
    if (iconHost) {
      iconHost.hidden = true
    }

    const heading = loginCard.querySelector("h1, h2, h3")
    if (heading) {
      heading.textContent = "Log in to Webmakerr®"
    }
  }, [])

  return null
}

export const config = defineWidgetConfig({
  zone: "login.before",
})

export default LoginBrandingWidget
