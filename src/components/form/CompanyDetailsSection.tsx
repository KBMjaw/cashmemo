import type { ChangeEvent } from 'react'
import type { CompanyDetails } from '../../types'
import { Field, inputClass } from '../ui/Field'
import { SectionCard } from '../ui/SectionCard'

interface Props {
  company: CompanyDetails
  onChange: (company: CompanyDetails) => void
  onSaveDefaults: () => void
  saved: boolean
  error?: string
}

export function CompanyDetailsSection({
  company,
  onChange,
  onSaveDefaults,
  saved,
  error,
}: Props) {
  const set = <K extends keyof CompanyDetails>(key: K, value: CompanyDetails[K]) =>
    onChange({ ...company, [key]: value })

  const handleLogo = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1024 * 1024 * 2) {
      alert('Please choose a logo smaller than 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => set('logoDataUrl', reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <SectionCard
      title="Company Details"
      action={
        <button
          type="button"
          onClick={onSaveDefaults}
          className="text-xs font-medium text-gray-600 hover:text-gray-900 underline decoration-dotted"
        >
          {saved ? 'Saved ✓' : 'Save Company Details'}
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Company Name" required error={error} className="sm:col-span-2">
          <input
            className={inputClass}
            value={company.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Acme Traders"
          />
        </Field>

        <Field label="Company Logo" className="sm:col-span-2">
          <div className="flex items-center gap-3">
            {company.logoDataUrl && (
              <img
                src={company.logoDataUrl}
                alt="Logo preview"
                className="h-12 w-12 rounded border border-gray-200 object-contain bg-white"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogo}
              className="text-xs text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gray-700 hover:file:bg-gray-200"
            />
            {company.logoDataUrl && (
              <button
                type="button"
                onClick={() => set('logoDataUrl', '')}
                className="text-xs text-gray-500 underline"
              >
                Remove
              </button>
            )}
          </div>
        </Field>

        <Field label="Address" className="sm:col-span-2">
          <textarea
            className={inputClass}
            rows={2}
            value={company.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="Shop No. 4, MG Road"
          />
        </Field>

        <Field label="City / Place">
          <input
            className={inputClass}
            value={company.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="Mumbai"
          />
        </Field>

        <Field label="Phone Number">
          <input
            className={inputClass}
            value={company.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+91 98765 43210"
          />
        </Field>

        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            value={company.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="hello@acme.com"
          />
        </Field>

        <Field label="Website">
          <input
            className={inputClass}
            value={company.website}
            onChange={(e) => set('website', e.target.value)}
            placeholder="www.acme.com"
          />
        </Field>

        <Field label="GSTIN">
          <input
            className={inputClass}
            value={company.gstin}
            onChange={(e) => set('gstin', e.target.value.toUpperCase())}
            placeholder="27AAAAA0000A1Z5"
          />
        </Field>

        <Field label="Default Authorized Person">
          <input
            className={inputClass}
            value={company.authorizedPerson}
            onChange={(e) => set('authorizedPerson', e.target.value)}
            placeholder="Proprietor"
          />
        </Field>
      </div>
    </SectionCard>
  )
}
