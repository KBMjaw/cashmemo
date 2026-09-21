import html2canvas from 'html2canvas-pro'

export async function renderElementToCanvas(element: HTMLElement, scale = 2.5): Promise<HTMLCanvasElement> {
  return html2canvas(element, {
    scale,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  })
}

export async function downloadElementAsPng(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await renderElementToCanvas(element)
  const url = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
}

export async function elementToPngBlob(element: HTMLElement): Promise<Blob | null> {
  const canvas = await renderElementToCanvas(element)
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'))
}
