export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export function downloadSvgString(svg: string, filename: string) {
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export async function downloadCanvasAsPdf(canvas: HTMLCanvasElement, filename: string, label?: string) {
  const { default: jsPDF } = await import('jspdf')
  // Letter-ish square page sized around the QR with a small margin, in points.
  const margin = 36
  const size = 320
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [size + margin * 2, size + margin * 2 + (label ? 24 : 0)] })
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, margin, size, size)
  if (label) {
    pdf.setFontSize(11)
    pdf.text(label, (size + margin * 2) / 2, size + margin + 20, { align: 'center' })
  }
  pdf.save(filename)
}
