import type { BusinessDocument } from '../../types'
import { DOCUMENT_TYPE_LABELS } from '../../types'
import { calculateDocumentTotals } from '../../lib/calculations'
import { formatPaiseAsINR } from '../../lib/money'

interface Props {
  documents: BusinessDocument[]
  onView: (doc: BusinessDocument) => void
  onEdit: (doc: BusinessDocument) => void
  onDuplicate: (doc: BusinessDocument) => void
  onDownload: (doc: BusinessDocument) => void
  onDelete: (doc: BusinessDocument) => void
}

function totalOf(doc: BusinessDocument): number {
  const t = calculateDocumentTotals({
    items: doc.items,
    discountType: doc.discountType,
    discountValue: doc.discountValue,
    gstEnabled: doc.gstEnabled,
    gstPercent: doc.gstPercent,
    taxMode: doc.taxMode,
    roundOffEnabled: doc.roundOffEnabled,
  })
  return t.grandTotalPaise
}

export function RecentDocuments({ documents, onView, onEdit, onDuplicate, onDownload, onDelete }: Props) {
  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
        No documents yet. Create your first document to see it here.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <th className="px-4 py-2.5">Document No.</th>
            <th className="px-4 py-2.5">Type</th>
            <th className="px-4 py-2.5">Customer</th>
            <th className="px-4 py-2.5">Date</th>
            <th className="px-4 py-2.5 text-right">Amount</th>
            <th className="px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
              <td className="px-4 py-2.5 font-medium text-gray-900">{doc.docNumber}</td>
              <td className="px-4 py-2.5 text-gray-600">{DOCUMENT_TYPE_LABELS[doc.type]}</td>
              <td className="px-4 py-2.5 text-gray-600">{doc.customer.name || '—'}</td>
              <td className="px-4 py-2.5 text-gray-600">{doc.date}</td>
              <td className="px-4 py-2.5 text-right text-gray-800">
                {formatPaiseAsINR(totalOf(doc))}
              </td>
              <td className="px-4 py-2.5">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    doc.status === 'final'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {doc.status === 'final' ? 'Final' : 'Draft'}
                </span>
              </td>
              <td className="px-4 py-2.5">
                <div className="flex justify-end gap-2 text-xs">
                  <ActionLink label="View" onClick={() => onView(doc)} />
                  <ActionLink label="Edit" onClick={() => onEdit(doc)} />
                  <ActionLink label="Duplicate" onClick={() => onDuplicate(doc)} />
                  <ActionLink label="Download" onClick={() => onDownload(doc)} />
                  <ActionLink label="Delete" danger onClick={() => onDelete(doc)} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ActionLink({
  label,
  onClick,
  danger,
}: {
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`font-medium underline decoration-dotted underline-offset-2 ${
        danger ? 'text-red-500 hover:text-red-700' : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {label}
    </button>
  )
}
