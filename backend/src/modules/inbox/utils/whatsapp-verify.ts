export const isWhatsappVerificationRequest = (query: Record<string, unknown>) => {
  return (
    query["hub.mode"] === "subscribe" &&
    typeof query["hub.verify_token"] === "string" &&
    typeof query["hub.challenge"] === "string"
  )
}
