import type { MaterialIdentityFieldKey } from '@/types/material'

const ZERO_WIDTH_CHARACTERS = /[\u200B-\u200D\uFEFF]/g
const WHITESPACE_CHARACTERS = /\s+/g
const DIAMETER_SYMBOLS = /[φø⌀]/gi
const MILLIMETER_UNITS = /(?:毫米|mm)$/i
const DASH_CHARACTERS = /[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g

const normalizeBaseValue = (value: string) =>
  value
    .normalize('NFKC')
    .replace(ZERO_WIDTH_CHARACTERS, '')
    .trim()
    .replace(WHITESPACE_CHARACTERS, '')
    .toUpperCase()

export const normalizeMaterialIdentityValue = (
  fieldKey: MaterialIdentityFieldKey,
  value: string,
) => {
  const normalized = normalizeBaseValue(value)

  if (fieldKey === 'specification') {
    return normalized
      .replace(DIAMETER_SYMBOLS, 'Φ')
      .replace(MILLIMETER_UNITS, '')
  }

  if (fieldKey === 'batchNo') {
    return normalized.replace(DASH_CHARACTERS, '-')
  }

  return normalized
}

export const materialIdentityValuesMatch = (
  fieldKey: MaterialIdentityFieldKey,
  factoryValue: string,
  arrivalValue: string,
) =>
  normalizeMaterialIdentityValue(fieldKey, factoryValue) ===
  normalizeMaterialIdentityValue(fieldKey, arrivalValue)
