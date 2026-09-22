import QRCode from 'qrcode'
import { getTemplate } from '@/lib/cardTemplates'

export interface CardFields {
  name: string
  designation: string
  company: string
  phone: string
  email: string
  website: string
  address: string
  includeQr: boolean
}

// 3.5 x 2 inches at 300 DPI, print-ready.
export const CARD_WIDTH_PX = 1050
export const CARD_HEIGHT_PX = 600
export const CARD_WIDTH_IN = 3.5
export const CARD_HEIGHT_IN = 2

export async function renderCard(
  templateId: string,
  fields: CardFields,
  profileUrl: string,
): Promise<HTMLCanvasElement> {
  const template = getTemplate(templateId)
  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH_PX
  canvas.height = CARD_HEIGHT_PX
  const ctx = canvas.getContext('2d')!

  const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH_PX, CARD_HEIGHT_PX)
  gradient.addColorStop(0, template.bg[0])
  gradient.addColorStop(1, template.bg[1])
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, CARD_WIDTH_PX, CARD_HEIGHT_PX)

  ctx.fillStyle = template.accentColor
  ctx.fillRect(0, CARD_HEIGHT_PX - 14, CARD_WIDTH_PX, 14)

  const padX = 64
  let y = 130

  ctx.fillStyle = template.textColor
  ctx.font = '700 46px Inter, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(fields.name || 'Your Name', padX, y)

  y += 42
  ctx.fillStyle = template.accentColor
  ctx.font = '600 26px Inter, sans-serif'
  ctx.fillText(fields.designation || 'Your Title', padX, y)

  if (fields.company) {
    y += 34
    ctx.fillStyle = template.mutedColor
    ctx.font = '500 24px Inter, sans-serif'
    ctx.fillText(fields.company, padX, y)
  }

  const contactLines = [fields.phone, fields.email, fields.website, fields.address].filter(Boolean)
  let cy = CARD_HEIGHT_PX - 60 - (contactLines.length - 1) * 30
  ctx.font = '500 22px Inter, sans-serif'
  ctx.fillStyle = template.textColor
  for (const line of contactLines) {
    ctx.fillText(line, padX, cy)
    cy += 30
  }

  if (fields.includeQr) {
    const qrSize = 220
    const qrDataUrl = await QRCode.toDataURL(profileUrl, {
      width: qrSize,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: template.id === 'minimal' ? template.textColor : '#0a1230', light: '#ffffff' },
    })
    const img = await loadImage(qrDataUrl)
    const qx = CARD_WIDTH_PX - qrSize - 56
    const qy = (CARD_HEIGHT_PX - qrSize) / 2
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.roundRect(qx - 14, qy - 14, qrSize + 28, qrSize + 28, 16)
    ctx.fill()
    ctx.drawImage(img, qx, qy, qrSize, qrSize)
  }

  return canvas
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality = 0.95): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Export failed'))), type, quality)
  })
}
