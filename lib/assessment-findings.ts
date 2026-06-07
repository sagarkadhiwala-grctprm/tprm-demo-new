export type FindingSeverity = 'high' | 'medium' | 'low'

export interface AssessmentGapFinding {
  text: string
  severity: FindingSeverity
}

export interface NormalizedAssessmentFindings {
  strengths: string[]
  gaps: AssessmentGapFinding[]
}

/** Stored in DB: legacy string[] or { strengths, gaps }. */
export type StoredKeyFindings =
  | string[]
  | {
      strengths?: string[]
      gaps?: Array<string | AssessmentGapFinding>
    }

const GAP_SIGNAL =
  /\b(however|although|though|but|unclear|missing|lack|insufficient|gap|weak|no evidence|not documented|without specific|unverified|needs improvement|not defined|limited|inadequate|concern)\b/i

const STRENGTH_SIGNAL =
  /\b(comprehensive|excellent|robust|strong|properly|well-defined|effective|mature|established|enforcement|attestation)\b/i

/** Avoid false positives like "critical review" or "critical path". */
const HIGH_SEVERITY_SIGNAL =
  /\b(critical risk|critical gap|critical vulnerability|critical control|critically|severe|material weakness|significant deficiency|high risk)\b/i

const MEDIUM_SEVERITY_SIGNAL =
  /\b(moderate|partial|incomplete|limited evidence|should improve|recommend|unclear|missing|lack)\b/i

export function inferGapSeverity(text: string): FindingSeverity {
  const lower = text.toLowerCase()
  if (HIGH_SEVERITY_SIGNAL.test(lower)) return 'high'
  if (MEDIUM_SEVERITY_SIGNAL.test(lower)) return 'medium'
  return 'low'
}

function classifyLegacyFinding(text: string): 'strength' | 'gap' {
  const hasGap = GAP_SIGNAL.test(text)
  const hasStrength = STRENGTH_SIGNAL.test(text)
  if (hasGap && !hasStrength) return 'gap'
  if (hasStrength && !hasGap) return 'strength'
  if (hasGap && hasStrength) return 'gap'
  return 'gap'
}

function toGapFinding(entry: string | AssessmentGapFinding): AssessmentGapFinding {
  if (typeof entry === 'string') {
    return { text: entry, severity: inferGapSeverity(entry) }
  }
  return {
    text: entry.text,
    severity: entry.severity ?? inferGapSeverity(entry.text),
  }
}

export function normalizeAssessmentFindings(
  raw: unknown
): NormalizedAssessmentFindings {
  if (!raw) {
    return { strengths: [], gaps: [] }
  }

  if (Array.isArray(raw)) {
    const strengths: string[] = []
    const gaps: AssessmentGapFinding[] = []
    for (const item of raw) {
      if (typeof item !== 'string') continue
      if (classifyLegacyFinding(item) === 'strength') {
        strengths.push(item)
      } else {
        gaps.push(toGapFinding(item))
      }
    }
    return { strengths, gaps }
  }

  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as {
      strengths?: unknown
      gaps?: unknown
    }
    const strengths = Array.isArray(obj.strengths)
      ? obj.strengths.filter((s): s is string => typeof s === 'string')
      : []
    const gaps = Array.isArray(obj.gaps)
      ? obj.gaps.map((g) => toGapFinding(g as string | AssessmentGapFinding))
      : []
    return { strengths, gaps }
  }

  return { strengths: [], gaps: [] }
}

export function gapSeverityColor(severity: FindingSeverity): string {
  switch (severity) {
    case 'high':
      return 'text-danger'
    case 'medium':
      return 'text-amber-400'
    default:
      return 'text-secondary'
  }
}

export function gapSeverityIconColor(severity: FindingSeverity): string {
  switch (severity) {
    case 'high':
      return 'text-danger'
    case 'medium':
      return 'text-amber-400'
    default:
      return 'text-secondary'
  }
}
