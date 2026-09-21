const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
]

const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
]

function twoDigits(n: number): string {
  if (n < 20) return ONES[n]
  const tens = Math.floor(n / 10)
  const ones = n % 10
  return `${TENS[tens]}${ones ? '-' + ONES[ones] : ''}`
}

function threeDigits(n: number): string {
  const hundred = Math.floor(n / 100)
  const rest = n % 100
  const parts: string[] = []
  if (hundred) parts.push(`${ONES[hundred]} Hundred`)
  if (rest) parts.push(twoDigits(rest))
  return parts.join(' ')
}

/** Converts a non-negative integer into words using the Indian numbering
 * system (Thousand, Lakh, Crore). */
export function integerToIndianWords(value: number): string {
  const n = Math.floor(Math.abs(value))
  if (n === 0) return 'Zero'

  const crore = Math.floor(n / 10000000)
  const lakh = Math.floor((n % 10000000) / 100000)
  const thousand = Math.floor((n % 100000) / 1000)
  const hundred = n % 1000

  const parts: string[] = []
  if (crore) parts.push(`${threeDigits(crore)} Crore`)
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`)
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`)
  if (hundred) parts.push(threeDigits(hundred))

  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

/**
 * Converts a rupee amount (may include paise as decimals) into words
 * following the Indian numbering system, e.g.
 *   25450.00 -> "Rupees Twenty-Five Thousand Four Hundred Fifty Only"
 *   25450.50 -> "Rupees Twenty-Five Thousand Four Hundred Fifty and Fifty Paise Only"
 */
export function amountToIndianWords(amount: number): string {
  if (!Number.isFinite(amount)) return ''
  const safeAmount = Math.max(0, amount)
  const rupees = Math.floor(safeAmount)
  const paise = Math.round((safeAmount - rupees) * 100)

  const rupeeWords = integerToIndianWords(rupees)
  const rupeeText = `Rupees ${rupeeWords}`

  if (paise > 0) {
    const paiseWords = twoDigits(paise)
    return `${rupeeText} and ${paiseWords} Paise Only`
  }

  return `${rupeeText} Only`
}
