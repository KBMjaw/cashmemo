import jsPDF from 'jspdf'
import { renderElementToCanvas } from './exportImage'

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297

/**
 * Finds the bottom edge (in CSS px, relative to `container`'s top) of every
 * element marked as "atomic" (must not be sliced across a PDF page break) —
 * table rows, and top-level document sections.
 */
function collectSafeBreakPointsPx(container: HTMLElement): number[] {
  const containerTop = container.getBoundingClientRect().top
  const atoms = Array.from(container.querySelectorAll<HTMLElement>('.pdf-atomic'))
  const points = atoms.map((el) => el.getBoundingClientRect().bottom - containerTop)
  points.push(container.getBoundingClientRect().height)
  return Array.from(new Set(points.map((p) => Math.round(p)))).sort((a, b) => a - b)
}

/**
 * Renders `container` to a high-resolution canvas and builds a paginated A4
 * jsPDF document, choosing each page break at the nearest safe boundary (a
 * table row edge or section edge) at or before the natural page height — so
 * no row, heading, or signature block is ever cut in half across pages.
 */
async function buildPaginatedPdf(container: HTMLElement): Promise<jsPDF> {
  const breakPointsCss = collectSafeBreakPointsPx(container)
  const canvas = await renderElementToCanvas(container)

  const scaleFactor = canvas.width / container.getBoundingClientRect().width
  const pxPerMm = canvas.width / A4_WIDTH_MM
  const pageHeightPx = A4_HEIGHT_MM * pxPerMm
  // Clamp to canvas.height: html2canvas's rendered pixel height can differ
  // by a fraction of a pixel from what CSS rect * scaleFactor predicts,
  // which would otherwise make the final (correct) break point look like
  // it overshoots the page and get skipped in favor of an earlier one.
  const breakPointsCanvasPx = breakPointsCss.map((p) => Math.min(p * scaleFactor, canvas.height))

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true })

  // If what would remain after a page is negligible (a sliver caused by
  // sub-pixel rounding), fold it into the current page instead of emitting
  // an almost-blank trailing page.
  const mergeTolerancePx = pxPerMm * 3

  let currentY = 0
  let isFirstPage = true

  while (currentY < canvas.height - 1) {
    let target = Math.min(currentY + pageHeightPx, canvas.height)
    if (canvas.height - target < mergeTolerancePx) target = canvas.height

    let cut = target
    for (let i = breakPointsCanvasPx.length - 1; i >= 0; i--) {
      const candidate = breakPointsCanvasPx[i]
      if (candidate <= target + 0.5 && candidate > currentY + 1) {
        cut = candidate
        break
      }
    }
    if (cut <= currentY) cut = target

    const sliceHeightPx = Math.min(cut, canvas.height) - currentY
    if (sliceHeightPx <= 0) break

    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = sliceHeightPx
    const ctx = pageCanvas.getContext('2d')
    if (!ctx) break
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
    ctx.drawImage(
      canvas,
      0,
      currentY,
      canvas.width,
      sliceHeightPx,
      0,
      0,
      canvas.width,
      sliceHeightPx,
    )

    const imgData = pageCanvas.toDataURL('image/jpeg', 0.95)
    const sliceHeightMm = sliceHeightPx / pxPerMm

    if (!isFirstPage) pdf.addPage()
    pdf.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_MM, sliceHeightMm)
    isFirstPage = false
    currentY = cut
  }

  return pdf
}

export async function generateDocumentPdf(container: HTMLElement, filename: string): Promise<void> {
  const pdf = await buildPaginatedPdf(container)
  pdf.save(filename)
}

export async function generateDocumentPdfBlob(container: HTMLElement): Promise<Blob> {
  const pdf = await buildPaginatedPdf(container)
  return pdf.output('blob')
}
