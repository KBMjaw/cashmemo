import type { BusinessDocument } from '../types'
import { DOCUMENT_TYPE_LABELS } from '../types'
import { formatPaiseAsINR } from './money'
import { calculateDocumentTotals } from './calculations'

export function buildShareMessage(doc: BusinessDocument): string {
  const totals = calculateDocumentTotals({
    items: doc.items,
    discountType: doc.discountType,
    discountValue: doc.discountValue,
    gstEnabled: doc.gstEnabled,
    gstPercent: doc.gstPercent,
    taxMode: doc.taxMode,
    roundOffEnabled: doc.roundOffEnabled,
  })

  const customerName = doc.customer.name || 'Customer'
  const typeLabel = DOCUMENT_TYPE_LABELS[doc.type]

  return `Hi ${customerName},\nPlease find your ${typeLabel} ${doc.docNumber}.\nTotal Amount: ${formatPaiseAsINR(
    totals.grandTotalPaise,
  )}\nThank you.`
}

export function openWhatsAppShare(doc: BusinessDocument, phone?: string): void {
  const message = buildShareMessage(doc)
  const cleanPhone = phone?.replace(/[^\d]/g, '')
  const base = cleanPhone ? `https://wa.me/${cleanPhone}` : 'https://wa.me/'
  const url = `${base}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

export async function shareViaWebShare(
  doc: BusinessDocument,
  file?: File,
): Promise<boolean> {
  if (!navigator.share) return false
  const message = buildShareMessage(doc)
  try {
    if (file && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: `${DOCUMENT_TYPE_LABELS[doc.type]} ${doc.docNumber}`,
        text: message,
        files: [file],
      })
    } else {
      await navigator.share({
        title: `${DOCUMENT_TYPE_LABELS[doc.type]} ${doc.docNumber}`,
        text: message,
      })
    }
    return true
  } catch {
    return false
  }
}

export async function copyShareText(doc: BusinessDocument): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(buildShareMessage(doc))
    return true
  } catch {
    return false
  }
}
