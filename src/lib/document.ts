import type { AppSettings, BusinessDocument, DocumentType } from '../types'
import { emptyCustomer, emptyItem } from '../types'
import { newId } from './id'
import { generateNextDocumentNumber } from './documentNumbering'

const todayISO = (): string => new Date().toISOString().slice(0, 10)

export function createNewDocument(
  type: DocumentType,
  settings: AppSettings,
): BusinessDocument {
  const now = new Date().toISOString()
  return {
    id: newId(),
    type,
    docNumber: generateNextDocumentNumber(type, settings.prefixes[type]),
    date: todayISO(),
    dueDate: '',
    placeOfSupply: '',
    company: { ...settings.company },
    customer: emptyCustomer(),
    items: [emptyItem(newId())],
    discountType: 'flat',
    discountValue: 0,
    gstEnabled: settings.defaultGstEnabled,
    gstPercent: settings.defaultGstPercent,
    taxMode: settings.defaultTaxMode,
    roundOffEnabled: true,
    footerNote: settings.defaultFooter,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  }
}
