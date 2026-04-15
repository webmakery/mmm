import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@medusajs/ui"
import {
  CustomerDigitalProduct,
  getDigitalMediaDownloadLink,
} from "@lib/data/digital-products"

type DownloadableMedia = {
  id: string
  fileName: string
  productTitle: string
  downloadUrl: string
}

const DigitalProductsList = async ({
  digitalProducts,
}: {
  digitalProducts: CustomerDigitalProduct[]
}) => {
  const mediaRows = digitalProducts.flatMap((product) =>
    (product.medias || []).map((media) => ({
      id: media.id,
      fileName: media.fileName || "Download",
      productTitle: product.title || "Digital Product",
    }))
  )

  const downloadableMedias: DownloadableMedia[] = await Promise.all(
    mediaRows.map(async (media) => ({
      ...media,
      downloadUrl: await getDigitalMediaDownloadLink(media.id),
    }))
  )

  if (!downloadableMedias.length) {
    return (
      <div
        className="flex w-full flex-col gap-4 rounded-lg border border-ui-border-base bg-ui-bg-base p-6"
        data-testid="no-digital-products-container"
      >
        <h2 className="text-large-semi">Nothing to see here</h2>
        <p className="text-base-regular">
          You don&apos;t have any digital products yet.
        </p>
        <div className="flex justify-end pt-2">
          <LocalizedClientLink href="/" passHref>
            <Button data-testid="continue-shopping-button">
              Continue shopping
            </Button>
          </LocalizedClientLink>
        </div>
      </div>
    )
  }

  return (
    <ul
      className="flex w-full flex-col rounded-lg border border-ui-border-base bg-ui-bg-base"
      data-testid="digital-products-list"
    >
      {downloadableMedias.map((media) => (
        <li
          key={media.id}
          className="flex flex-col gap-3 border-b border-ui-border-base px-5 py-4 last:border-b-0 small:flex-row small:items-center small:justify-between small:gap-4"
        >
          <div>
            <p className="text-base-semi">{media.productTitle}</p>
            <p className="text-base-regular text-ui-fg-subtle">
              {media.fileName}
            </p>
          </div>
          <a
            href={media.downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="text-ui-fg-interactive text-base-semi"
          >
            Download
          </a>
        </li>
      ))}
    </ul>
  )
}

export default DigitalProductsList
