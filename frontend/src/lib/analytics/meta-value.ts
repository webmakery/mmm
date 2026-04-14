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
  medusaValueIsMinorUnit = false,
}: {
  forwardedValue?: unknown
  medusaMinorUnitValue?: unknown
  medusaValueIsMinorUnit?: boolean
}) => {
  const normalizedForwardedValue = toFiniteNumber(forwardedValue)
  if (typeof normalizedForwardedValue === "number") {
    return normalizedForwardedValue
  }

  const normalizedMedusaValue = toFiniteNumber(medusaMinorUnitValue)
  if (typeof normalizedMedusaValue !== "number") {
    return undefined
  }

  if (medusaValueIsMinorUnit) {
    return normalizeMedusaMinorUnitToDecimal(normalizedMedusaValue)
  }

  return normalizedMedusaValue
}
