import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight, PaperPlane } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Input, StatusBadge, Text, Textarea } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { RiInstagramFill, RiMessengerFill, RiTelegram2Fill, RiWhatsappFill } from "react-icons/ri"
import { sdk } from "../../lib/sdk"

type Channel = "whatsapp" | "messenger" | "instagram" | "telegram"

type Conversation = {
  id: string
  channel: Channel
  customer_identifier: string
  customer_phone: string
  customer_name?: string | null
  customer_handle?: string | null
  external_user_id?: string | null
  last_message_preview?: string | null
  last_message_at?: string | null
  unread_count: number
  status: "open" | "closed" | "archived"
}

type Message = {
  id: string
  channel: Channel
  direction: "inbound" | "outbound" | "system"
  message_type: "text" | "status" | "unsupported" | "private_note"
  text?: string | null
  content?: string | null
  status: "received" | "sent" | "delivered" | "read" | "failed" | "pending"
  external_message_id?: string | null
  sent_at?: string | null
  received_at?: string | null
  created_at: string
  participant?: {
    id: string
    role: "customer" | "agent" | "system"
    display_name?: string | null
    external_id?: string | null
  } | null
}

const channelOptions: Array<{ label: string; value: "all" | Channel }> = [
  { label: "All", value: "all" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Messenger", value: "messenger" },
  { label: "Instagram", value: "instagram" },
  { label: "Telegram", value: "telegram" },
]

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return ""
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

const formatMessageTime = (message: Message) => {
  const value = message.received_at || message.sent_at || message.created_at
  return formatDateTime(value)
}

const channelMeta: Record<
  Channel,
  { label: string; icon: typeof RiWhatsappFill; className: string }
> = {
  whatsapp: {
    label: "WhatsApp",
    icon: RiWhatsappFill,
    className: "text-[#25D366]",
  },
  messenger: {
    label: "Messenger",
    icon: RiMessengerFill,
    className: "text-[#0084FF]",
  },
  instagram: {
    label: "Instagram",
    icon: RiInstagramFill,
    className: "text-[#E4405F]",
  },
  telegram: {
    label: "Telegram",
    icon: RiTelegram2Fill,
    className: "text-ui-fg-base",
  },
}

const getStatusColor = (status: Message["status"]) => {
  switch (status) {
    case "failed":
      return "red"
    case "read":
      return "green"
    case "delivered":
      return "blue"
    default:
      return "grey"
  }
}

const InboxPage = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [channel, setChannel] = useState<"all" | Channel>("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [composer, setComposer] = useState("")
  const [composerMode, setComposerMode] = useState<"message" | "private_note">("message")

  const { data: listData, isLoading: isLoadingConversations } = useQuery<{
    conversations: Conversation[]
    count: number
  }>({
    queryKey: ["inbox-conversations", search, channel],
    queryFn: () =>
      sdk.client.fetch("/admin/inbox/conversations", {
        query: {
          q: search || undefined,
          channel: channel === "all" ? undefined : channel,
          limit: 50,
          offset: 0,
        },
      }),
    refetchInterval: 5000,
  })

  const conversations = listData?.conversations || []

  useEffect(() => {
    if (!selectedId && conversations.length > 0) {
      setSelectedId(conversations[0].id)
    }
  }, [conversations, selectedId])

  useEffect(() => {
    setComposerMode("message")
    setComposer("")
  }, [selectedId])

  const { data: conversationData, isLoading: isLoadingConversation } = useQuery<{
    conversation: Conversation & { messages: Message[] }
  }>({
    queryKey: ["inbox-conversation", selectedId],
    queryFn: () => sdk.client.fetch(`/admin/inbox/conversations/${selectedId}`),
    enabled: Boolean(selectedId),
    refetchInterval: 5000,
  })

  useEffect(() => {
    if (!selectedId) {
      return
    }

    const selectedConversation = conversations.find((conversation) => conversation.id === selectedId)

    if (selectedConversation?.unread_count) {
      sdk.client
        .fetch(`/admin/inbox/conversations/${selectedId}/read`, {
          method: "POST",
        })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["inbox-conversations"] })
        })
    }
  }, [conversations, queryClient, selectedId])

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!selectedId) {
        return
      }

      await sdk.client.fetch(`/admin/inbox/conversations/${selectedId}/messages`, {
        method: "POST",
        body: {
          text,
          type: composerMode,
        },
      })
    },
    onSuccess: () => {
      setComposer("")
      queryClient.invalidateQueries({ queryKey: ["inbox-conversations"] })
      queryClient.invalidateQueries({ queryKey: ["inbox-conversation", selectedId] })
    },
  })

  const selectedConversation = conversationData?.conversation
  const messages = useMemo(() => selectedConversation?.messages || [], [selectedConversation])

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const text = composer.trim()

    if (!text || !selectedId || sendMutation.isPending) {
      return
    }

    sendMutation.mutate(text)
  }

  const getConversationTitle = (conversation: Conversation) =>
    conversation.customer_name ||
    conversation.customer_handle ||
    conversation.customer_phone ||
    conversation.customer_identifier ||
    "Customer"

  const getConversationSubtitle = (conversation: Conversation) => {
    const fallbackIdentity =
      conversation.customer_handle || conversation.customer_phone || conversation.customer_identifier || conversation.external_user_id

    if (conversation.customer_name && fallbackIdentity && fallbackIdentity !== conversation.customer_name) {
      return fallbackIdentity
    }

    if (!conversation.customer_name && !conversation.customer_handle && !conversation.customer_phone) {
      return conversation.external_user_id || conversation.customer_identifier
    }

    return null
  }

  return (
    <Container className="h-[calc(100vh-9rem)] min-h-[640px] p-0">
      <div className="grid h-full min-h-0 grid-cols-1 divide-y md:grid-cols-[320px_1fr] md:divide-x md:divide-y-0">
        <div className="flex min-h-0 flex-col">
          <div className="flex items-center justify-between px-6 py-4">
            <Heading>Inbox</Heading>
          </div>
          <div className="px-6 pb-4">
            <Input
              placeholder="Search by name, handle, phone, or message"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex gap-2 px-6 pb-4">
            {channelOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={channel === option.value ? "secondary" : "transparent"}
                size="small"
                onClick={() => setChannel(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {isLoadingConversations ? (
              <Text size="small" className="px-6 py-4 text-ui-fg-subtle">
                Loading conversations...
              </Text>
            ) : conversations.length === 0 ? (
              <Text size="small" className="px-6 py-4 text-ui-fg-subtle">
                No conversations yet.
              </Text>
            ) : (
              conversations.map((conversation) => {
                const isSelected = selectedId === conversation.id

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    className="flex w-full flex-col gap-1 border-t px-6 py-2.5 text-left"
                    onClick={() => setSelectedId(conversation.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <Text weight={isSelected ? "plus" : "regular"}>{getConversationTitle(conversation)}</Text>
                        <Badge size="2xsmall" className="inline-flex items-center gap-1">
                          {(() => {
                            const Icon = channelMeta[conversation.channel].icon

                            return (
                              <>
                                <Icon className={`h-3 w-3 ${channelMeta[conversation.channel].className}`} />
                                <span>{channelMeta[conversation.channel].label}</span>
                              </>
                            )
                          })()}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <Text size="small" className="truncate text-ui-fg-subtle">
                        {conversation.last_message_preview || "No messages yet"}
                      </Text>
                      {conversation.unread_count > 0 ? <Badge size="2xsmall">{conversation.unread_count}</Badge> : null}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-col">
          {!selectedConversation ? (
            <div className="flex flex-1 min-h-0 items-center justify-center px-6">
              <Text className="text-ui-fg-subtle">{isLoadingConversation ? "Loading..." : "Select a conversation"}</Text>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="border-b px-6 py-4">
                <div className="flex items-center gap-2">
                  <Heading level="h2">{getConversationTitle(selectedConversation)}</Heading>
                  <Badge size="2xsmall" className="inline-flex items-center gap-1">
                    {(() => {
                      const Icon = channelMeta[selectedConversation.channel].icon

                      return (
                        <>
                          <Icon className={`h-3 w-3 ${channelMeta[selectedConversation.channel].className}`} />
                          <span>{channelMeta[selectedConversation.channel].label}</span>
                        </>
                      )
                    })()}
                  </Badge>
                </div>
                {getConversationSubtitle(selectedConversation) ? (
                  <Text size="small" className="text-ui-fg-subtle">
                    {getConversationSubtitle(selectedConversation)}
                  </Text>
                ) : null}
              </div>

              <div className="flex flex-1 min-h-0 flex-col gap-2 overflow-y-auto px-4 py-3">
                {messages.length === 0 ? (
                  <Text size="small" className="text-ui-fg-subtle">
                    No messages in this conversation yet.
                  </Text>
                ) : (
                  messages.map((message) => {
                    const isOutbound = message.direction === "outbound"
                    const isPrivateNote = message.message_type === "private_note"
                    const noteAuthor = message.participant?.display_name || message.participant?.external_id || "Admin"

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isPrivateNote ? "justify-center" : isOutbound ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`rounded-md border px-3 py-2 ${
                            isPrivateNote
                              ? "w-full max-w-[86%] border-ui-border-base bg-ui-bg-subtle"
                              : isOutbound
                                ? "max-w-[78%] border-ui-border-base bg-ui-bg-base"
                                : "max-w-[78%] border-ui-border-strong bg-ui-bg-field"
                          }`}
                        >
                          <Text size="small">{message.text || message.content || ""}</Text>
                          <div className="mt-1 flex items-center gap-1.5">
                            {isPrivateNote ? <Badge size="2xsmall">Private note</Badge> : null}
                            {isPrivateNote ? (
                              <Text size="xsmall" className="text-ui-fg-subtle">
                                {noteAuthor}
                              </Text>
                            ) : null}
                            <Text size="xsmall" className="text-ui-fg-subtle">
                              {formatMessageTime(message)}
                            </Text>
                            {isOutbound && !isPrivateNote ? (
                              <StatusBadge color={getStatusColor(message.status)}>{message.status}</StatusBadge>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <form onSubmit={onSubmit} className="border-t p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="small"
                      variant={composerMode === "message" ? "secondary" : "transparent"}
                      onClick={() => setComposerMode("message")}
                    >
                      Reply
                    </Button>
                    <Button
                      type="button"
                      size="small"
                      variant={composerMode === "private_note" ? "secondary" : "transparent"}
                      onClick={() => setComposerMode("private_note")}
                    >
                      Add note
                    </Button>
                  </div>
                  <Textarea
                    rows={2}
                    placeholder={composerMode === "private_note" ? "Type an internal note" : "Type your message"}
                    value={composer}
                    onChange={(event) => setComposer(event.target.value)}
                    disabled={sendMutation.isPending}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" isLoading={sendMutation.isPending} disabled={!composer.trim() || sendMutation.isPending}>
                      <PaperPlane />
                      {composerMode === "private_note" ? "Save note" : "Send"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Inbox",
  icon: ChatBubbleLeftRight,
})

export default InboxPage
