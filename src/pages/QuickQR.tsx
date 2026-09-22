import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { QRGenerator } from '@/components/profile/QRGenerator'
import { useSeo } from '@/hooks/useSeo'
import { useAuth } from '@/hooks/useAuth'
import { createShortLink, loadQuickQrHistory, saveQuickQrHistoryItem, type ShortLinkResult, type QuickQrHistoryItem } from '@/lib/shortLinks'
import { downloadCanvasAsPdf, downloadCanvasAsPng, downloadSvgString } from '@/lib/qrDownload'
import { isValidHttpUrl } from '@/utils/shortLink'
import { friendlyError } from '@/lib/errors'
import QRCode from 'qrcode'

export default function QuickQR() {
  useSeo({
    title: 'Quick QR | One-Tap',
    description: 'Turn any link into a short One-Tap URL and QR code — no signup required.',
  })

  const { user } = useAuth()
  const [inputUrl, setInputUrl] = useState('')
  const [result, setResult] = useState<ShortLinkResult | null>(null)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<QuickQrHistoryItem[]>([])

  useEffect(() => {
    setHistory(loadQuickQrHistory())
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmed = inputUrl.trim()
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    if (!isValidHttpUrl(withScheme)) {
      setError('Please enter a valid http:// or https:// URL.')
      return
    }

    setLoading(true)
    try {
      const created = await createShortLink(withScheme, user?.id)
      setResult(created)
      const item: QuickQrHistoryItem = {
        code: created.code,
        shortUrl: created.shortUrl,
        targetUrl: created.targetUrl,
        createdAt: new Date().toISOString(),
      }
      saveQuickQrHistoryItem(item)
      setHistory(loadQuickQrHistory())
    } catch (err) {
      setError(friendlyError(err, 'Could not generate a short link. Please check the URL and try again.'))
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    if (!result) return
    navigator.clipboard.writeText(result.shortUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleShare() {
    if (!result) return
    if (navigator.share) {
      try {
        await navigator.share({ title: 'One-Tap short link', url: result.shortUrl })
      } catch {
        // User cancelled the share sheet — nothing to do.
      }
    } else {
      handleCopy()
    }
  }

  function downloadPng() {
    if (!canvas || !result) return
    downloadCanvasAsPng(canvas, `${result.code}-qr.png`)
  }

  async function downloadSvg() {
    if (!result) return
    const svg = await QRCode.toString(result.shortUrl, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' })
    downloadSvgString(svg, `${result.code}-qr.svg`)
  }

  async function downloadPdf() {
    if (!canvas || !result) return
    await downloadCanvasAsPdf(canvas, `${result.code}-qr.pdf`, result.shortUrl)
  }

  function reset() {
    setResult(null)
    setInputUrl('')
    setError(null)
  }

  return (
    <div className="container-app max-w-2xl py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-navy-900">Quick QR</h1>
        <p className="mt-2 text-navy-500">
          Paste any link, get a short One-Tap URL and a QR code instantly. No account required.
        </p>
      </div>

      <Card className="mt-8">
        {!result ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {error && <Alert tone="error">{error}</Alert>}
            <Input
              label="Existing URL"
              required
              placeholder="https://example.com/very-long-business-profile?id=12345"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
            />
            <Button type="submit" loading={loading} disabled={!inputUrl.trim()}>
              Generate Short Link & QR
            </Button>
          </form>
        ) : (
          <div className="flex flex-col items-center gap-5 text-center">
            <QRGenerator value={result.shortUrl} size={280} onReady={setCanvas} />

            <div className="w-full rounded-lg bg-navy-50 px-4 py-3">
              <p className="truncate text-sm font-semibold text-brand-700">{result.shortUrl}</p>
              <p className="mt-1 truncate text-xs text-navy-400">→ {result.targetUrl}</p>
              {!result.persisted && (
                <p className="mt-1 text-xs text-amber-600">
                  Generated without a backend connection — this link still works everywhere, it just isn&apos;t
                  listed centrally.
                </p>
              )}
            </div>

            <div className="grid w-full grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button variant="outline" onClick={handleShare}>
                Share
              </Button>
            </div>
            <div className="grid w-full grid-cols-3 gap-2">
              <Button variant="outline" size="sm" onClick={downloadPng}>
                PNG
              </Button>
              <Button variant="outline" size="sm" onClick={downloadSvg}>
                SVG
              </Button>
              <Button variant="outline" size="sm" onClick={downloadPdf}>
                PDF
              </Button>
            </div>

            <Button variant="ghost" onClick={reset}>
              Create another
            </Button>
          </div>
        )}
      </Card>

      {history.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-400">Recent on this device</h2>
          <div className="flex flex-col gap-2">
            {history.map((item) => (
              <Card key={item.code} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-brand-700">{item.shortUrl}</p>
                  <p className="truncate text-xs text-navy-400">{item.targetUrl}</p>
                </div>
                <a href={item.shortUrl} target="_blank" rel="noreferrer" className="shrink-0 text-sm font-medium text-navy-500 hover:text-brand-600">
                  Open ↗
                </a>
              </Card>
            ))}
          </div>
        </div>
      )}

      <p className="mt-10 text-center text-sm text-navy-400">
        Want a permanent identity instead of a one-off link?{' '}
        <Link to="/signup" className="font-medium text-brand-600 hover:underline">
          Create your One-Tap profile
        </Link>
      </p>
    </div>
  )
}
