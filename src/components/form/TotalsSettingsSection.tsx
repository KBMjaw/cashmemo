import type { BusinessDocument } from '../../types'
import { GST_PERCENT_OPTIONS } from '../../types'
import { Field, inputClass, selectClass } from '../ui/Field'
import { SectionCard } from '../ui/SectionCard'

interface Props {
  doc: BusinessDocument
  onChange: (patch: Partial<BusinessDocument>) => void
  errors: Record<string, string>
}

export function TotalsSettingsSection({ doc, onChange, errors }: Props) {
  const isCustomGst = !GST_PERCENT_OPTIONS.includes(doc.gstPercent)

  return (
    <SectionCard title="Discount & Tax">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Discount Type">
          <select
            className={selectClass}
            value={doc.discountType}
            onChange={(e) => onChange({ discountType: e.target.value as 'flat' | 'percent' })}
          >
            <option value="flat">Flat Amount (₹)</option>
            <option value="percent">Percentage (%)</option>
          </select>
        </Field>

        <Field label="Discount Value" error={errors.discount}>
          <input
            type="number"
            min={0}
            step="any"
            className={inputClass}
            value={doc.discountValue}
            onChange={(e) => onChange({ discountValue: Number(e.target.value) })}
          />
        </Field>
      </div>

      <div className="my-4 flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
        <span className="text-sm font-medium text-gray-700">Enable GST</span>
        <button
          type="button"
          role="switch"
          aria-checked={doc.gstEnabled}
          onClick={() => onChange({ gstEnabled: !doc.gstEnabled })}
          className={`relative h-6 w-11 rounded-full transition ${
            doc.gstEnabled ? 'bg-gray-900' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
              doc.gstEnabled ? 'left-5' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {doc.gstEnabled && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="GST Percentage">
            <select
              className={selectClass}
              value={isCustomGst ? 'custom' : doc.gstPercent}
              onChange={(e) => {
                if (e.target.value === 'custom') return
                onChange({ gstPercent: Number(e.target.value) })
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
                step="any"
                className={inputClass}
                value={doc.gstPercent}
                onChange={(e) => onChange({ gstPercent: Number(e.target.value) })}
              />
            </Field>
          )}

          <Field label="Transaction Type" className="sm:col-span-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onChange({ taxMode: 'intra' })}
                className={`flex-1 rounded-md border px-3 py-1.5 text-sm ${
                  doc.taxMode === 'intra'
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                Intra-State (CGST + SGST)
              </button>
              <button
                type="button"
                onClick={() => onChange({ taxMode: 'inter' })}
                className={`flex-1 rounded-md border px-3 py-1.5 text-sm ${
                  doc.taxMode === 'inter'
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                Inter-State (IGST)
              </button>
            </div>
          </Field>
        </div>
      )}

      <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={doc.roundOffEnabled}
          onChange={(e) => onChange({ roundOffEnabled: e.target.checked })}
        />
        Round off total to nearest rupee
      </label>
    </SectionCard>
  )
}
