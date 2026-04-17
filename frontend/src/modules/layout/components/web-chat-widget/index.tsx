"use client"

import { Button, Heading, Text } from "@medusajs/ui"
import Input from "@modules/common/components/input"
import { FormEvent, useEffect, useMemo, useRef, useState } from "react"

type ChatMessage = {
  id: string
  direction: "inbound" | "outbound" | "system"
  message_type: "text" | "private_note" | "status" | "unsupported"
  text?: string | null
  created_at: string
}

type WebChatSession = {
  session_id: string
  conversation_id: string
  customer?: {
    name?: string | null
    email?: string | null
  }
}

const STORAGE_KEY = "web_chat_widget_session_v1"
const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

const formatTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email)

export default function WebChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"home" | "messages">("home")
  const [session, setSession] = useState<WebChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY)

    if (!stored) {
      return
    }

    try {
      const parsed = JSON.parse(stored)
      if (parsed?.session_id && parsed?.conversation_id) {
        setSession(parsed)
        setName(parsed?.customer?.name || "")
        setEmail(parsed?.customer?.email || "")
      }
    } catch {
      globalThis.localStorage?.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    if (!session) {
      return
    }

    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(session))
  }, [session])

  const refreshMessages = async (after?: string) => {
    if (!session) {
      return
    }

    setIsLoadingMessages(true)

    try {
      const params = new URLSearchParams({
        session_id: session.session_id,
      })

      if (after) {
        params.set("after", after)
      }

      const response = await fetch(
        `${MEDUSA_BACKEND_URL}/store/inbox/web-chat/messages?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error("Failed to fetch messages")
      }

      const data = await response.json()

      setMessages((previous) => {
        const merged = after
          ? [...previous, ...(data.messages || [])]
          : data.messages || []

        const deduped = new Map<string, ChatMessage>()
        for (const item of merged) {
          deduped.set(item.id, item)
        }

        return Array.from(deduped.values()).sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      })
    } catch {
      setError("We couldn't refresh chat messages. Reconnecting...")
    } finally {
      setIsLoadingMessages(false)
    }
  }

  useEffect(() => {
    if (!session || !isOpen || activeTab !== "messages") {
      return
    }

    refreshMessages()

    const interval = globalThis.setInterval(() => {
      const after = messages[messages.length - 1]?.created_at
      refreshMessages(after)
    }, 3000)

    return () => {
      globalThis.clearInterval(interval)
    }
  }, [session, isOpen, messages, activeTab])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoadingMessages])

  const hasValidProfile = useMemo(
    () => Boolean(name.trim() && validateEmail(email.trim())),
    [name, email]
  )

  const startLiveChat = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!hasValidProfile) {
      setError("Please provide a valid name and email to start live chat.")
      return
    }

    setIsBootstrapping(true)
    setError(null)

    try {
      const response = await fetch(
        `${MEDUSA_BACKEND_URL}/store/inbox/web-chat/session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session_id: session?.session_id,
            name,
            email,
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to start chat")
      }

      const data = await response.json()
      setSession(data.session)
    } catch {
      setError("Unable to start live chat right now. Please try again.")
    } finally {
      setIsBootstrapping(false)
    }
  }

  const onSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const text = message.trim()
    if (!text || !session || isSending) {
      return
    }

    setIsSending(true)
    setError(null)

    try {
      const response = await fetch(
        `${MEDUSA_BACKEND_URL}/store/inbox/web-chat/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session_id: session.session_id,
            text,
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const data = await response.json()
      setMessages((prev) => [...prev, data.message])
      setMessage("")
    } catch {
      setError("Message failed to send. Please retry.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white border border-ui-border-base rounded-2xl shadow-elevation-card-rest w-[22rem] max-w-[calc(100vw-2rem)] h-[38rem] max-h-[calc(100vh-6rem)] flex flex-col overflow-hidden">
          <div className="bg-ui-bg-interactive px-4 pt-4 pb-8 text-ui-fg-on-inverted">
            <div className="flex items-center justify-between">
              <div className="flex items-center -space-x-2">
                <div className="size-8 rounded-full border border-ui-border-base bg-ui-bg-base" />
                <div className="size-8 rounded-full border border-ui-border-base bg-ui-bg-base" />
                <div className="size-8 rounded-full border border-ui-border-base bg-ui-bg-base" />
              </div>
              <Button
                variant="transparent"
                size="small"
                className="text-ui-fg-on-inverted"
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
            </div>

            {activeTab === "home" ? (
              <div className="mt-12">
                <Heading
                  level="h3"
                  className="text-3xl text-ui-fg-on-inverted leading-9"
                >
                  Hi there 👋
                  <br />
                  How can we help?
                </Heading>
                <button
                  type="button"
                  className="mt-5 w-full rounded-xl bg-ui-bg-base p-4 text-left"
                  onClick={() => setActiveTab("messages")}
                >
                  <Text weight="plus" className="text-ui-fg-base">
                    Send us a message
                  </Text>
                  <Text size="small" className="text-ui-fg-subtle">
                    We typically reply in a few hours
                  </Text>
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex-1 overflow-hidden bg-ui-bg-subtle">
            {activeTab === "messages" ? (
              !session ? (
                <form
                  className="h-full p-4 flex flex-col gap-3 overflow-y-auto"
                  onSubmit={startLiveChat}
                >
                  <Text size="small" className="text-ui-fg-subtle">
                    Before we connect you with an agent, please share your
                    details.
                  </Text>
                  <Input
                    name="web_chat_name"
                    label="Name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                  <Input
                    name="web_chat_email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                  {error ? (
                    <Text size="small" className="text-ui-fg-error">
                      {error}
                    </Text>
                  ) : null}
                  <Button
                    type="submit"
                    isLoading={isBootstrapping}
                    disabled={!hasValidProfile || isBootstrapping}
                  >
                    Start live chat
                  </Button>
                </form>
              ) : (
                <>
                  <div className="h-full overflow-y-auto p-4 flex flex-col gap-2 pb-20">
                    {messages.length === 0 ? (
                      <Text size="small" className="text-ui-fg-subtle">
                        Start by sending your first message.
                      </Text>
                    ) : (
                      messages
                        .filter((item) => item.message_type !== "private_note")
                        .map((item) => {
                          const isGuest = item.direction === "inbound"

                          return (
                            <div
                              key={item.id}
                              className={`flex ${
                                isGuest ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[85%] rounded-md border px-3 py-2 ${
                                  isGuest
                                    ? "bg-ui-bg-base border-ui-border-strong"
                                    : "bg-ui-bg-subtle border-ui-border-base"
                                }`}
                              >
                                <Text size="small">{item.text || ""}</Text>
                                <Text
                                  size="xsmall"
                                  className="text-ui-fg-subtle mt-1"
                                >
                                  {formatTime(item.created_at)}
                                </Text>
                              </div>
                            </div>
                          )
                        })
                    )}
                    <div ref={bottomRef} />
                  </div>
                  <form
                    className="border-t bg-ui-bg-base p-3 flex flex-col gap-2"
                    onSubmit={onSendMessage}
                  >
                    <textarea
                      className="w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-small"
                      rows={2}
                      placeholder="Type your message"
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                    />
                    {error ? (
                      <Text size="small" className="text-ui-fg-error">
                        {error}
                      </Text>
                    ) : null}
                    <div className="flex items-center justify-between">
                      <Text size="xsmall" className="text-ui-fg-subtle">
                        {isLoadingMessages ? "Syncing..." : "Connected"}
                      </Text>
                      <Button
                        type="submit"
                        isLoading={isSending}
                        disabled={!message.trim() || isSending}
                      >
                        Send
                      </Button>
                    </div>
                  </form>
                </>
              )
            ) : null}
          </div>

          <div className="border-t bg-ui-bg-base grid grid-cols-2">
            <button
              type="button"
              className="py-3 flex flex-col items-center gap-1"
              onClick={() => setActiveTab("home")}
            >
              <span
                className={`size-5 rounded-full ${
                  activeTab === "home"
                    ? "bg-ui-fg-interactive"
                    : "bg-ui-fg-muted"
                }`}
              />
              <Text
                size="small"
                className={
                  activeTab === "home"
                    ? "text-ui-fg-interactive"
                    : "text-ui-fg-muted"
                }
              >
                Home
              </Text>
            </button>
            <button
              type="button"
              className="py-3 flex flex-col items-center gap-1"
              onClick={() => setActiveTab("messages")}
            >
              <span
                className={`size-5 rounded-md border ${
                  activeTab === "messages"
                    ? "border-ui-fg-interactive"
                    : "border-ui-fg-muted"
                }`}
              />
              <Text
                size="small"
                className={
                  activeTab === "messages"
                    ? "text-ui-fg-interactive"
                    : "text-ui-fg-muted"
                }
              >
                Messages
              </Text>
            </button>
          </div>
        </div>
      ) : null}

      <Button size="large" onClick={() => setIsOpen((value) => !value)}>
        {isOpen ? "Hide chat" : "Chat with us"}
      </Button>
    </div>
  )
}
