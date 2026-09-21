import type { DocumentItem } from '../../types'
import { UNIT_OPTIONS } from '../../types'
import { computeItemAmountPaise } from '../../lib/calculations'
import { formatPaiseAsINR } from '../../lib/money'
import { newId } from '../../lib/id'
import { SectionCard } from '../ui/SectionCard'

interface Props {
  items: DocumentItem[]
  onChange: (items: DocumentItem[]) => void
  errors: Record<string, string>
}

export function ItemsTableSection({ items, onChange, errors }: Props) {
  const update = (id: string, patch: Partial<DocumentItem>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const addItem = () => {
    onChange([...items, { id: newId(), description: '', qty: 1, unit: 'Nos', rate: 0 }])
  }

  const removeItem = (id: string) => {
    if (items.length === 1) {
      onChange([{ ...items[0], description: '', qty: 1, rate: 0 }])
      return
    }
    onChange(items.filter((item) => item.id !== id))
  }

  return (
    <SectionCard
      title="Items / Products & Services"
      action={
        <button
          type="button"
          onClick={addItem}
          className="rounded-md bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700"
        >
          + Add Item
        </button>
      }
    >
      {errors.items && <p className="mb-2 text-xs text-red-500">{errors.items}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
              <th className="w-8 py-1.5">#</th>
              <th className="py-1.5">Description</th>
              <th className="w-16 py-1.5">Qty</th>
              <th className="w-24 py-1.5">Unit</th>
              <th className="w-24 py-1.5">Rate</th>
              <th className="w-28 py-1.5 text-right">Amount</th>
              <th className="w-8 py-1.5" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id} className="border-b border-gray-100 align-top">
                <td className="py-1.5 text-gray-500">{idx + 1}</td>
                <td className="py-1.5 pr-2">
                  <input
                    className="w-full rounded border border-gray-300 px-2 py-1 outline-none focus:border-gray-500"
                    value={item.description}
                    onChange={(e) => update(item.id, { description: e.target.value })}
                    placeholder="Website Development"
                  />
                  {errors[`item-${idx}-description`] && (
                    <p className="mt-0.5 text-xs text-red-500">
                      {errors[`item-${idx}-description`]}
                    </p>
                  )}
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    className="w-full rounded border border-gray-300 px-2 py-1 outline-none focus:border-gray-500"
                    value={item.qty}
                    onChange={(e) => update(item.id, { qty: Number(e.target.value) })}
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <select
                    className="w-full rounded border border-gray-300 px-2 py-1 outline-none focus:border-gray-500"
                    value={item.unit}
                    onChange={(e) => update(item.id, { unit: e.target.value })}
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    className="w-full rounded border border-gray-300 px-2 py-1 outline-none focus:border-gray-500"
                    value={item.rate}
                    onChange={(e) => update(item.id, { rate: Number(e.target.value) })}
                  />
                </td>
                <td className="py-1.5 text-right font-medium text-gray-800">
                  {formatPaiseAsINR(computeItemAmountPaise(item.qty, item.rate))}
                </td>
                <td className="py-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    title="Remove item"
                    className="text-gray-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}
