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

type InlinePart = {
  text: string
  bold: boolean
}

type Block =
  | { type: "heading"; level: 1 | 2; content: InlinePart[] }
  | { type: "paragraph"; content: InlinePart[] }
  | { type: "ordered-list"; items: InlinePart[][] }
  | { type: "unordered-list"; items: InlinePart[][] }

const parseInlineFormatting = (text: string): InlinePart[] => {
  const normalized = text.replace(/\*\*/g, "__")
  const parts = normalized.split(/(__[^_]+__)/g).filter(Boolean)

  return parts.map((part) => {
    const isBold = part.startsWith("__") && part.endsWith("__") && part.length > 4

    if (isBold) {
      return {
        text: part.slice(2, -2),
        bold: true,
      }
    }

    return {
      text: part,
      bold: false,
    }
  })
}

const toInlineContent = (text: string) => parseInlineFormatting(text.trim())

const parseAnswerToBlocks = (answer: string): Block[] => {
  const lines = answer.replace(/\r\n/g, "\n").split("\n")
  const blocks: Block[] = []
  let paragraphLines: string[] = []
  let orderedItems: InlinePart[][] = []
  let unorderedItems: InlinePart[][] = []

  const flushParagraph = () => {
    if (!paragraphLines.length) {
      return
    }

    blocks.push({
      type: "paragraph",
      content: toInlineContent(paragraphLines.join(" ").trim()),
    })
    paragraphLines = []
  }

  const flushOrderedList = () => {
    if (!orderedItems.length) {
      return
    }

    blocks.push({
      type: "ordered-list",
      items: orderedItems,
    })
    orderedItems = []
  }

  const flushUnorderedList = () => {
    if (!unorderedItems.length) {
      return
    }

    blocks.push({
      type: "unordered-list",
      items: unorderedItems,
    })
    unorderedItems = []
  }

  const flushAll = () => {
    flushParagraph()
    flushOrderedList()
    flushUnorderedList()
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (!line) {
      flushAll()
      continue
    }

    const headingMatch = line.match(/^(#{1,2})\s+(.+)$/)
    if (headingMatch) {
      flushAll()
      blocks.push({
        type: "heading",
        level: headingMatch[1].length === 1 ? 1 : 2,
        content: toInlineContent(headingMatch[2]),
      })
      continue
    }

    const orderedMatch = line.match(/^(\d+)[.)]\s+(.+)$/)
    if (orderedMatch) {
      flushParagraph()
      flushUnorderedList()
      orderedItems.push(toInlineContent(orderedMatch[2]))
      continue
    }

    const unorderedMatch = line.match(/^[-*]\s+(.+)$/)
    if (unorderedMatch) {
      flushParagraph()
      flushOrderedList()
      unorderedItems.push(toInlineContent(unorderedMatch[1]))
      continue
    }

    flushOrderedList()
    flushUnorderedList()
    paragraphLines.push(line)
  }

  flushAll()
  return blocks
}

const InlineText = ({ content }: { content: InlinePart[] }) => (
  <>
    {content.map((part, index) =>
      part.bold ? (
        <strong key={`${part.text}-${index}`} className="font-semibold text-ui-fg-base">
          {part.text}
        </strong>
      ) : (
        <span key={`${part.text}-${index}`}>{part.text}</span>
      )
    )}
  </>
)

export const AdminHelpDrawer = () => {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [askQuery, setAskQuery] = useState("")
  const [answer, setAnswer] = useState("")
  const [answerSource, setAnswerSource] = useState<"ai" | "fallback" | "AI" | "Fallback" | null>(null)
  const [isAnswering, setIsAnswering] = useState(false)

  const context = useMemo(() => findHelpContextByPath(pathname), [pathname])
  const answerBlocks = useMemo(() => parseAnswerToBlocks(answer), [answer])

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
      <Drawer.Content className="flex h-full flex-col">
        <Drawer.Header>
          <Drawer.Title>Help / Ask Webmakerr</Drawer.Title>
          <Drawer.Description>
            {context.title} guidance for {pathname}
          </Drawer.Description>
        </Drawer.Header>
        <Drawer.Body className="flex min-h-0 flex-1 flex-col gap-y-3">
          <div className="space-y-1">
            <Heading level="h3">{context.title}</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              {context.intro}
            </Text>
          </div>

          <div className="space-y-2">
            <Heading level="h3">Suggested questions</Heading>
            <div className="space-y-1.5">
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
            <div className="flex items-center gap-2">
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
          </div>

          {answer ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-ui-border-base bg-ui-bg-field">
              <div className="flex items-center justify-between gap-2 border-b border-ui-border-base px-4 py-3">
                <Text size="small" weight="plus" className="text-ui-fg-base">
                  Assistant response
                </Text>
                <Badge size="2xsmall" color={answerSource?.toLowerCase() === "ai" ? "green" : "orange"}>
                  {answerSource?.toLowerCase() === "ai" ? "AI powered" : "Fallback"}
                </Badge>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
                <div className="space-y-3 break-words">
                  {answerBlocks.map((block, blockIndex) => {
                    if (block.type === "heading") {
                      return (
                        <Text
                          key={`heading-${blockIndex}`}
                          size={block.level === 1 ? "small" : "xsmall"}
                          weight="plus"
                          className="text-ui-fg-base"
                        >
                          <InlineText content={block.content} />
                        </Text>
                      )
                    }

                    if (block.type === "ordered-list") {
                      return (
                        <ol key={`ordered-${blockIndex}`} className="list-decimal space-y-2 pl-5 text-ui-fg-subtle">
                          {block.items.map((item, itemIndex) => (
                            <li key={`ordered-${blockIndex}-item-${itemIndex}`}>
                              <Text as="span" size="small" className="text-ui-fg-subtle">
                                <InlineText content={item} />
                              </Text>
                            </li>
                          ))}
                        </ol>
                      )
                    }

                    if (block.type === "unordered-list") {
                      return (
                        <ul key={`unordered-${blockIndex}`} className="list-disc space-y-2 pl-5 text-ui-fg-subtle">
                          {block.items.map((item, itemIndex) => (
                            <li key={`unordered-${blockIndex}-item-${itemIndex}`}>
                              <Text as="span" size="small" className="text-ui-fg-subtle">
                                <InlineText content={item} />
                              </Text>
                            </li>
                          ))}
                        </ul>
                      )
                    }

                    return (
                      <Text key={`paragraph-${blockIndex}`} size="small" className="text-ui-fg-subtle">
                        <InlineText content={block.content} />
                      </Text>
                    )
                  })}
                </div>
              </div>
              <div className="border-t border-ui-border-base px-4 py-2">
                <Text size="xsmall" className="text-ui-fg-muted">
                  Powered by Webmakerr Technology
                </Text>
              </div>
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
