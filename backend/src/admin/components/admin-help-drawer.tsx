import { ChatBubbleLeftRight, Lifebuoy, Sparkles } from "@medusajs/icons"
import { Button, Drawer, Heading, Input, Tabs, Text } from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { findHelpTopicByPath, productHelpArticle } from "../lib/admin-help-drawer-content"

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

  const topic = useMemo(() => findHelpTopicByPath(pathname), [pathname])

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

  const askResponse = askQuery.trim()
    ? `Thanks — we captured your question about ${topic?.title || "this page"}. This Ask tab is config-driven and ready for AI response wiring.`
    : ""

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
            {topic ? `${topic.title} guidance for ${pathname}` : `Guidance for ${pathname}`}
          </Drawer.Description>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-y-4">
          <Tabs defaultValue="help">
            <Tabs.List>
              <Tabs.Trigger value="help">Help</Tabs.Trigger>
              <Tabs.Trigger value="ask">Ask</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="help" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Heading level="h3">Product guide</Heading>
                <Text size="small">{productHelpArticle.intro}</Text>
              </div>

              <div className="space-y-2">
                <Heading level="h3">What a product is</Heading>
                <Text size="small">{productHelpArticle.whatIsProduct}</Text>
              </div>

              <div className="space-y-2">
                <Heading level="h3">Why products matter</Heading>
                <ul className="list-disc space-y-2 pl-4">
                  {productHelpArticle.whyProductsMatter.map((item) => (
                    <li key={item}>
                      <Text size="small">{item}</Text>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <Heading level="h3">Step-by-step: add a product</Heading>
                <ol className="list-decimal space-y-2 pl-4">
                  {productHelpArticle.addProductSteps.map((step) => (
                    <li key={step}>
                      <Text size="small">{step}</Text>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-2">
                <Heading level="h3">Practical setup tips</Heading>
                <ul className="list-disc space-y-2 pl-4">
                  {productHelpArticle.practicalTips.map((tip) => (
                    <li key={tip.label}>
                      <Text size="small">
                        <span className="font-medium">{tip.label}:</span> {tip.guidance}
                      </Text>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <Heading level="h3">Troubleshooting</Heading>
                <ul className="list-disc space-y-2 pl-4">
                  {productHelpArticle.troubleshooting.map((item) => (
                    <li key={item}>
                      <Text size="small">{item}</Text>
                    </li>
                  ))}
                </ul>
              </div>

              {topic ? (
                <div className="space-y-2">
                  <Heading level="h3">Context tips for this page</Heading>
                  <ul className="list-disc space-y-2 pl-4">
                    {topic.helpItems.map((item) => (
                      <li key={item}>
                        <Text size="small">{item}</Text>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <Button size="small" variant="secondary" onClick={() => setOpen(true)}>
                <Sparkles />
                Guide me
              </Button>
            </Tabs.Content>

            <Tabs.Content value="ask" className="mt-4 space-y-3">
              <Input
                placeholder="Ask about this page..."
                value={askQuery}
                onChange={(event) => setAskQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                  }
                }}
              />

              {topic?.askPrompts?.length ? (
                <div className="space-y-2">
                  {topic.askPrompts.map((prompt) => (
                    <Button
                      key={prompt}
                      size="small"
                      variant="transparent"
                      className="justify-start"
                      onClick={() => setAskQuery(prompt)}
                    >
                      <ChatBubbleLeftRight />
                      {prompt}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <Text size="small" className="text-ui-fg-subtle">
                    Suggested prompts will appear here for this route.
                  </Text>
                  <Button size="small" variant="secondary">
                    <Sparkles />
                    Guide me
                  </Button>
                </div>
              )}

              {askResponse ? (
                <Text size="small" className="text-ui-fg-subtle">
                  {askResponse}
                </Text>
              ) : null}
            </Tabs.Content>
          </Tabs>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  )
}

export const openAdminHelpDrawer = () => {
  window.dispatchEvent(new Event(OPEN_DRAWER_EVENT))
}
