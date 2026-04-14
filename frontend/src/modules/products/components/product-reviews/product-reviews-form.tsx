"use client"

import { createReview } from "@lib/data/reviews"
import Input from "@modules/common/components/input"
import { Button, Text, Textarea } from "@medusajs/ui"
import NativeSelect from "@modules/common/components/native-select"
import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"

const initialState = {
  success: false,
  message: null,
}

const ProductReviewsForm = ({ productId }: { productId: string }) => {
  const [state, formAction] = useActionState(createReview, initialState)
  const router = useRouter()

  useEffect(() => {
    if (state.success) {
      router.refresh()
    }
  }, [state.success, router])

  return (
    <form className="flex flex-col gap-y-4" action={formAction}>
      <input type="hidden" name="product_id" value={productId} />
      <Input label="Title" name="title" />
      <div className="grid grid-cols-1 small:grid-cols-2 gap-4">
        <Input label="First name" name="first_name" required />
        <Input label="Last name" name="last_name" required />
      </div>
      <div className="flex flex-col gap-y-1">
        <label className="txt-compact-small-plus text-ui-fg-subtle">Rating</label>
        <NativeSelect name="rating" defaultValue="5" required>
          <option value="5">5</option>
          <option value="4">4</option>
          <option value="3">3</option>
          <option value="2">2</option>
          <option value="1">1</option>
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-y-1">
        <label className="txt-compact-small-plus text-ui-fg-subtle">Review</label>
        <Textarea name="content" required rows={5} />
      </div>
      {state.message && (
        <Text className={state.success ? "text-ui-fg-base" : "text-rose-500"}>
          {state.message}
        </Text>
      )}
      <Button variant="secondary" type="submit" className="w-fit">
        Submit review
      </Button>
    </form>
  )
}

export default ProductReviewsForm
