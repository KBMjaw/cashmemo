import type { BusinessDocument } from '../../types'
import { Field, inputClass } from '../ui/Field'
import { SectionCard } from '../ui/SectionCard'

interface Props {
  doc: BusinessDocument
  onChange: (patch: Partial<BusinessDocument>) => void
  onRegenerateNumber: () => void
  errors: Record<string, string>
}

export function DocumentMetaSection({ doc, onChange, onRegenerateNumber, errors }: Props) {
  return (
    <SectionCard title="Document Details">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Document Number" required error={errors.docNumber}>
          <div className="flex gap-2">
            <input
              className={inputClass}
              value={doc.docNumber}
              onChange={(e) => onChange({ docNumber: e.target.value })}
            />
            <button
              type="button"
              title="Generate next number"
              onClick={onRegenerateNumber}
              className="shrink-0 rounded-md border border-gray-300 px-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              ↻
            </button>
          </div>
        </Field>

        <Field label="Date" required error={errors.date}>
          <input
            type="date"
            className={inputClass}
            value={doc.date}
            onChange={(e) => onChange({ date: e.target.value })}
          />
        </Field>

        <Field label="Due Date (optional)">
          <input
            type="date"
            className={inputClass}
            value={doc.dueDate}
            onChange={(e) => onChange({ dueDate: e.target.value })}
          />
        </Field>

        <Field label="Place of Supply (optional)">
          <input
            className={inputClass}
            value={doc.placeOfSupply}
            onChange={(e) => onChange({ placeOfSupply: e.target.value })}
            placeholder="Maharashtra"
          />
        </Field>
      </div>
    </SectionCard>
  )
}
