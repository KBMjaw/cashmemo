import type { BusinessDocument } from '../types'

export interface ValidationResult {
  errors: Record<string, string>
  isValid: boolean
}

export function validateDocument(doc: BusinessDocument): ValidationResult {
  const errors: Record<string, string> = {}

  if (!doc.company.name.trim()) {
    errors.companyName = 'Company name is required'
  }

  if (!doc.docNumber.trim()) {
    errors.docNumber = 'Document number cannot be empty'
  }

  if (!doc.date) {
    errors.date = 'Date is required'
  }

  const itemsWithData = doc.items.filter(
    (item) => item.description.trim() || item.qty || item.rate,
  )

  if (itemsWithData.length === 0) {
    errors.items = 'Add at least one item'
  }

  doc.items.forEach((item, idx) => {
    if (!item.description.trim() && item.rate > 0) {
      errors[`item-${idx}-description`] = 'Description required'
    }
    if (item.qty < 0) {
      errors[`item-${idx}-qty`] = 'Quantity cannot be negative'
    }
    if (item.rate < 0) {
      errors[`item-${idx}-rate`] = 'Rate cannot be negative'
    }
  })

  if (doc.discountValue < 0) {
    errors.discount = 'Discount cannot be negative'
  }

  return { errors, isValid: Object.keys(errors).length === 0 }
}
