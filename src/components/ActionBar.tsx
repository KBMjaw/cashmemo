import { useState } from 'react'

interface Props {
  busy: string | null
  onSaveDraft: () => void
  onNewDocument: () => void
  onPrint: () => void
  onDownloadPdf: () => void
  onDownloadImage: () => void
  onWhatsApp: () => void
  onCopyLink: () => void
  onNativeShare: () => void
  canNativeShare: boolean
}

export function ActionBar({
  busy,
  onSaveDraft,
  onNewDocument,
  onPrint,
  onDownloadPdf,
  onDownloadImage,
  onWhatsApp,
  onCopyLink,
  onNativeShare,
  canNativeShare,
}: Props) {
  const [shareOpen, setShareOpen] = useState(false)

  const btn =
    'rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50'
  const primaryBtn =
    'rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50'

  return (
    <div className="no-print flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-4 py-2.5">
      <button className={btn} onClick={onNewDocument}>
        New Document
      </button>
      <button className={btn} onClick={onSaveDraft} disabled={busy === 'save'}>
        {busy === 'save' ? 'Saving…' : 'Save Draft'}
      </button>
      <button className={btn} onClick={onPrint}>
        Print
      </button>
      <button className={btn} onClick={onDownloadPdf} disabled={busy === 'pdf'}>
        {busy === 'pdf' ? 'Generating…' : 'Download PDF'}
      </button>
      <button className={btn} onClick={onDownloadImage} disabled={busy === 'image'}>
        {busy === 'image' ? 'Generating…' : 'Download Image'}
      </button>
      <button className={primaryBtn} onClick={onWhatsApp}>
        WhatsApp
      </button>

      <div className="relative">
        <button className={btn} onClick={() => setShareOpen((v) => !v)}>
          Share ▾
        </button>
        {shareOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShareOpen(false)} />
            <div className="absolute right-0 z-20 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
              {canNativeShare && (
                <MenuItem
                  label="Share…"
                  onClick={() => {
                    onNativeShare()
                    setShareOpen(false)
                  }}
                />
              )}
              <MenuItem
                label="Copy Share Text"
                onClick={() => {
                  onCopyLink()
                  setShareOpen(false)
                }}
              />
              <MenuItem
                label="WhatsApp"
                onClick={() => {
                  onWhatsApp()
                  setShareOpen(false)
                }}
              />
              <MenuItem
                label="Download PDF"
                onClick={() => {
                  onDownloadPdf()
                  setShareOpen(false)
                }}
              />
              <MenuItem
                label="Download Image"
                onClick={() => {
                  onDownloadImage()
                  setShareOpen(false)
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
    >
      {label}
    </button>
  )
}
