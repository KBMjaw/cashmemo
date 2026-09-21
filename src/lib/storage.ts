import type { AppSettings, BusinessDocument } from '../types'
import { defaultSettings } from '../types'

const SETTINGS_KEY = 'bdm.settings.v1'
const DOCUMENTS_KEY = 'bdm.documents.v1'
const COUNTERS_KEY = 'bdm.counters.v1'

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return { ...fallback, ...JSON.parse(raw) } as T
  } catch {
    return fallback
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage unavailable or full — fail silently, app still works in-memory
  }
}

export function loadSettings(): AppSettings {
  const fallback = defaultSettings()
  const loaded = readJSON<AppSettings>(SETTINGS_KEY, fallback)
  return {
    ...fallback,
    ...loaded,
    company: { ...fallback.company, ...loaded.company },
    prefixes: { ...fallback.prefixes, ...loaded.prefixes },
  }
}

export function saveSettings(settings: AppSettings): void {
  writeJSON(SETTINGS_KEY, settings)
}

export function loadDocuments(): BusinessDocument[] {
  try {
    const raw = localStorage.getItem(DOCUMENTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveDocuments(docs: BusinessDocument[]): void {
  writeJSON(DOCUMENTS_KEY, docs)
}

export function upsertDocument(doc: BusinessDocument): BusinessDocument[] {
  const docs = loadDocuments()
  const idx = docs.findIndex((d) => d.id === doc.id)
  if (idx >= 0) {
    docs[idx] = doc
  } else {
    docs.unshift(doc)
  }
  saveDocuments(docs)
  return docs
}

export function deleteDocument(id: string): BusinessDocument[] {
  const docs = loadDocuments().filter((d) => d.id !== id)
  saveDocuments(docs)
  return docs
}

type Counters = Record<string, number>

export function loadCounters(): Counters {
  return readJSON<Counters>(COUNTERS_KEY, {})
}

export function saveCounters(counters: Counters): void {
  writeJSON(COUNTERS_KEY, counters)
}
