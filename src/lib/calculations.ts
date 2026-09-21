import { toPaise } from './money'
import type { DiscountType, DocumentItem, TaxMode } from '../types'

export interface ItemComputed extends DocumentItem {
  amountPaise: number
}

export interface DocumentTotals {
  items: ItemComputed[]
  subtotalPaise: number
  discountPaise: number
  taxablePaise: number
  gstPaise: number
  cgstPaise: number
  sgstPaise: number
  igstPaise: number
  roundOffPaise: number
  grandTotalPaise: number
}

export interface CalcInput {
  items: DocumentItem[]
  discountType: DiscountType
  discountValue: number
  gstEnabled: boolean
  gstPercent: number
  taxMode: TaxMode
  roundOffEnabled: boolean
}

const round = (n: number) => Math.round(n)

export function computeItemAmountPaise(qty: number, rate: number): number {
  const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 0
  const ratePaise = toPaise(Number.isFinite(rate) && rate > 0 ? rate : 0)
  return round(safeQty * ratePaise)
}

export function calculateDocumentTotals(input: CalcInput): DocumentTotals {
  const items: ItemComputed[] = input.items.map((item) => ({
    ...item,
    amountPaise: computeItemAmountPaise(item.qty, item.rate),
  }))

  const subtotalPaise = items.reduce((sum, item) => sum + item.amountPaise, 0)

  let discountPaise = 0
  if (input.discountValue > 0) {
    discountPaise =
      input.discountType === 'percent'
        ? round((subtotalPaise * input.discountValue) / 100)
        : toPaise(input.discountValue)
  }
  discountPaise = Math.min(Math.max(discountPaise, 0), subtotalPaise)

  const taxablePaise = subtotalPaise - discountPaise

  let gstPaise = 0
  let cgstPaise = 0
  let sgstPaise = 0
  let igstPaise = 0

  if (input.gstEnabled && input.gstPercent > 0) {
    gstPaise = round((taxablePaise * input.gstPercent) / 100)
    if (input.taxMode === 'intra') {
      cgstPaise = round(gstPaise / 2)
      sgstPaise = gstPaise - cgstPaise
    } else {
      igstPaise = gstPaise
    }
  }

  const beforeRoundPaise = taxablePaise + gstPaise
  let roundOffPaise = 0
  let grandTotalPaise = beforeRoundPaise

  if (input.roundOffEnabled) {
    grandTotalPaise = round(beforeRoundPaise / 100) * 100
    roundOffPaise = grandTotalPaise - beforeRoundPaise
  }

  return {
    items,
    subtotalPaise,
    discountPaise,
    taxablePaise,
    gstPaise,
    cgstPaise,
    sgstPaise,
    igstPaise,
    roundOffPaise,
    grandTotalPaise,
  }
}
