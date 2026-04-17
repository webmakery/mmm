import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight, PaperClip, PaperPlane } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Input, StatusBadge, Text, Textarea, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  RiEmotionHappyLine,
  RiGlobalLine,
  RiInstagramLine,
  RiMessengerLine,
  RiTelegramLine,
  RiWhatsappLine,
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

type Lead = {
  id: string
  first_name: string
  last_name?: string | null
  phone?: string | null
  metadata?: Record<string, unknown> | null
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
  { label: string; icon: typeof RiWhatsappLine; iconClassName: string; badgeClassName: string }
> = {
  whatsapp: {
    label: "WhatsApp",
    icon: RiWhatsappLine,
    iconClassName: "text-[#25D366]",
    badgeClassName: "bg-[#25D3661A]",
  },
  messenger: {
    label: "Messenger",
    icon: RiMessengerLine,
    iconClassName: "text-[#0084FF]",
    badgeClassName: "bg-[#0084FF1A]",
  },
  instagram: {
    label: "Instagram",
    icon: RiInstagramLine,
    iconClassName: "text-[#E4405F]",
    badgeClassName: "bg-[#E4405F1A]",
  },
  telegram: {
    label: "Telegram",
    icon: RiTelegramLine,
    iconClassName: "text-[#229ED9]",
    badgeClassName: "bg-[#229ED91A]",
  },
  web_chat: {
    label: "Web Chat",
    icon: RiGlobalLine,
    iconClassName: "text-ui-fg-subtle",
    badgeClassName: "bg-ui-bg-subtle",
  },
}

const avatarToneClasses = [
  "bg-[#DBEAFE] text-[#1E3A8A]",
  "bg-[#FEF3C7] text-[#92400E]",
  "bg-[#EDE9FE] text-[#5B21B6]",
  "bg-[#DCFCE7] text-[#166534]",
] as const

const countryCodeMap: Array<{ code: string; country: string; flag: string }> = [
  { code: "971", country: "United Arab Emirates", flag: "🇦🇪" },
  { code: "966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "380", country: "Ukraine", flag: "🇺🇦" },
  { code: "351", country: "Portugal", flag: "🇵🇹" },
  { code: "91", country: "India", flag: "🇮🇳" },
  { code: "84", country: "Vietnam", flag: "🇻🇳" },
  { code: "82", country: "South Korea", flag: "🇰🇷" },
  { code: "81", country: "Japan", flag: "🇯🇵" },
  { code: "66", country: "Thailand", flag: "🇹🇭" },
  { code: "65", country: "Singapore", flag: "🇸🇬" },
  { code: "64", country: "New Zealand", flag: "🇳🇿" },
  { code: "63", country: "Philippines", flag: "🇵🇭" },
  { code: "62", country: "Indonesia", flag: "🇮🇩" },
  { code: "61", country: "Australia", flag: "🇦🇺" },
  { code: "57", country: "Colombia", flag: "🇨🇴" },
  { code: "56", country: "Chile", flag: "🇨🇱" },
  { code: "55", country: "Brazil", flag: "🇧🇷" },
  { code: "54", country: "Argentina", flag: "🇦🇷" },
  { code: "52", country: "Mexico", flag: "🇲🇽" },
  { code: "51", country: "Peru", flag: "🇵🇪" },
  { code: "49", country: "Germany", flag: "🇩🇪" },
  { code: "44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "39", country: "Italy", flag: "🇮🇹" },
  { code: "34", country: "Spain", flag: "🇪🇸" },
  { code: "33", country: "France", flag: "🇫🇷" },
  { code: "32", country: "Belgium", flag: "🇧🇪" },
  { code: "31", country: "Netherlands", flag: "🇳🇱" },
  { code: "27", country: "South Africa", flag: "🇿🇦" },
  { code: "20", country: "Egypt", flag: "🇪🇬" },
]

const normalizePhone = (value?: string | null) => (value || "").replace(/[^\d+]/g, "")

const getSenderInitial = (name: string) => {
  const trimmed = name.trim()
  if (!trimmed) {
    return "C"
  }

  return trimmed[0].toUpperCase()
}

const getSenderToneClass = (key: string) => {
  const hash = key.split("").reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0)
  return avatarToneClasses[hash % avatarToneClasses.length]
}

const detectCountry = (conversation?: Conversation | null) => {
  const candidate = normalizePhone(conversation?.customer_phone || conversation?.customer_identifier)

  if (!candidate.startsWith("+")) {
    return null
  }

  const digits = candidate.slice(1)
  const match = countryCodeMap.find((entry) => digits.startsWith(entry.code) && digits.length > entry.code.length + 4)

  return match || null
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

const ChannelBadge = ({ channel }: { channel: Channel }) => {
  const Icon = channelMeta[channel].icon

  return (
    <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${channelMeta[channel].badgeClassName}`}>
      <Icon className={`h-3.5 w-3.5 ${channelMeta[channel].iconClassName}`} />
    </span>
  )
}

const ChannelFilters = ({ value, onChange }: { value: "all" | Channel; onChange: (channel: "all" | Channel) => void }) => {
  return (
    <div className="px-6 pb-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {channelOptions.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={value === option.value ? "secondary" : "transparent"}
            size="small"
            className="shrink-0 rounded-full"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  )
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

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) || null,
    [conversations, selectedId]
  )


  useEffect(() => {
    if (!selectedId && conversations.length > 0) {
      setSelectedId(conversations[0].id)
    }
  }, [conversations, selectedId])

  useEffect(() => {
    setComposerMode("message")
    setComposer("")
  }, [selectedId])

  useEffect(() => {
    if (!selectedId) {
      return
    }

    const currentConversation = conversations.find((conversation) => conversation.id === selectedId)

    if (currentConversation?.unread_count) {
      sdk.client
        .fetch(`/admin/inbox/conversations/${selectedId}/read`, {
          method: "POST",
        })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["inbox-conversations"] })
        })
    }
  }, [conversations, queryClient, selectedId])

  const { data: conversationData, isLoading: isLoadingConversation } = useQuery<{
    conversation: Conversation & { messages: Message[] }
  }>({
    queryKey: ["inbox-conversation", selectedId],
    queryFn: () => sdk.client.fetch(`/admin/inbox/conversations/${selectedId}`),
    enabled: Boolean(selectedId),
    refetchInterval: 5000,
  })

  const messages = useMemo(() => conversationData?.conversation.messages || [], [conversationData])

  const leadSearchTerm = useMemo(() => {
    if (!selectedConversation) {
      return ""
    }

    return (
      selectedConversation.customer_phone ||
      selectedConversation.customer_handle ||
      selectedConversation.customer_name ||
      selectedConversation.customer_identifier ||
      ""
    )
  }, [selectedConversation])

  const { data: leadSearchData } = useQuery<{ leads: Lead[] }>({
    queryKey: ["inbox-linked-lead", selectedConversation?.id, leadSearchTerm],
    enabled: Boolean(selectedConversation && leadSearchTerm),
    queryFn: () =>
      sdk.client.fetch("/admin/leads", {
        query: {
          q: leadSearchTerm,
          limit: 10,
          offset: 0,
        },
      }),
  })

  const linkedLead = useMemo(() => {
    if (!selectedConversation) {
      return null
    }

    const normalizedConversationPhone = normalizePhone(selectedConversation.customer_phone)

    return (
      leadSearchData?.leads.find((lead) => {
        const conversationIdFromMetadata = String(lead.metadata?.inbox_conversation_id || "")
        if (conversationIdFromMetadata && conversationIdFromMetadata === selectedConversation.id) {
          return true
        }

        const normalizedLeadPhone = normalizePhone(lead.phone)
        return Boolean(normalizedConversationPhone && normalizedLeadPhone && normalizedConversationPhone === normalizedLeadPhone)
      }) || null
    )
  }, [leadSearchData?.leads, selectedConversation])

  const createLeadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversation) {
        return
      }

      const customerLabel =
        selectedConversation.customer_name ||
        selectedConversation.customer_handle ||
        selectedConversation.customer_phone ||
        selectedConversation.customer_identifier ||
        "Lead"

      const [firstName, ...remainingParts] = customerLabel.trim().split(/\s+/)

      return sdk.client.fetch("/admin/leads", {
        method: "POST",
        body: {
          first_name: firstName || "Lead",
          last_name: remainingParts.join(" ") || "Inbox",
          phone: selectedConversation.customer_phone || undefined,
          source: channelMeta[selectedConversation.channel].label,
          metadata: {
            inbox_channel: selectedConversation.channel,
            inbox_conversation_id: selectedConversation.id,
            inbox_customer_identifier: selectedConversation.customer_identifier,
          },
        },
      })
    },
    onSuccess: () => {
      toast.success("Lead created from inbox conversation")
      queryClient.invalidateQueries({ queryKey: ["inbox-linked-lead"] })
      queryClient.invalidateQueries({ queryKey: ["leads"] })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create lead")
    },
  })

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
      return message.participant?.display_name || message.participant?.external_id || "Private note"
    }

    if (message.direction === "outbound") {
      return "You"
    }

    return message.participant?.display_name || message.participant?.external_id || "Customer"
  }

  const selectedCountry = detectCountry(selectedConversation)

  return (
    <Container className="h-[calc(100vh-9rem)] min-h-[640px] p-0">
      <div className="grid h-full min-h-0 grid-cols-1 divide-y lg:grid-cols-[320px_1fr_280px] lg:divide-x lg:divide-y-0">
        <div className="flex min-h-0 flex-col">
          <div className="flex items-center justify-between px-6 py-4">
            <Heading>Inbox</Heading>
          </div>
          <div className="px-6 pb-3">
            <Input
              placeholder="Search by name, handle, phone, or message"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <ChannelFilters value={channel} onChange={setChannel} />

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
                    className={`flex w-full flex-col gap-1.5 border-t px-6 py-2.5 text-left transition-colors ${
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
                        <ChannelBadge channel={conversation.channel} />
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
          {!conversationData?.conversation ? (
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
                        {getConversationTitle(conversationData.conversation)}
                      </Heading>
                      {selectedCountry ? (
                        <Text size="small" className="shrink-0" title={selectedCountry.country}>
                          {selectedCountry.flag}
                        </Text>
                      ) : null}
                    </div>
                    {getConversationSubtitle(conversationData.conversation) ? (
                      <Text size="small" className="truncate text-ui-fg-subtle">
                        {getConversationSubtitle(conversationData.conversation)}
                      </Text>
                    ) : null}
                  </div>
                  <Badge size="2xsmall" className="inline-flex items-center gap-1">
                    <ChannelBadge channel={conversationData.conversation.channel} />
                    <span>{channelMeta[conversationData.conversation.channel].label}</span>
                  </Badge>
                </div>
                <Text size="xsmall" className="mt-1 text-ui-fg-subtle">
                  Last message {formatRelativeTime(conversationData.conversation.last_message_at || conversationData.conversation.updated_at)}
                </Text>
              </div>

              <div className="flex flex-1 min-h-0 flex-col gap-3 overflow-y-auto px-4 py-4">
                {messages.length === 0 ? (
                  <Text size="small" className="text-ui-fg-subtle">
                    No messages yet. Start a conversation or select another lead.
                  </Text>
                ) : (
                  messages.map((message) => {
                    const isOutbound = message.direction === "outbound"
                    const isPrivateNote = message.message_type === "private_note"
                    const senderName = getSenderName(message)
                    const senderInitial = getSenderInitial(senderName)

                    if (isPrivateNote) {
                      return (
                        <div key={message.id} className="rounded-lg border border-ui-tag-orange-border bg-ui-tag-orange-bg px-3 py-2">
                          <div className="mb-1 flex items-center gap-2">
                            <Badge size="2xsmall">Private note</Badge>
                            <Text size="xsmall" className="text-ui-fg-subtle">
                              {senderName}
                            </Text>
                          </div>
                          <Text size="small">{message.text || message.content || ""}</Text>
                          <Text size="xsmall" className="mt-1 text-ui-fg-subtle">
                            {formatMessageTime(message)}
                          </Text>
                        </div>
                      )
                    }

                    return (
                      <div key={message.id} className={`flex items-end gap-2 ${isOutbound ? "justify-end" : "justify-start"}`}>
                        {!isOutbound ? (
                          <span
                            className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${getSenderToneClass(
                              senderName
                            )}`}
                          >
                            {senderInitial}
                          </span>
                        ) : null}

                        <div className={`max-w-[80%] space-y-1 ${isOutbound ? "text-right" : "text-left"}`}>
                          <Text size="xsmall" className="text-ui-fg-subtle">
                            {senderName}
                          </Text>
                          <Text size="small" className={isOutbound ? "rounded-xl bg-ui-bg-subtle px-3 py-2" : "px-1"}>
                            {message.text || message.content || ""}
                          </Text>
                          <div className={`flex items-center gap-1.5 ${isOutbound ? "justify-end" : "justify-start"}`}>
                            <Text size="xsmall" className="text-ui-fg-subtle">
                              {formatMessageTime(message)}
                            </Text>
                            {isOutbound ? <StatusBadge color={getStatusColor(message.status)}>{message.status}</StatusBadge> : null}
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
                      placeholder={composerMode === "private_note" ? "Type a private note" : "Type your message"}
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

              {selectedCountry ? (
                <div>
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    Country
                  </Text>
                  <Text size="small">
                    {selectedCountry.flag} {selectedCountry.country}
                  </Text>
                </div>
              ) : null}

              <div className="space-y-2 pt-2">
                {linkedLead ? (
                  <Button type="button" size="small" variant="secondary" className="w-full" asChild>
                    <Link to={`/leads/${linkedLead.id}`}>Open lead</Link>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="small"
                    variant="secondary"
                    className="w-full"
                    isLoading={createLeadMutation.isPending}
                    disabled={createLeadMutation.isPending}
                    onClick={() => createLeadMutation.mutate()}
                  >
                    Create lead
                  </Button>
                )}
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
