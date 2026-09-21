import type { BusinessDocument, CompanyDetails, CustomerDetails, DocumentItem, DocumentType } from '../../types'
import { DocumentTypeSelector } from './DocumentTypeSelector'
import { CompanyDetailsSection } from './CompanyDetailsSection'
import { CustomerDetailsSection } from './CustomerDetailsSection'
import { DocumentMetaSection } from './DocumentMetaSection'
import { ItemsTableSection } from './ItemsTableSection'
import { TotalsSettingsSection } from './TotalsSettingsSection'
import { FooterNoteSection } from './FooterNoteSection'

interface Props {
  doc: BusinessDocument
  onDocChange: (patch: Partial<BusinessDocument>) => void
  onTypeChange: (type: DocumentType) => void
  onRegenerateNumber: () => void
  onSaveCompanyDefaults: () => void
  companySaved: boolean
  errors: Record<string, string>
}

export function DocumentForm({
  doc,
  onDocChange,
  onTypeChange,
  onRegenerateNumber,
  onSaveCompanyDefaults,
  companySaved,
  errors,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <DocumentTypeSelector value={doc.type} onChange={onTypeChange} />

      <CompanyDetailsSection
        company={doc.company}
        onChange={(company: CompanyDetails) => onDocChange({ company })}
        onSaveDefaults={onSaveCompanyDefaults}
        saved={companySaved}
        error={errors.companyName}
      />

      <CustomerDetailsSection
        customer={doc.customer}
        onChange={(customer: CustomerDetails) => onDocChange({ customer })}
      />

      <DocumentMetaSection
        doc={doc}
        onChange={onDocChange}
        onRegenerateNumber={onRegenerateNumber}
        errors={errors}
      />

      <ItemsTableSection
        items={doc.items}
        onChange={(items: DocumentItem[]) => onDocChange({ items })}
        errors={errors}
      />

      <TotalsSettingsSection doc={doc} onChange={onDocChange} errors={errors} />

      <FooterNoteSection
        footerNote={doc.footerNote}
        onChange={(footerNote) => onDocChange({ footerNote })}
      />
    </div>
  )
}
