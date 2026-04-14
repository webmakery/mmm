"use client"

import { Button } from "@medusajs/ui"

type DownloadInvoiceButtonProps = {
  orderId: string
}

const DownloadInvoiceButton = ({ orderId }: DownloadInvoiceButtonProps) => {
  const href = `/api/orders/${orderId}/invoice`

  return (
    <Button variant="secondary" size="small" asChild>
      <a href={href}>Download invoice</a>
    </Button>
  )
}

export default DownloadInvoiceButton
