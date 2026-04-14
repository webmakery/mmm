import { getProductReviews } from "@lib/data/reviews"
import { Heading, Text } from "@medusajs/ui"
import ProductReviewsForm from "./product-reviews-form"

const ProductReviews = async ({ productId }: { productId: string }) => {
  const reviewsData = await getProductReviews(productId)

  return (
    <div className="flex flex-col gap-y-8" data-testid="product-reviews-section">
      <div className="flex flex-col gap-y-1">
        <Heading level="h2">Customer reviews</Heading>
        <Text className="text-ui-fg-subtle">
          {reviewsData.average_rating.toFixed(1)} average from {reviewsData.count} review
          {reviewsData.count === 1 ? "" : "s"}
        </Text>
      </div>

      <div className="grid grid-cols-1 small:grid-cols-2 gap-x-6 gap-y-8">
        {reviewsData.reviews.map((review) => (
          <div key={review.id} className="flex flex-col gap-y-2">
            <Text className="txt-compact-medium-plus">
              {review.title || "Review"} · {review.rating}/5
            </Text>
            <Text className="text-ui-fg-subtle">
              {review.first_name} {review.last_name}
            </Text>
            <Text>{review.content}</Text>
          </div>
        ))}
      </div>

      {!reviewsData.reviews.length && (
        <Text className="text-ui-fg-subtle">No reviews yet for this product.</Text>
      )}

      <ProductReviewsForm productId={productId} />
    </div>
  )
}

export default ProductReviews
