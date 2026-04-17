"use client"

import { useState } from "react"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"

type LoginTemplateProps = {
  storeName: string
  storeLogoUrl: string | null
}

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginTemplate = ({ storeName, storeLogoUrl }: LoginTemplateProps) => {
  const [currentView, setCurrentView] = useState("sign-in")

  return (
    <div className="w-full flex justify-start px-8 py-8">
      <div className="max-w-sm w-full flex flex-col items-center">
        <div className="mb-8">
          {storeLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={storeLogoUrl} alt={storeName} className="h-10 w-auto" />
          ) : (
            <h2 className="text-large-semi uppercase">{storeName}</h2>
          )}
        </div>
        {currentView === "sign-in" ? (
          <Login setCurrentView={setCurrentView} />
        ) : (
          <Register setCurrentView={setCurrentView} storeName={storeName} />
        )}
      </div>
    </div>
  )
}

export default LoginTemplate
