export type DocumentType =
  | 'cash-receipt'
  | 'quotation'
  | 'invoice'
  | 'payment-receipt'

export const DOCUMENT_TYPES: DocumentType[] = [
  'cash-receipt',
  'quotation',
  'invoice',
  'payment-receipt',
]

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  'cash-receipt': 'Cash Receipt',
  quotation: 'Quotation',
  invoice: 'Invoice',
  'payment-receipt': 'Payment Receipt',
}

export const DOCUMENT_TITLE: Record<DocumentType, string> = {
  'cash-receipt': 'CASH RECEIPT',
  quotation: 'QUOTATION',
  invoice: 'INVOICE',
  'payment-receipt': 'PAYMENT RECEIPT',
}

export const DEFAULT_PREFIXES: Record<DocumentType, string> = {
  'cash-receipt': 'REC-',
  quotation: 'QUO-',
  invoice: 'INV-',
  'payment-receipt': 'PAY-',
}

export type TaxMode = 'intra' | 'inter'

export type DiscountType = 'flat' | 'percent'

export type DocumentStatus = 'draft' | 'final'

export interface CompanyDetails {
  name: string
  logoDataUrl: string
  address: string
  city: string
  phone: string
  email: string
  website: string
  gstin: string
  authorizedPerson: string
}

export const emptyCompany = (): CompanyDetails => ({
  name: '',
  logoDataUrl: '',
  address: '',
  city: '',
  phone: '',
  email: '',
  website: '',
  gstin: '',
  authorizedPerson: '',
})

export interface CustomerDetails {
  name: string
  companyName: string
  address: string
  city: string
  phone: string
  email: string
  gstin: string
}

export const emptyCustomer = (): CustomerDetails => ({
  name: '',
  companyName: '',
  address: '',
  city: '',
  phone: '',
  email: '',
  gstin: '',
})

export interface DocumentItem {
  id: string
  description: string
  qty: number
  unit: string
  rate: number
}

export const emptyItem = (id: string): DocumentItem => ({
  id,
  description: '',
  qty: 1,
  unit: 'Nos',
  rate: 0,
})

export const UNIT_OPTIONS = [
  'Nos',
  'Pcs',
  'Kg',
  'Gm',
  'Ltr',
  'Mtr',
  'Box',
  'Set',
  'Hour',
  'Day',
  'Month',
  'Year',
  'Service',
]

export const GST_PERCENT_OPTIONS = [0, 5, 12, 18, 28]

export interface BusinessDocument {
  id: string
  type: DocumentType
  docNumber: string
  date: string
  dueDate: string
  placeOfSupply: string
  company: CompanyDetails
  customer: CustomerDetails
  items: DocumentItem[]
  discountType: DiscountType
  discountValue: number
  gstEnabled: boolean
  gstPercent: number
  taxMode: TaxMode
  roundOffEnabled: boolean
  footerNote: string
  status: DocumentStatus
  createdAt: string
  updatedAt: string
}

export interface DocumentPrefixes {
  'cash-receipt': string
  quotation: string
  invoice: string
  'payment-receipt': string
}

export interface AppSettings {
  company: CompanyDetails
  prefixes: DocumentPrefixes
  defaultGstEnabled: boolean
  defaultGstPercent: number
  defaultTaxMode: TaxMode
  defaultFooter: string
}

export const defaultSettings = (): AppSettings => ({
  company: emptyCompany(),
  prefixes: { ...DEFAULT_PREFIXES },
  defaultGstEnabled: false,
  defaultGstPercent: 18,
  defaultTaxMode: 'intra',
  defaultFooter: 'Thank you for your business.',
})
