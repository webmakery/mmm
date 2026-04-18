import { ChatBubbleLeftRight, Lifebuoy, Sparkles } from "@medusajs/icons"
import { Badge, Button, Drawer, Heading, Input, Text, toast } from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { findHelpContextByPath } from "../lib/admin-help-context"
import { sdk } from "../lib/sdk"

declare global {
  interface Window {
    __webhostAdminHelpDrawerMounted?: boolean
  }
}

const OPEN_DRAWER_EVENT = "admin-help-drawer:open"

export const AdminHelpDrawer = () => {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [askQuery, setAskQuery] = useState("")
  const [answer, setAnswer] = useState("")
  const [answerSource, setAnswerSource] = useState<"ai" | "fallback" | "AI" | "Fallback" | null>(null)
  const [isAnswering, setIsAnswering] = useState(false)

  const context = useMemo(() => findHelpContextByPath(pathname), [pathname])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    if (window.__webhostAdminHelpDrawerMounted) {
      return
    }

    window.__webhostAdminHelpDrawerMounted = true
    setMounted(true)

    return () => {
      window.__webhostAdminHelpDrawerMounted = false
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "h") {
        event.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener("keydown", onKeyDown)

    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    const onOpenRequest = () => setOpen(true)

    window.addEventListener(OPEN_DRAWER_EVENT, onOpenRequest)

    return () => window.removeEventListener(OPEN_DRAWER_EVENT, onOpenRequest)
  }, [])

  if (!mounted) {
    return null
  }

  const onAsk = async (question: string) => {
    const trimmed = question.trim()

    if (!trimmed || isAnswering) {
      return
    }

    setIsAnswering(true)
    setAnswer("")
    setAnswerSource(null)

    try {
      const response = await sdk.client.fetch<{
        answer: string
        source: "ai" | "fallback" | "AI" | "Fallback"
        suggestions: string[]
      }>("/admin/help/ask", {
        method: "POST",
        body: {
          pathname,
          question: trimmed,
        },
      })

      setAnswer(response.answer)
      setAnswerSource(response.source)
    } catch {
      toast.error("Unable to load help answer")
    } finally {
      setIsAnswering(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <Button size="small" variant="secondary">
          <Lifebuoy />
          Help / Ask Webmakerr
        </Button>
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Help / Ask Webmakerr</Drawer.Title>
          <Drawer.Description>
            {context.title} guidance for {pathname}
          </Drawer.Description>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-y-4">
          <div className="space-y-2">
            <Heading level="h3">{context.title}</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              {context.intro}
            </Text>
          </div>

          <div className="space-y-2">
            <Heading level="h3">Suggested questions</Heading>
            <div className="space-y-2">
              {context.suggestedQuestions.map((prompt) => (
                <Button
                  key={prompt}
                  size="small"
                  variant="transparent"
                  className="justify-start"
                  onClick={() => {
                    setAskQuery(prompt)
                    onAsk(prompt)
                  }}
                  disabled={isAnswering}
                >
                  <ChatBubbleLeftRight />
                  {prompt}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Heading level="h3">Ask Webmakerr</Heading>
            <Input
              placeholder="Ask about this page..."
              value={askQuery}
              onChange={(event) => setAskQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  onAsk(askQuery)
                }
              }}
            />
            <Button size="small" variant="secondary" onClick={() => onAsk(askQuery)} isLoading={isAnswering}>
              <Sparkles />
              Ask
            </Button>
          </div>

          {answer ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Heading level="h3">Answer</Heading>
                <Badge size="2xsmall" color={answerSource?.toLowerCase() === "ai" ? "green" : "orange"}>
                  {answerSource?.toLowerCase() === "ai" ? "AI" : "Fallback"}
                </Badge>
              </div>
              <Text size="small" className="text-ui-fg-subtle">
                {answer}
              </Text>
            </div>
          ) : null}
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  )
}

export const openAdminHelpDrawer = () => {
  window.dispatchEvent(new Event(OPEN_DRAWER_EVENT))
}
