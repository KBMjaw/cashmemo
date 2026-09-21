import { Field, inputClass } from '../ui/Field'
import { SectionCard } from '../ui/SectionCard'

interface Props {
  footerNote: string
  onChange: (value: string) => void
}

export function FooterNoteSection({ footerNote, onChange }: Props) {
  return (
    <SectionCard title="Footer / Note (optional)">
      <Field label="Custom footer text">
        <textarea
          className={inputClass}
          rows={2}
          value={footerNote}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Thank you for your business."
        />
      </Field>
    </SectionCard>
  )
}
