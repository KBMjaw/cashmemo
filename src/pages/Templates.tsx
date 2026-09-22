import { Card } from '@/components/ui/Card'
import { useSeo } from '@/hooks/useSeo'
import { CARD_TEMPLATES } from '@/lib/cardTemplates'

export default function Templates() {
  useSeo({ title: 'Business Card Templates | One-Tap', description: 'Professionally designed business card templates for One-Tap.' })
  return (
    <div className="container-app py-20">
      <h1 className="text-center text-4xl font-bold text-navy-900">Business Card Templates</h1>
      <p className="mx-auto mt-4 max-w-xl text-center text-navy-500">
        Every card links back to your live One-Tap profile via QR — no reprinting when your details change.
      </p>
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {CARD_TEMPLATES.map((t) => (
          <Card key={t.id} className="flex flex-col gap-3">
            <div
              className="flex aspect-[7/4] w-full items-center justify-center rounded-lg text-sm font-medium"
              style={{ background: t.previewBackground, color: t.previewText }}
            >
              {t.name}
            </div>
            <div>
              <p className="font-semibold text-navy-800">{t.name}</p>
              <p className="text-sm text-navy-500">{t.description}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
