/**
 * All monetary math is done in integer paise to avoid floating point
 * precision errors (e.g. 3 * 999.5 !== 2998.5 in raw floats).
 */

export const toPaise = (rupees: number): number => Math.round(rupees * 100)

export const fromPaise = (paise: number): number => paise / 100

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const inrFormatterNoDecimals = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export const formatINR = (rupees: number, decimals = true): string =>
  (decimals ? inrFormatter : inrFormatterNoDecimals).format(
    Number.isFinite(rupees) ? rupees : 0,
  )

export const formatPaiseAsINR = (paise: number, decimals = true): string =>
  formatINR(fromPaise(paise), decimals)
