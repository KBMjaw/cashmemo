import { useEffect, useMemo, useRef, useState } from 'react'
import type { BusinessDocument, DocumentType } from './types'
import { DOCUMENT_TITLE } from './types'
import { loadSettings, saveSettings, loadDocuments, upsertDocument, deleteDocument } from './lib/storage'
import { createNewDocument } from './lib/document'
import { generateNextDocumentNumber } from './lib/documentNumbering'
import { validateDocument } from './lib/validation'
import { generateDocumentPdf } from './lib/pdf'
import { downloadElementAsPng } from './lib/exportImage'
import { openWhatsAppShare, shareViaWebShare, copyShareText } from './lib/share'
import { newId } from './lib/id'

import { DocumentForm } from './components/form/DocumentForm'
import { DocumentPreview } from './components/preview/DocumentPreview'
import { ActionBar } from './components/ActionBar'
import { RecentDocuments } from './components/history/RecentDocuments'
import { SettingsPage } from './pages/SettingsPage'

type View = 'create' | 'history' | 'settings'
type MobileTab = 'form' | 'preview'

// 210mm at 96 CSS px/inch — the a4-page element's natural, unscaled width.
const A4_WIDTH_PX = (210 / 25.4) * 96

function App() {
  const [settings, setSettings] = useState(() => loadSettings())
  const [documents, setDocuments] = useState<BusinessDocument[]>(() => loadDocuments())
  const [doc, setDoc] = useState<BusinessDocument>(() => createNewDocument('cash-receipt', loadSettings()))

  const [view, setView] = useState<View>('create')
  const [mobileTab, setMobileTab] = useState<MobileTab>('form')
  const [busy, setBusy] = useState<string | null>(null)
  const [companySaved, setCompanySaved] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const previewRef = useRef<HTMLDivElement>(null)
  const previewOuterRef = useRef<HTMLDivElement>(null)
  const previewBoxRef = useRef<HTMLDivElement>(null)
  const pendingDownloadRef = useRef<string | null>(null)
  const [previewBoxSize, setPreviewBoxSize] = useState<{ width: number; height: number } | null>(
    null,
  )
  const [previewScale, setPreviewScale] = useState(1)

  const errors = useMemo(() => validateDocument(doc).errors, [doc])

  useEffect(() => {
    document.title = `${DOCUMENT_TITLE[doc.type]} — Business Document Maker`
  }, [doc.type])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  // Shrink the fixed-width A4 preview to fit narrow (mobile) screens, without
  // ever resizing the actual document node itself — export/print always
  // reset the transform first, so PDF/PNG/print output stays full quality.
  useEffect(() => {
    const outer = previewOuterRef.current
    const page = previewRef.current
    if (!outer || !page) return

    const recompute = () => {
      const cs = getComputedStyle(outer)
      const paddingX = parseFloat(cs.paddingLeft || '0') + parseFloat(cs.paddingRight || '0')
      const available = outer.clientWidth - paddingX
      const scale = available > 0 ? Math.min(1, available / A4_WIDTH_PX) : 1
      setPreviewScale(scale)
      page.style.transformOrigin = 'top left'
      page.style.transform = scale < 1 ? `scale(${scale})` : 'none'
      setPreviewBoxSize({ width: page.offsetWidth * scale, height: page.offsetHeight * scale })
    }

    recompute()
    const ro = new ResizeObserver(recompute)
    ro.observe(outer)
    ro.observe(page)
    return () => ro.disconnect()
  }, [doc])

  /** Runs `fn` with the preview reset to its true, unscaled size (so
   * html2canvas captures the real document, not the shrunk mobile view),
   * then restores the on-screen scale afterwards. */
  const withNaturalSize = async (fn: () => Promise<void>) => {
    const page = previewRef.current
    const prevTransform = page?.style.transform
    if (page) page.style.transform = 'none'
    await new Promise(requestAnimationFrame)
    await new Promise(requestAnimationFrame)
    try {
      await fn()
    } finally {
      if (page) page.style.transform = prevTransform ?? ''
    }
  }

  const patchDoc = (patch: Partial<BusinessDocument>) => {
    setDoc((prev) => ({ ...prev, ...patch, updatedAt: new Date().toISOString() }))
  }

  const handleTypeChange = (type: DocumentType) => {
    patchDoc({
      type,
      docNumber: generateNextDocumentNumber(type, settings.prefixes[type]),
    })
  }

  const handleRegenerateNumber = () => {
    patchDoc({ docNumber: generateNextDocumentNumber(doc.type, settings.prefixes[doc.type]) })
  }

  const handleSaveCompanyDefaults = () => {
    const next = { ...settings, company: { ...doc.company } }
    setSettings(next)
    saveSettings(next)
    setCompanySaved(true)
    setTimeout(() => setCompanySaved(false), 2000)
  }

  const handleSaveDraft = () => {
    setBusy('save')
    const saved: BusinessDocument = { ...doc, status: 'draft', updatedAt: new Date().toISOString() }
    const next = upsertDocument(saved)
    setDocuments(next)
    setDoc(saved)
    setToast('Draft saved')
    setBusy(null)
  }

  const handleNewDocument = () => {
    setDoc(createNewDocument(doc.type, settings))
    setMobileTab('form')
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPdf = async () => {
    if (!previewRef.current) return
    setBusy('pdf')
    try {
      await withNaturalSize(async () => {
        await generateDocumentPdf(previewRef.current!, `${doc.docNumber || 'document'}.pdf`)
      })
    } finally {
      setBusy(null)
    }
  }

  const handleDownloadImage = async () => {
    if (!previewRef.current) return
    setBusy('image')
    try {
      await withNaturalSize(async () => {
        await downloadElementAsPng(previewRef.current!, `${doc.docNumber || 'document'}.png`)
      })
    } finally {
      setBusy(null)
    }
  }

  const handleWhatsApp = () => {
    openWhatsAppShare(doc, doc.customer.phone)
  }

  const handleCopyLink = async () => {
    const ok = await copyShareText(doc)
    setToast(ok ? 'Share text copied' : 'Could not copy text')
  }

  const handleNativeShare = async () => {
    const ok = await shareViaWebShare(doc)
    if (!ok) setToast('Sharing not supported on this device')
  }

  const handleViewFromHistory = (d: BusinessDocument) => {
    setDoc(d)
    setView('create')
    setMobileTab('preview')
  }

  const handleEditFromHistory = (d: BusinessDocument) => {
    setDoc(d)
    setView('create')
    setMobileTab('form')
  }

  const handleDuplicate = (d: BusinessDocument) => {
    const copy: BusinessDocument = {
      ...d,
      id: newId(),
      docNumber: generateNextDocumentNumber(d.type, settings.prefixes[d.type]),
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const next = upsertDocument(copy)
    setDocuments(next)
    setDoc(copy)
    setView('create')
    setToast('Document duplicated')
  }

  const handleDeleteFromHistory = (d: BusinessDocument) => {
    if (!window.confirm(`Delete document ${d.docNumber}? This cannot be undone.`)) return
    setDocuments(deleteDocument(d.id))
  }

  const handleDownloadFromHistory = (d: BusinessDocument) => {
    pendingDownloadRef.current = d.id
    setDoc(d)
    setView('create')
    setMobileTab('preview')
  }

  useEffect(() => {
    if (pendingDownloadRef.current !== doc.id) return
    pendingDownloadRef.current = null
    const t = setTimeout(async () => {
      if (!previewRef.current) return
      setBusy('pdf')
      try {
        await withNaturalSize(async () => {
          await generateDocumentPdf(previewRef.current!, `${doc.docNumber || 'document'}.pdf`)
        })
      } finally {
        setBusy(null)
      }
    }, 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id])

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <header className="no-print flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-base font-bold text-gray-900 sm:text-lg">
            Business Document Maker
          </span>
        </div>
        <nav className="flex gap-1 rounded-md bg-gray-100 p-1 text-sm">
          {(
            [
              ['create', 'Create'],
              ['history', 'History'],
              ['settings', 'Settings'],
            ] as [View, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`rounded px-3 py-1.5 font-medium transition ${
                view === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {toast && (
        <div className="no-print fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-md bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {view === 'create' && (
        <div className="flex flex-1 flex-col">
          <ActionBar
            busy={busy}
            onSaveDraft={handleSaveDraft}
            onNewDocument={handleNewDocument}
            onPrint={handlePrint}
            onDownloadPdf={handleDownloadPdf}
            onDownloadImage={handleDownloadImage}
            onWhatsApp={handleWhatsApp}
            onCopyLink={handleCopyLink}
            onNativeShare={handleNativeShare}
            canNativeShare={canNativeShare}
          />

          <div className="no-print flex border-b border-gray-200 bg-white md:hidden">
            <button
              onClick={() => setMobileTab('form')}
              className={`flex-1 py-2 text-sm font-medium ${
                mobileTab === 'form' ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500'
              }`}
            >
              Form
            </button>
            <button
              onClick={() => setMobileTab('preview')}
              className={`flex-1 py-2 text-sm font-medium ${
                mobileTab === 'preview' ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500'
              }`}
            >
              Preview
            </button>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
            <div
              className={`thin-scroll flex-1 overflow-y-auto p-4 sm:p-6 md:max-w-xl md:border-r md:border-gray-200 ${
                mobileTab === 'preview' ? 'hidden md:block' : ''
              }`}
            >
              <DocumentForm
                doc={doc}
                onDocChange={patchDoc}
                onTypeChange={handleTypeChange}
                onRegenerateNumber={handleRegenerateNumber}
                onSaveCompanyDefaults={handleSaveCompanyDefaults}
                companySaved={companySaved}
                errors={errors}
              />
            </div>

            <div
              id="print-root"
              ref={previewOuterRef}
              className={`thin-scroll flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-8 ${
                mobileTab === 'form' ? 'hidden md:block' : ''
              }`}
            >
              <div
                ref={previewBoxRef}
                className="preview-scale-box mx-auto overflow-hidden"
                style={
                  previewScale < 1 && previewBoxSize
                    ? { width: previewBoxSize.width, height: previewBoxSize.height }
                    : undefined
                }
              >
                <DocumentPreview doc={doc} ref={previewRef} />
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'history' && (
        <div className="no-print flex-1 p-4 sm:p-6">
          <h1 className="mb-4 text-lg font-semibold text-gray-900">Recent Documents</h1>
          <RecentDocuments
            documents={documents}
            onView={handleViewFromHistory}
            onEdit={handleEditFromHistory}
            onDuplicate={handleDuplicate}
            onDownload={handleDownloadFromHistory}
            onDelete={handleDeleteFromHistory}
          />
        </div>
      )}

      {view === 'settings' && (
        <div className="no-print flex-1">
          <SettingsPage
            settings={settings}
            onSave={(s) => {
              setSettings(s)
              saveSettings(s)
              setToast('Settings saved')
            }}
          />
        </div>
      )}
    </div>
  )
}

export default App
