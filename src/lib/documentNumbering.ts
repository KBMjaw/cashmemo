import type { DocumentType } from '../types'
import { loadCounters, saveCounters } from './storage'

/**
 * Generates the next document number for the given type/prefix, e.g.
 * INV-2026-0001. The counter resets automatically when the year changes,
 * and is persisted in localStorage so numbers stay sequential across
 * sessions. Calling this reserves (increments) the counter — call it once
 * per new document, not on every render.
 */
export function generateNextDocumentNumber(
  type: DocumentType,
  prefix: string,
): string {
  const year = new Date().getFullYear()
  const counters = loadCounters()
  const key = `${type}:${year}`
  const next = (counters[key] ?? 0) + 1
  counters[key] = next
  saveCounters(counters)
  return `${prefix}${year}-${String(next).padStart(4, '0')}`
}

/** Peek at what the next number would be, without reserving it. */
export function peekNextDocumentNumber(
  type: DocumentType,
  prefix: string,
): string {
  const year = new Date().getFullYear()
  const counters = loadCounters()
  const key = `${type}:${year}`
  const next = (counters[key] ?? 0) + 1
  return `${prefix}${year}-${String(next).padStart(4, '0')}`
}
