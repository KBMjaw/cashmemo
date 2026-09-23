import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Alert } from '@/components/ui/Alert'
import { cn } from '@/utils/cn'
import { CARD_TEMPLATES } from '@/lib/cardTemplates'
import { renderCard, canvasToBlob, CARD_WIDTH_IN, CARD_HEIGHT_IN, type CardFields } from '@/lib/cardRenderer'
import { useMyProfile } from '@/hooks/useProfile'
import { useBusinesses } from '@/hooks/useBusinesses'
import { supabase, STORAGE_BUCKETS, profileUrl } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { friendlyError } from '@/lib/errors'
import type { BusinessCard } from '@/types/database'

export default function CardNew() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [params] = useSearchParams()
  const editId = params.get('id')
  const requestedTemplate = params.get('template')
  const initialTemplateId = CARD_TEMPLATES.some((t) => t.id === requestedTemplate)
    ? (requestedTemplate as string)
    : CARD_TEMPLATES[0].id

  const { data: profile } = useMyProfile()
  const { data: businesses = [] } = useBusinesses()
  const primaryBusiness = businesses.find((b) => b.is_primary) ?? businesses[0]

  const [templateId, setTemplateId] = useState(initialTemplateId)
  const [fields, setFields] = useState<CardFields>({
    name: '',
    designation: '',
    company: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    includeQr: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadedExisting, setLoadedExisting] = useState(!editId)
  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

  // Prefill from profile/primary business once available.
  useEffect(() => {
    if (!profile || loadedExisting) return
    setFields((f) => ({
      ...f,
      name: f.name || profile.professional_name || profile.full_name,
      designation: f.designation || profile.professional_title || '',
      company: f.company || primaryBusiness?.name || '',
      phone: f.phone || profile.phone || '',
      email: f.email || (profile.show_email ? profile.email : ''),
      website: f.website || profile.website || primaryBusiness?.website || '',
      address: f.address || primaryBusiness?.address || profile.location || '',
    }))
  }, [profile, primaryBusiness, loadedExisting])

  // Load existing card for editing.
  useEffect(() => {
    if (!editId) return
    supabase
      .from('business_cards')
      .select('*')
      .eq('id', editId)
      .single()
      .then(({ data }) => {
        if (data) {
          const card = data as BusinessCard
          setTemplateId(card.template_id)
          setFields((card.design_data as unknown as CardFields) ?? fields)
        }
        setLoadedExisting(true)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId])

  useEffect(() => {
    if (!profile) return
    let cancelled = false
    renderCard(templateId, fields, profileUrl(profile.username)).then((c) => {
      if (cancelled) return
      setCanvas(c)
      const wrap = canvasWrapRef.current
      if (wrap) {
        wrap.innerHTML = ''
        c.style.width = '100%'
        c.style.borderRadius = '12px'
        wrap.appendChild(c)
      }
    })
    return () => {
      cancelled = true
    }
  }, [templateId, fields, profile])

  function updateField<K extends keyof CardFields>(key: K, value: CardFields[K]) {
    setFields((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    if (!user || !canvas) return
    setSaving(true)
    setError(null)
    try {
      const blob = await canvasToBlob(canvas, 'image/png')
      const path = `${user.id}/${crypto.randomUUID()}.png`
      await supabase.storage.from(STORAGE_BUCKETS.card).upload(path, blob, { upsert: true })
      const { data: pub } = supabase.storage.from(STORAGE_BUCKETS.card).getPublicUrl(path)

      if (editId) {
        const { error: err } = await supabase
          .from('business_cards')
          .update({ template_id: templateId, name: fields.name || 'My Card', design_data: fields, preview_url: pub.publicUrl })
          .eq('id', editId)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('business_cards').insert({
          user_id: user.id,
          template_id: templateId,
          name: fields.name || 'My Card',
          design_data: fields,
          preview_url: pub.publicUrl,
        })
        if (err) throw err
      }
      navigate('/dashboard/cards')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  async function downloadPng() {
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'business-card.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  async function downloadJpg() {
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'business-card.jpg'
    link.href = canvas.toDataURL('image/jpeg', 0.95)
    link.click()
  }

  async function downloadPdf() {
    if (!canvas) return
    const { default: jsPDF } = await import('jspdf')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'in', format: [CARD_WIDTH_IN, CARD_HEIGHT_IN] })
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, CARD_WIDTH_IN, CARD_HEIGHT_IN)
    pdf.save('business-card.pdf')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{editId ? 'Edit business card' : 'Create a business card'}</h1>
        <p className="mt-1 text-sm text-navy-500">The QR on your card always links to your live One-Tap profile.</p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-4">
          <div ref={canvasWrapRef} className="overflow-hidden rounded-xl2 shadow-card" />
          <div className="flex flex-wrap gap-3">
            {CARD_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplateId(t.id)}
                className={cn(
                  'rounded-lg border-2 px-3 py-1.5 text-sm font-medium capitalize',
                  templateId === t.id ? 'border-brand-500 text-brand-700' : 'border-navy-100 text-navy-500',
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <Card className="flex flex-col gap-3">
          <Input label="Name" value={fields.name} onChange={(e) => updateField('name', e.target.value)} />
          <Input label="Designation" value={fields.designation} onChange={(e) => updateField('designation', e.target.value)} />
          <Input label="Company" value={fields.company} onChange={(e) => updateField('company', e.target.value)} />
          <Input label="Phone" value={fields.phone} onChange={(e) => updateField('phone', e.target.value)} />
          <Input label="Email" value={fields.email} onChange={(e) => updateField('email', e.target.value)} />
          <Input label="Website" value={fields.website} onChange={(e) => updateField('website', e.target.value)} />
          <Input label="Address" value={fields.address} onChange={(e) => updateField('address', e.target.value)} />
          <Checkbox
            label="Include QR code linking to my profile"
            checked={fields.includeQr}
            onChange={(e) => updateField('includeQr', e.target.checked)}
          />

          <div className="mt-2 flex flex-col gap-2">
            <Button onClick={handleSave} loading={saving}>
              Save card
            </Button>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" onClick={downloadPng}>
                PNG
              </Button>
              <Button variant="outline" size="sm" onClick={downloadJpg}>
                JPG
              </Button>
              <Button variant="outline" size="sm" onClick={downloadPdf}>
                PDF
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
