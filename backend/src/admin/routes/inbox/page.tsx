import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight, PaperClip, PaperPlane } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Input, StatusBadge, Text, Textarea } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FormEvent, useEffect, useMemo, useState } from "react"
import {
  RiChat1Fill,
  RiEmotionHappyLine,
  RiInstagramFill,
  RiMessengerFill,
  RiTelegram2Fill,
  RiWhatsappFill,
} from "react-icons/ri"
import { sdk } from "../../lib/sdk"

type Channel = "whatsapp" | "messenger" | "instagram" | "telegram" | "web_chat"

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
  updated_at?: string
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
  { label: "Web Chat", value: "web_chat" },
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

const formatRelativeTime = (value?: string | null) => {
  if (!value) {
    return ""
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const now = Date.now()
  const diffMs = date.getTime() - now
  const absMs = Math.abs(diffMs)
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })

  if (absMs < 60_000) {
    return rtf.format(Math.round(diffMs / 1_000), "second")
  }

  if (absMs < 3_600_000) {
    return rtf.format(Math.round(diffMs / 60_000), "minute")
  }

  if (absMs < 86_400_000) {
    return rtf.format(Math.round(diffMs / 3_600_000), "hour")
  }

  return rtf.format(Math.round(diffMs / 86_400_000), "day")
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
  web_chat: {
    label: "Web Chat",
    icon: RiChat1Fill,
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

const getUrgencyState = (conversation: Conversation) => {
  if (conversation.status === "archived") {
    return { label: "Snoozed", color: "grey" as const }
  }

  if (conversation.unread_count > 0) {
    return { label: "Needs reply", color: "red" as const }
  }

  return { label: "Waiting", color: "orange" as const }
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

  const getSenderName = (message: Message) => {
    if (message.message_type === "private_note") {
      return message.participant?.display_name || message.participant?.external_id || "Admin note"
    }

    if (message.direction === "outbound") {
      return "You"
    }

    return message.participant?.display_name || message.participant?.external_id || "Customer"
  }

  return (
    <Container className="h-[calc(100vh-9rem)] min-h-[640px] p-0">
      <div className="grid h-full min-h-0 grid-cols-1 divide-y lg:grid-cols-[320px_1fr_280px] lg:divide-x lg:divide-y-0">
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
          <div className="flex gap-2 overflow-x-auto px-6 pb-4">
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
                const urgency = getUrgencyState(conversation)
                const lastActivity = conversation.last_message_at || conversation.updated_at

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    className={`flex w-full flex-col gap-1 border-t px-6 py-2.5 text-left transition-colors ${
                      isSelected ? "bg-ui-bg-component-hover" : "hover:bg-ui-bg-subtle"
                    }`}
                    onClick={() => setSelectedId(conversation.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <Text weight={conversation.unread_count > 0 || isSelected ? "plus" : "regular"} className="truncate">
                          {getConversationTitle(conversation)}
                        </Text>
                      </div>
                      <Text size="xsmall" className="shrink-0 text-ui-fg-subtle">
                        {formatRelativeTime(lastActivity)}
                      </Text>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        {(() => {
                          const Icon = channelMeta[conversation.channel].icon

                          return <Icon className={`h-3.5 w-3.5 shrink-0 ${channelMeta[conversation.channel].className}`} />
                        })()}
                        <Text size="small" className={`truncate ${conversation.unread_count > 0 ? "font-medium" : "text-ui-fg-subtle"}`}>
                          {conversation.last_message_preview || "No messages yet"}
                        </Text>
                      </div>
                      {conversation.unread_count > 0 ? <Badge size="2xsmall">{conversation.unread_count}</Badge> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge color={urgency.color}>{urgency.label}</StatusBadge>
                      <Text size="xsmall" className="text-ui-fg-subtle">
                        {channelMeta[conversation.channel].label}
                      </Text>
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
              <Text className="text-ui-fg-subtle">
                {isLoadingConversation
                  ? "Loading..."
                  : "No messages yet. Start a conversation or select another lead."}
              </Text>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="border-b px-6 py-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Heading level="h2" className="truncate">
                        {getConversationTitle(selectedConversation)}
                      </Heading>
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-ui-tag-green-icon" aria-label="Active" />
                    </div>
                    {getConversationSubtitle(selectedConversation) ? (
                      <Text size="small" className="truncate text-ui-fg-subtle">
                        {getConversationSubtitle(selectedConversation)}
                      </Text>
                    ) : null}
                  </div>
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
                <Text size="xsmall" className="mt-1 text-ui-fg-subtle">
                  Last active {formatRelativeTime(selectedConversation.last_message_at || selectedConversation.updated_at)}
                </Text>
              </div>

              <div className="flex flex-1 min-h-0 flex-col gap-2 overflow-y-auto px-4 py-3">
                {messages.length === 0 ? (
                  <Text size="small" className="text-ui-fg-subtle">
                    No messages yet. Start a conversation or select another lead.
                  </Text>
                ) : (
                  messages.map((message) => {
                    const isOutbound = message.direction === "outbound"
                    const isPrivateNote = message.message_type === "private_note"

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isPrivateNote ? "justify-center" : isOutbound ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`rounded-lg border px-3 py-2 transition-colors ${
                            isPrivateNote
                              ? "w-full max-w-[86%] border-ui-border-base bg-ui-bg-subtle"
                              : isOutbound
                                ? "max-w-[78%] border-ui-border-base bg-ui-bg-base"
                                : "max-w-[78%] border-ui-border-strong bg-ui-bg-field"
                          }`}
                        >
                          <Text size="xsmall" className="mb-1 text-ui-fg-subtle">
                            {getSenderName(message)}
                          </Text>
                          <Text size="small">{message.text || message.content || ""}</Text>
                          <div className="mt-1 flex items-center gap-1.5">
                            {isPrivateNote ? <Badge size="2xsmall">Private note</Badge> : null}
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

              <form onSubmit={onSubmit} className="sticky bottom-0 border-t bg-ui-bg-base p-4">
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
                  <div className="rounded-xl border border-ui-border-base bg-ui-bg-field p-2">
                    <Textarea
                      rows={2}
                      placeholder={composerMode === "private_note" ? "Type an internal note" : "Type your message"}
                      value={composer}
                      onChange={(event) => setComposer(event.target.value)}
                      disabled={sendMutation.isPending}
                      className="border-0 bg-transparent shadow-none"
                    />
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="transparent" size="small" disabled>
                          <PaperClip />
                        </Button>
                        <Button type="button" variant="transparent" size="small" disabled>
                          <RiEmotionHappyLine className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button type="submit" isLoading={sendMutation.isPending} disabled={!composer.trim() || sendMutation.isPending}>
                        <PaperPlane />
                        {composerMode === "private_note" ? "Save note" : "Send"}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="hidden min-h-0 flex-col lg:flex">
          <div className="border-b px-6 py-4">
            <Heading level="h3">Lead context</Heading>
          </div>
          {selectedConversation ? (
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
              <div>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  Lead stage
                </Text>
                <StatusBadge color={selectedConversation.status === "open" ? "green" : "grey"}>
                  {selectedConversation.status === "open" ? "Qualified" : "Snoozed"}
                </StatusBadge>
              </div>

              <div>
                <Text size="xsmall" className="mb-1 text-ui-fg-subtle">
                  Tags
                </Text>
                <div className="flex flex-wrap gap-2">
                  <Badge size="2xsmall">{channelMeta[selectedConversation.channel].label}</Badge>
                  {selectedConversation.unread_count > 0 ? <Badge size="2xsmall">Needs follow-up</Badge> : <Badge size="2xsmall">Active</Badge>}
                </div>
              </div>

              <div>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  Owner / assignee
                </Text>
                <Text size="small">Unassigned</Text>
              </div>

              <div>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  Follow-up status
                </Text>
                <Text size="small">
                  {selectedConversation.unread_count > 0 ? "Reply pending" : "Waiting for customer"}
                </Text>
              </div>

              <div>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  Source
                </Text>
                <Text size="small">{channelMeta[selectedConversation.channel].label}</Text>
              </div>

              <div className="space-y-2 pt-2">
                <Button type="button" size="small" variant="secondary" className="w-full" disabled>
                  Assign
                </Button>
                <Button type="button" size="small" variant="secondary" className="w-full" disabled>
                  Move stage
                </Button>
                <Button type="button" size="small" variant="secondary" className="w-full" disabled>
                  Snooze
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6">
              <Text size="small" className="text-ui-fg-subtle">
                Select a conversation to view lead context.
              </Text>
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
