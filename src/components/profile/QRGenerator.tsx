import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Spinner } from '@/components/ui/Spinner'

interface QRGeneratorProps {
  value: string
  color?: string
  logoUrl?: string | null
  scanMeText?: boolean
  size?: number
  onReady?: (canvas: HTMLCanvasElement) => void
}

export function QRGenerator({ value, color = '#0a1230', logoUrl, scanMeText, size = 360, onReady }: QRGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rendering, setRendering] = useState(true)

  useEffect(() => {
    let cancelled = false
    const canvas = canvasRef.current
    if (!canvas) return

    async function render() {
      setRendering(true)
      const padding = scanMeText ? 40 : 0
      const qrSize = size - padding
      const offCanvas = document.createElement('canvas')

      await QRCode.toCanvas(offCanvas, value, {
        width: qrSize,
        margin: 1,
        errorCorrectionLevel: logoUrl ? 'H' : 'M',
        color: { dark: color, light: '#ffffff' },
      })

      if (cancelled || !canvas) return
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(offCanvas, (size - qrSize) / 2, 0)

      if (logoUrl) {
        await new Promise<void>((resolve) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            const logoSize = qrSize * 0.22
            const cx = size / 2 - logoSize / 2
            const cy = (qrSize - logoSize) / 2
            ctx.fillStyle = '#ffffff'
            ctx.beginPath()
            ctx.roundRect(cx - 6, cy - 6, logoSize + 12, logoSize + 12, 10)
            ctx.fill()
            ctx.drawImage(img, cx, cy, logoSize, logoSize)
            resolve()
          }
          img.onerror = () => resolve()
          img.src = logoUrl
        })
      }

      if (scanMeText) {
        ctx.fillStyle = color
        ctx.font = '600 18px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('SCAN ME', size / 2, size - 12)
      }

      if (!cancelled) {
        setRendering(false)
        onReady?.(canvas)
      }
    }

    render()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, color, logoUrl, scanMeText, size])

  return (
    <div className="relative inline-block">
      <canvas ref={canvasRef} className="rounded-lg" />
      {rendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
          <Spinner className="h-6 w-6 text-brand-600" />
        </div>
      )}
    </div>
  )
}
