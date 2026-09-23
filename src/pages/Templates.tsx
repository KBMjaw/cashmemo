import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useSeo } from '@/hooks/useSeo'
import { CARD_TEMPLATES } from '@/lib/cardTemplates'

export default function Templates() {
  useSeo({ title: 'Business Card Templates | One-Tap', description: 'Professionally designed business card templates for One-Tap.' })
  const navigate = useNavigate()

  function selectTemplate(templateId: string) {
    navigate(`/dashboard/cards/new?template=${templateId}`)
  }

  return (
    <div className="container-app py-20">
      <h1 className="text-center text-4xl font-bold text-navy-900">Business Card Templates</h1>
      <p className="mx-auto mt-4 max-w-xl text-center text-navy-500">
        Every card links back to your live One-Tap profile via QR — no reprinting when your details change. Pick a
        template to start customizing.
      </p>
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {CARD_TEMPLATES.map((t) => (
          <Card key={t.id} className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => selectTemplate(t.id)}
              aria-label={`Use the ${t.name} template`}
              className="group relative flex aspect-[7/4] w-full items-center justify-center overflow-hidden rounded-lg text-sm font-medium outline-none ring-brand-500 ring-offset-2 transition-transform focus-visible:ring-2 hover:scale-[1.02]"
              style={{ background: t.previewBackground, color: t.previewText }}
            >
              {t.name}
              <span className="absolute inset-0 flex items-center justify-center bg-navy-950/0 opacity-0 transition-all group-hover:bg-navy-950/40 group-hover:opacity-100">
                <span className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-navy-900">
                  Use this template
                </span>
              </span>
            </button>
            <div>
              <p className="font-semibold text-navy-800">{t.name}</p>
              <p className="text-sm text-navy-500">{t.description}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => selectTemplate(t.id)} className="self-start">
              Use this template
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
