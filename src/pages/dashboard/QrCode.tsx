import { useState } from 'react'
import QRCode from 'qrcode'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Alert } from '@/components/ui/Alert'
import { QRGenerator } from '@/components/profile/QRGenerator'
import { useMyProfile } from '@/hooks/useProfile'
import { profileUrl } from '@/lib/supabase'

export default function QrCodePage() {
  const { data: profile } = useMyProfile()
  const [color, setColor] = useState('#0a1230')
  const [useLogo, setUseLogo] = useState(false)
  const [scanMe, setScanMe] = useState(false)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!profile) return <div className="text-navy-400">Loading…</div>

  const url = profileUrl(profile.username)
  const logoUrl = useLogo ? profile.profile_photo_url : null

  function downloadPng() {
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `${profile!.username}-qr.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  async function downloadSvg() {
    try {
      const svg = await QRCode.toString(url, {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 1,
        color: { dark: color, light: '#ffffff' },
      })
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${profile!.username}-qr.svg`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch {
      setError('QR code generation failed. Please try again.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">QR Codes</h1>
        <p className="mt-1 text-sm text-navy-500">
          Your QR always points to your permanent profile URL — update your info anytime without reprinting.
        </p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="flex flex-col items-center justify-center gap-4 py-10">
          <QRGenerator value={url} color={color} logoUrl={logoUrl} scanMeText={scanMe} size={360} onReady={setCanvas} />
          <p className="text-sm text-navy-400">{url}</p>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="font-semibold text-navy-800">Customize</h2>
          <Input label="Color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-11 p-1" />
          <Checkbox
            label="Add my profile photo as logo"
            checked={useLogo}
            disabled={!profile.profile_photo_url}
            onChange={(e) => setUseLogo(e.target.checked)}
          />
          <Checkbox label='Show "Scan Me" text' checked={scanMe} onChange={(e) => setScanMe(e.target.checked)} />

          <div className="mt-2 flex flex-col gap-2">
            <Button onClick={downloadPng}>Download PNG</Button>
            <Button variant="outline" onClick={downloadSvg}>
              Download SVG
            </Button>
          </div>
          <p className="text-xs text-navy-400">
            High error-correction is used automatically when a logo is added, so your QR stays scannable.
          </p>
        </Card>
      </div>
    </div>
  )
}
