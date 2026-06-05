import { normalizeDocumentAnalysis } from './normalize-document-analysis'

export const DOCUMENT_TYPES = [
  'SOC 2 Type II Report',
  'HITRUST Certification',
  'ISO 27001 Certificate / SoA',
  'Penetration Test Report',
  'Security / Privacy Policy',
  'Business Continuity / DR Plan',
  'Cyber Insurance / COI',
  'Vendor Risk Questionnaire (completed)',
  'Other Compliance Document',
] as const

export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024 // 4MB
export const MAX_TEXT_STORE = 80_000
export const MAX_TEXT_FOR_AI = 14_000

export interface ComplianceCheck {
  check: string
  status: 'pass' | 'fail' | 'warning' | 'unknown'
  details: string
}

export interface DocumentRiskFlag {
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  category: string
  finding: string
  evidence: string
}

export interface DocumentAnalysisResult {
  documentTypeDetected: string
  isRelevant: boolean
  relevanceScore: number
  summary: string
  complianceChecks: ComplianceCheck[]
  riskFlags: DocumentRiskFlag[]
  extractedFacts: string[]
  questionnaireHints: string[]
  overallDocumentRisk: 'Low' | 'Medium' | 'High' | 'Critical'
  recommendedActions: string[]
}

export interface VendorDocumentResponse {
  id: string
  vendorId: string
  fileName: string
  mimeType: string
  documentType: string
  fileSize: number
  status: string
  overallRisk: string | null
  createdAt: string
  aiAnalysis?: DocumentAnalysisResult | null
}

export function truncateText(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max) + '\n\n[... content truncated for processing ...]'
}

export function parseDocumentAnalysis(raw: string | null): DocumentAnalysisResult | null {
  if (!raw) return null
  try {
    return normalizeDocumentAnalysis(JSON.parse(raw))
  } catch {
    return null
  }
}

export function buildDocumentContextForPrompt(
  docs: { fileName: string; documentType: string; aiAnalysis: string | null }[]
): string {
  const analyzed = docs
    .map((d) => {
      const analysis = parseDocumentAnalysis(d.aiAnalysis)
      if (!analysis) return null
      const flags = analysis.riskFlags
        .map((f) => `[${f.severity}] ${f.finding}`)
        .join('; ')
      return `Document: ${d.fileName} (${d.documentType})
Summary: ${analysis.summary}
Overall doc risk: ${analysis.overallDocumentRisk}
Key facts: ${analysis.extractedFacts.slice(0, 8).join(' | ')}
Risk flags: ${flags || 'None noted'}
Compliance: ${analysis.complianceChecks
        .filter((c) => c.status === 'fail' || c.status === 'warning')
        .map((c) => `${c.check} (${c.status}): ${c.details}`)
        .join('; ') || 'No failures noted'}`
    })
    .filter(Boolean)

  if (!analyzed.length) return ''
  return `\n\nVendor compliance document intelligence:\n${analyzed.join('\n\n---\n\n')}`
}
