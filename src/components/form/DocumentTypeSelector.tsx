import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from '../../types'
import type { DocumentType } from '../../types'

interface Props {
  value: DocumentType
  onChange: (type: DocumentType) => void
}

export function DocumentTypeSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {DOCUMENT_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
            value === type
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
          }`}
        >
          {DOCUMENT_TYPE_LABELS[type]}
        </button>
      ))}
    </div>
  )
}
