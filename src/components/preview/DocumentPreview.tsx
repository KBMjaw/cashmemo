import { forwardRef } from 'react'
import type { BusinessDocument } from '../../types'
import { DOCUMENT_TITLE } from '../../types'
import { calculateDocumentTotals } from '../../lib/calculations'
import { formatINR, formatPaiseAsINR, fromPaise } from '../../lib/money'
import { amountToIndianWords } from '../../lib/numberToWords'

interface Props {
  doc: BusinessDocument
}

function formatDate(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}-${m}-${y}`
}

const showCustomerBlock = (doc: BusinessDocument) => {
  const c = doc.customer
  return c.name || c.companyName || c.address || c.city || c.phone || c.email || c.gstin
}

export const DocumentPreview = forwardRef<HTMLDivElement, Props>(({ doc }, ref) => {
  const totals = calculateDocumentTotals({
    items: doc.items,
    discountType: doc.discountType,
    discountValue: doc.discountValue,
    gstEnabled: doc.gstEnabled,
    gstPercent: doc.gstPercent,
    taxMode: doc.taxMode,
    roundOffEnabled: doc.roundOffEnabled,
  })

  const grandTotalRupees = fromPaise(totals.grandTotalPaise)
  const amountInWords = amountToIndianWords(grandTotalRupees)

  return (
    <div ref={ref} id="document-preview-root" className="a4-page mx-auto text-[13px] leading-snug">
      {/* Header + Doc meta + Customer block kept together */}
      <div className="pdf-atomic px-10 pt-9">
        <div className="flex items-start gap-4">
          {doc.company.logoDataUrl ? (
            <img
              src={doc.company.logoDataUrl}
              alt="logo"
              className="h-16 w-16 shrink-0 object-contain"
            />
          ) : (
            <div className="h-16 w-16 shrink-0" />
          )}
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-900">
              {doc.company.name || 'Your Company Name'}
            </h1>
            <p className="mt-1 text-gray-600">
              {[doc.company.address, doc.company.city].filter(Boolean).join(', ')}
            </p>
            <p className="text-gray-600">
              {[doc.company.phone, doc.company.email, doc.company.website]
                .filter(Boolean)
                .join('  |  ')}
            </p>
            {doc.company.gstin && (
              <p className="text-gray-600">GSTIN: {doc.company.gstin}</p>
            )}
          </div>
          <div className="h-16 w-16 shrink-0" />
        </div>

        <div className="mt-4 border-y-2 border-gray-900 py-1.5 text-center text-lg font-bold tracking-[0.25em] text-gray-900">
          {DOCUMENT_TITLE[doc.type]}
        </div>

        <div className="mt-3 flex flex-wrap justify-between gap-2 text-gray-800">
          <div>
            <span className="text-gray-500">Document No: </span>
            <span className="font-semibold">{doc.docNumber || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Date: </span>
            <span className="font-semibold">{formatDate(doc.date)}</span>
          </div>
          {doc.dueDate && (
            <div>
              <span className="text-gray-500">Due Date: </span>
              <span className="font-semibold">{formatDate(doc.dueDate)}</span>
            </div>
          )}
          {doc.placeOfSupply && (
            <div>
              <span className="text-gray-500">Place of Supply: </span>
              <span className="font-semibold">{doc.placeOfSupply}</span>
            </div>
          )}
        </div>

        {showCustomerBlock(doc) && (
          <div className="mt-3 rounded border border-gray-300 px-3 py-2">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Bill To
            </p>
            {doc.customer.name && (
              <p className="font-semibold text-gray-900">{doc.customer.name}</p>
            )}
            {doc.customer.companyName && <p>{doc.customer.companyName}</p>}
            {(doc.customer.address || doc.customer.city) && (
              <p>{[doc.customer.address, doc.customer.city].filter(Boolean).join(', ')}</p>
            )}
            {doc.customer.phone && <p>Phone: {doc.customer.phone}</p>}
            {doc.customer.email && <p>Email: {doc.customer.email}</p>}
            {doc.customer.gstin && <p>GSTIN: {doc.customer.gstin}</p>}
          </div>
        )}
      </div>

      {/* Items table */}
      <div className="pdf-atomic mt-4 px-10">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="border border-gray-400 px-2 py-1.5 text-left">S.No.</th>
              <th className="border border-gray-400 px-2 py-1.5 text-left">
                Description of Work / Particular
              </th>
              <th className="border border-gray-400 px-2 py-1.5 text-right">Qty</th>
              <th className="border border-gray-400 px-2 py-1.5 text-left">Unit</th>
              <th className="border border-gray-400 px-2 py-1.5 text-right">Rate</th>
              <th className="border border-gray-400 px-2 py-1.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {totals.items.map((item, idx) => (
              <tr key={item.id} className="pdf-atomic">
                <td className="border border-gray-300 px-2 py-1.5 align-top">{idx + 1}</td>
                <td className="border border-gray-300 px-2 py-1.5 align-top">
                  {item.description || <span className="text-gray-300">—</span>}
                </td>
                <td className="border border-gray-300 px-2 py-1.5 text-right align-top">
                  {item.qty}
                </td>
                <td className="border border-gray-300 px-2 py-1.5 align-top">{item.unit}</td>
                <td className="border border-gray-300 px-2 py-1.5 text-right align-top">
                  {formatINR(item.rate)}
                </td>
                <td className="border border-gray-300 px-2 py-1.5 text-right align-top font-medium">
                  {formatPaiseAsINR(item.amountPaise)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals + words + signatures + footer, kept together where possible */}
      <div className="pdf-atomic px-10 pb-10 pt-4">
        <div className="ml-auto w-full max-w-[280px] text-[12.5px]">
          <Row label="Subtotal" value={formatPaiseAsINR(totals.subtotalPaise)} />
          {totals.discountPaise > 0 && (
            <Row label="Discount" value={`- ${formatPaiseAsINR(totals.discountPaise)}`} />
          )}
          {doc.gstEnabled && (
            <>
              <Row label="Taxable Amount" value={formatPaiseAsINR(totals.taxablePaise)} />
              {doc.taxMode === 'intra' ? (
                <>
                  <Row
                    label={`CGST (${(doc.gstPercent / 2).toFixed(2).replace(/\.00$/, '')}%)`}
                    value={formatPaiseAsINR(totals.cgstPaise)}
                  />
                  <Row
                    label={`SGST (${(doc.gstPercent / 2).toFixed(2).replace(/\.00$/, '')}%)`}
                    value={formatPaiseAsINR(totals.sgstPaise)}
                  />
                </>
              ) : (
                <Row label={`IGST (${doc.gstPercent}%)`} value={formatPaiseAsINR(totals.igstPaise)} />
              )}
            </>
          )}
          {doc.roundOffEnabled && totals.roundOffPaise !== 0 && (
            <Row
              label="Round Off"
              value={`${totals.roundOffPaise > 0 ? '+ ' : '- '}${formatPaiseAsINR(
                Math.abs(totals.roundOffPaise),
              )}`}
            />
          )}
          <div className="mt-1 flex justify-between border-t-2 border-gray-900 pt-1.5 text-sm font-bold text-gray-900">
            <span>TOTAL</span>
            <span>{formatPaiseAsINR(totals.grandTotalPaise)}</span>
          </div>
        </div>

        <div className="mt-4 border-t border-dashed border-gray-300 pt-3">
          <p className="text-gray-500">
            <span className="text-[11px] font-semibold uppercase tracking-wide">
              Amount in Words:{' '}
            </span>
            <span className="font-medium text-gray-800">{amountInWords}</span>
          </p>
        </div>

        {doc.footerNote && (
          <p className="mt-3 text-center text-gray-500 italic">{doc.footerNote}</p>
        )}

        <div className="mt-12 flex items-end justify-between">
          <div className="w-48 border-t border-gray-500 pt-1 text-center text-gray-600">
            Customer Signature
          </div>
          <div className="w-48 border-t border-gray-500 pt-1 text-center text-gray-600">
            {doc.company.authorizedPerson && (
              <p className="mb-6 font-medium text-gray-800">{doc.company.authorizedPerson}</p>
            )}
            Authorized Signature
          </div>
        </div>
      </div>
    </div>
  )
})

DocumentPreview.displayName = 'DocumentPreview'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5 text-gray-700">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
