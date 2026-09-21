import { useState } from 'react'
import type { AppSettings, DocumentType } from '../types'
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS, GST_PERCENT_OPTIONS } from '../types'
import { Field, inputClass, selectClass } from '../components/ui/Field'
import { SectionCard } from '../components/ui/SectionCard'
import { CompanyDetailsSection } from '../components/form/CompanyDetailsSection'

interface Props {
  settings: AppSettings
  onSave: (settings: AppSettings) => void
}

export function SettingsPage({ settings, onSave }: Props) {
  const [draft, setDraft] = useState<AppSettings>(settings)
  const [savedFlash, setSavedFlash] = useState(false)

  const isCustomGst = !GST_PERCENT_OPTIONS.includes(draft.defaultGstPercent)

  const handleSave = () => {
    onSave(draft)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
        <button
          onClick={handleSave}
          className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
        >
          {savedFlash ? 'Saved ✓' : 'Save Settings'}
        </button>
      </div>

      <CompanyDetailsSection
        company={draft.company}
        onChange={(company) => setDraft({ ...draft, company })}
        onSaveDefaults={handleSave}
        saved={savedFlash}
      />

      <SectionCard title="Document Number Prefixes">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {DOCUMENT_TYPES.map((type: DocumentType) => (
            <Field key={type} label={DOCUMENT_TYPE_LABELS[type]}>
              <input
                className={inputClass}
                value={draft.prefixes[type]}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    prefixes: { ...draft.prefixes, [type]: e.target.value.toUpperCase() },
                  })
                }
              />
            </Field>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Default Tax Settings">
        <label className="mb-3 flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={draft.defaultGstEnabled}
            onChange={(e) => setDraft({ ...draft, defaultGstEnabled: e.target.checked })}
          />
          Enable GST by default on new documents
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Default GST %">
            <select
              className={selectClass}
              value={isCustomGst ? 'custom' : draft.defaultGstPercent}
              onChange={(e) => {
                if (e.target.value === 'custom') return
                setDraft({ ...draft, defaultGstPercent: Number(e.target.value) })
              }}
            >
              {GST_PERCENT_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}%
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
          </Field>
          {isCustomGst && (
            <Field label="Custom GST %">
              <input
                type="number"
                min={0}
                max={100}
                className={inputClass}
                value={draft.defaultGstPercent}
                onChange={(e) => setDraft({ ...draft, defaultGstPercent: Number(e.target.value) })}
              />
            </Field>
          )}
          <Field label="Default Transaction Type">
            <select
              className={selectClass}
              value={draft.defaultTaxMode}
              onChange={(e) =>
                setDraft({ ...draft, defaultTaxMode: e.target.value as 'intra' | 'inter' })
              }
            >
              <option value="intra">Intra-State (CGST + SGST)</option>
              <option value="inter">Inter-State (IGST)</option>
            </select>
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Default Footer / Note">
        <Field label="Shown on every new document unless changed">
          <textarea
            className={inputClass}
            rows={2}
            value={draft.defaultFooter}
            onChange={(e) => setDraft({ ...draft, defaultFooter: e.target.value })}
          />
        </Field>
      </SectionCard>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
        >
          {savedFlash ? 'Saved ✓' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
