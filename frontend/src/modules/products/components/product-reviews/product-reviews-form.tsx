"use client"

import { createReview } from "@lib/data/reviews"
import useToggleState from "@lib/hooks/use-toggle-state"
import Input from "@modules/common/components/input"
import Modal from "@modules/common/components/modal"
import NativeSelect from "@modules/common/components/native-select"
import { Button, Heading, Text, Textarea } from "@medusajs/ui"
import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

const initialState = {
  success: false,
  message: null,
}

const ProductReviewsForm = ({ productId }: { productId: string }) => {
  const [state, formAction] = useActionState(createReview, initialState)
  const [successState, setSuccessState] = useState(false)
  const { state: isOpen, open, close: closeModal } = useToggleState(false)
  const router = useRouter()

  const close = () => {
    setSuccessState(false)
    closeModal()
  }

  useEffect(() => {
    if (state.success) {
      setSuccessState(true)
      router.refresh()
    }
  }, [state.success, router])

  useEffect(() => {
    if (successState) {
      close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successState])

  return (
    <div className="flex flex-col gap-y-4">
      <Button variant="secondary" className="w-fit" onClick={open}>
        Add Review
      </Button>

      {state.message && (
        <Text className={state.success ? "text-ui-fg-base" : "text-rose-500"}>
          {state.message}
        </Text>
      )}

      <Modal isOpen={isOpen} close={close} data-testid="add-review-modal">
        <Modal.Title>
          <Heading className="mb-2">Add Review</Heading>
        </Modal.Title>
        <form className="w-full" action={formAction}>
          <input type="hidden" name="product_id" value={productId} />
          <Modal.Body>
            <div className="flex w-full flex-col gap-y-4">
              <Input label="Title" name="title" />
              <div className="grid grid-cols-1 small:grid-cols-2 gap-4">
                <Input label="First name" name="first_name" required />
                <Input label="Last name" name="last_name" required />
              </div>
              <div className="flex flex-col gap-y-1">
                <label className="txt-compact-small-plus text-ui-fg-subtle">
                  Rating
                </label>
                <NativeSelect name="rating" defaultValue="5" required>
                  <option value="5">5</option>
                  <option value="4">4</option>
                  <option value="3">3</option>
                  <option value="2">2</option>
                  <option value="1">1</option>
                </NativeSelect>
              </div>
              <div className="flex flex-col gap-y-1">
                <label className="txt-compact-small-plus text-ui-fg-subtle">
                  Review
                </label>
                <Textarea name="content" required rows={5} />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={close}
                className="h-10"
              >
                Cancel
              </Button>
              <Button type="submit">Submit Review</Button>
            </div>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}

export default ProductReviewsForm
