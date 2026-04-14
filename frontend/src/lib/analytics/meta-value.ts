const toFiniteNumber = (value: unknown) => {
  const numericValue = typeof value === "number" ? value : Number(value)
  return Number.isFinite(numericValue) ? numericValue : undefined
}

export const normalizeMedusaMinorUnitToDecimal = (value: unknown) => {
  const numericValue = toFiniteNumber(value)

  if (typeof numericValue !== "number") {
    return undefined
  }

  return Number((numericValue / 100).toFixed(2))
}

export const resolveMetaValue = ({
  forwardedValue,
  medusaMinorUnitValue,
}: {
  forwardedValue?: unknown
  medusaMinorUnitValue?: unknown
}) => {
  const normalizedForwardedValue = toFiniteNumber(forwardedValue)
  if (typeof normalizedForwardedValue === "number") {
    return normalizedForwardedValue
  }

  return normalizeMedusaMinorUnitToDecimal(medusaMinorUnitValue)
}
