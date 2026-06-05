import { MAX_TEXT_STORE, truncateText } from './documents'
import { parsePdfBuffer } from './pdf-parse-server'

const SUPPORTED_MIME = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
])

export function isSupportedDocument(mimeType: string, fileName: string): boolean {
  const lower = fileName.toLowerCase()
  if (SUPPORTED_MIME.has(mimeType)) return true
  return lower.endsWith('.pdf') || lower.endsWith('.txt') || lower.endsWith('.md')
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const lower = fileName.toLowerCase()

  if (
    mimeType === 'text/plain' ||
    mimeType === 'text/markdown' ||
    lower.endsWith('.txt') ||
    lower.endsWith('.md')
  ) {
    return truncateText(buffer.toString('utf-8'), MAX_TEXT_STORE)
  }

  if (mimeType === 'application/pdf' || lower.endsWith('.pdf')) {
    try {
      const data = await parsePdfBuffer(buffer)
      const text = data.text?.trim() || ''
      if (!text) {
        throw new Error(
          'Could not extract text from PDF — it may be scanned/image-only'
        )
      }
      return truncateText(text, MAX_TEXT_STORE)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`PDF extraction failed: ${msg}`)
    }
  }

  throw new Error('Unsupported file type. Upload PDF, TXT, or MD files.')
}
