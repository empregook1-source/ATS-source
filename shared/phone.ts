export function onlyPhoneDigits(value: string | null | undefined): string {
  if (!value) return ''
  return value.replace(/\D/g, '')
}

export function normalizePhoneForStorage(value: string | null | undefined): string | undefined {
  const digits = onlyPhoneDigits(value).slice(0, 11)
  return digits.length > 0 ? digits : undefined
}

export function formatPhoneMask(value: string | null | undefined): string {
  const digits = onlyPhoneDigits(value).slice(0, 11)
  if (!digits) return ''
  if (digits.length <= 2) return `(${digits}`

  const areaCode = digits.slice(0, 2)
  const localNumber = digits.slice(2)
  if (!localNumber) return `(${areaCode})`

  const prefixLength = localNumber.length > 8 ? 5 : 4
  const prefix = localNumber.slice(0, prefixLength)
  const suffix = localNumber.slice(prefixLength)

  return suffix ? `(${areaCode}) ${prefix}-${suffix}` : `(${areaCode}) ${prefix}`
}
