export const TELEGRAM_MESSAGE_ID_SEPARATOR = ":"

export const buildTelegramExternalMessageId = (chatId: string, messageId: string): string =>
  `${chatId}${TELEGRAM_MESSAGE_ID_SEPARATOR}${messageId}`

export const parseTelegramExternalMessageId = (
  externalMessageId: string
): { chatId: string | null; messageId: string } => {
  const separatorIndex = externalMessageId.indexOf(TELEGRAM_MESSAGE_ID_SEPARATOR)

  if (separatorIndex <= 0 || separatorIndex === externalMessageId.length - 1) {
    return {
      chatId: null,
      messageId: externalMessageId,
    }
  }

  return {
    chatId: externalMessageId.slice(0, separatorIndex),
    messageId: externalMessageId.slice(separatorIndex + 1),
  }
}
