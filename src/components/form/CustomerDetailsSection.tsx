import type { CustomerDetails } from '../../types'
import { Field, inputClass } from '../ui/Field'
import { SectionCard } from '../ui/SectionCard'

interface Props {
  customer: CustomerDetails
  onChange: (customer: CustomerDetails) => void
}

export function CustomerDetailsSection({ customer, onChange }: Props) {
  const set = <K extends keyof CustomerDetails>(key: K, value: CustomerDetails[K]) =>
    onChange({ ...customer, [key]: value })

  return (
    <SectionCard title="Customer Details">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Customer Name">
          <input
            className={inputClass}
            value={customer.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Ramesh Kumar"
          />
        </Field>

        <Field label="Company Name">
          <input
            className={inputClass}
            value={customer.companyName}
            onChange={(e) => set('companyName', e.target.value)}
            placeholder="ABC Traders"
          />
        </Field>

        <Field label="Address" className="sm:col-span-2">
          <textarea
            className={inputClass}
            rows={2}
            value={customer.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="12, Market Street"
          />
        </Field>

        <Field label="City / Place">
          <input
            className={inputClass}
            value={customer.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="Pune"
          />
        </Field>

        <Field label="Phone Number">
          <input
            className={inputClass}
            value={customer.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+91 90000 00000"
          />
        </Field>

        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            value={customer.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="customer@example.com"
          />
        </Field>

        <Field label="GSTIN">
          <input
            className={inputClass}
            value={customer.gstin}
            onChange={(e) => set('gstin', e.target.value.toUpperCase())}
            placeholder="27AAAAA0000A1Z5"
          />
        </Field>
      </div>
    </SectionCard>
  )
}
