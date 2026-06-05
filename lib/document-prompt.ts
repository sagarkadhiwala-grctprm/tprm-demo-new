import { MAX_TEXT_FOR_AI, truncateText } from './documents'

export function buildDocumentAnalysisPrompt(
  fileName: string,
  declaredType: string,
  extractedText: string
): string {
  const text = truncateText(extractedText, MAX_TEXT_FOR_AI)

  return `You are a senior Third Party Risk Management (TPRM) analyst reviewing vendor compliance documentation.

Document file name: ${fileName}
Vendor-declared document type: ${declaredType}

Extracted document text:
---
${text}
---

Perform a thorough TPRM document review. Apply these rules where applicable:

POLICIES (Security, Privacy, Acceptable Use, etc.):
- Must appear signed or approved by an authorized signatory (officer, CISO, or delegate)
- Must show evidence of review/approval within the last 12 months (flag if older or undated)
- Flag missing ownership, version control, or annual review cadence

SOC 2 TYPE II:
- Note audit period, opinion type, and any qualified/adverse opinions
- Flag exceptions, management letter comments, or control deficiencies
- Note subservice organizations and carve-outs
- Flag if report is expired (>12 months from period end)

HITRUST / ISO 27001:
- Verify certification validity dates and scope
- Flag gaps, non-conformities, or conditions on certification
- For ISO: note if Statement of Applicability controls are missing or excluded without justification

PENETRATION TEST REPORTS:
- Note critical/high findings, remediation status, and retest results
- Flag open critical/high items or overdue remediation

INSURANCE / BCP:
- Check coverage amounts, expiry, and alignment to service risk
- For BCP/DR: note RTO/RPO, last test date, and test results

Return ONLY valid JSON, no markdown fences:
{
  "documentTypeDetected": "string",
  "isRelevant": true,
  "relevanceScore": 85,
  "summary": "2-3 sentence executive summary",
  "complianceChecks": [
    { "check": "Authorized signatory on policy", "status": "pass|fail|warning|unknown", "details": "..." }
  ],
  "riskFlags": [
    { "severity": "Low|Medium|High|Critical", "category": "Policy|SOC2|ISO|PenTest|Other", "finding": "...", "evidence": "quote or reference from text" }
  ],
  "extractedFacts": ["fact useful for vendor risk questionnaire"],
  "questionnaireHints": ["suggested answer themes for security/compliance questions"],
  "overallDocumentRisk": "Low|Medium|High|Critical",
  "recommendedActions": ["specific remediation or evidence request"]
}

Include at least 4 complianceChecks and flag ALL material risks found. If text is insufficient, use status "unknown" and explain in details.`
}
