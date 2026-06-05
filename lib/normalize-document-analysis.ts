import { DocumentAnalysisResult } from './documents'

const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical'] as const

function normalizeRisk(value: unknown): DocumentAnalysisResult['overallDocumentRisk'] {
  if (typeof value !== 'string') return 'Medium'
  const match = RISK_LEVELS.find(
    (r) => r.toLowerCase() === value.toLowerCase()
  )
  return match ?? 'Medium'
}

export function normalizeDocumentAnalysis(
  raw: unknown
): DocumentAnalysisResult {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>

  const complianceChecks = Array.isArray(r.complianceChecks)
    ? r.complianceChecks.map((c) => {
        const item = c as Record<string, unknown>
        const status = String(item.status ?? 'unknown').toLowerCase()
        const validStatus =
          status === 'pass' ||
          status === 'fail' ||
          status === 'warning' ||
          status === 'unknown'
            ? status
            : 'unknown'
        return {
          check: String(item.check ?? 'Compliance check'),
          status: validStatus as 'pass' | 'fail' | 'warning' | 'unknown',
          details: String(item.details ?? ''),
        }
      })
    : []

  const riskFlags = Array.isArray(r.riskFlags)
    ? r.riskFlags.map((f) => {
        const item = f as Record<string, unknown>
        return {
          severity: normalizeRisk(item.severity),
          category: String(item.category ?? 'Other'),
          finding: String(item.finding ?? ''),
          evidence: String(item.evidence ?? ''),
        }
      })
    : []

  return {
    documentTypeDetected: String(r.documentTypeDetected ?? 'Unknown'),
    isRelevant: Boolean(r.isRelevant ?? true),
    relevanceScore:
      typeof r.relevanceScore === 'number' ? r.relevanceScore : 0,
    summary: String(r.summary ?? 'No summary available.'),
    complianceChecks,
    riskFlags,
    extractedFacts: Array.isArray(r.extractedFacts)
      ? r.extractedFacts.map(String)
      : [],
    questionnaireHints: Array.isArray(r.questionnaireHints)
      ? r.questionnaireHints.map(String)
      : [],
    overallDocumentRisk: normalizeRisk(r.overallDocumentRisk),
    recommendedActions: Array.isArray(r.recommendedActions)
      ? r.recommendedActions.map(String)
      : [],
  }
}
