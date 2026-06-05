export interface InherentRiskInput {
  dataCategories?: string[] | string | null
  geographicPresence?: string[] | string | null
  certifications?: string[] | string | null
  substitutability?: string
  criticality?: string
  dataVolume?: string
}

export interface InherentRiskResult {
  likelihood: number
  impact: number
  score: number
  rating: 'Low' | 'Medium' | 'High' | 'Critical'
}

function toArray(value: string[] | string | null | undefined): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getRiskRating(score: number): InherentRiskResult['rating'] {
  if (score >= 17) return 'Critical'
  if (score >= 10) return 'High'
  if (score >= 5) return 'Medium'
  return 'Low'
}

export function calculateInherentRisk(
  vendorData: InherentRiskInput
): InherentRiskResult {
  const dataCategories = toArray(vendorData.dataCategories)
  const geographicPresence = toArray(vendorData.geographicPresence)
  const certifications = toArray(vendorData.certifications)

  let likelihood = 2

  if (
    dataCategories.some(
      (cat) =>
        cat.includes('PII') ||
        cat.includes('Personal Identifiable') ||
        cat.includes('Financial')
    )
  ) {
    likelihood += 1
  }

  if (vendorData.substitutability === 'No — sole source provider') {
    likelihood += 1
  }

  const highRiskRegions = [
    'Middle East & Africa',
    'Latin America',
    'Asia Pacific',
  ]
  if (
    geographicPresence.some((region) => highRiskRegions.includes(region))
  ) {
    likelihood += 1
  }

  if (
    certifications.some(
      (cert) => cert.includes('ISO 27001') || cert.includes('SOC 2')
    )
  ) {
    likelihood -= 1
  }

  likelihood = Math.max(1, Math.min(5, likelihood))

  let impact = 1

  if (vendorData.criticality === 'Critical — operations would stop') {
    impact = 5
  } else if (vendorData.criticality === 'High — significant degradation') {
    impact = 4
  } else if (vendorData.criticality === 'Medium — workaround available') {
    impact = 2
  } else if (vendorData.criticality === 'Low — minimal impact') {
    impact = 1
  }

  if (
    vendorData.dataVolume === 'High (>100GB)' ||
    vendorData.dataVolume === 'High (&gt;100GB)'
  ) {
    impact += 1
  }

  if (dataCategories.some((cat) => cat.includes('Health'))) {
    impact += 1
  }

  impact = Math.max(1, Math.min(5, impact))

  const score = likelihood * impact

  return {
    likelihood,
    impact,
    score,
    rating: getRiskRating(score),
  }
}

export function calculateResidualRisk(
  inherentLikelihood: number,
  inherentImpact: number,
  scores: Record<string, number>
) {
  const scoreValues = Object.values(scores)
  const controlEffectivenessScore =
    scoreValues.length > 0
      ? Math.round(
          scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length
        )
      : 0

  const criticalRisks = scoreValues.filter((s) => s < 40).length
  const highRisks = scoreValues.filter((s) => s >= 40 && s < 60).length
  const mediumRisks = scoreValues.filter((s) => s >= 60 && s < 80).length
  const lowRisks = scoreValues.filter((s) => s >= 80).length
  const risksIdentified = criticalRisks + highRisks

  const controlFactor = controlEffectivenessScore / 100

  const residualLikelihood = Math.max(
    1,
    Math.round(inherentLikelihood * (1 - controlFactor * 0.6))
  )

  const residualImpact = Math.max(
    1,
    Math.round(inherentImpact * (1 - controlFactor * 0.3))
  )

  const residualRiskScore = residualLikelihood * residualImpact

  return {
    controlEffectivenessScore,
    criticalRisks,
    highRisks,
    mediumRisks,
    lowRisks,
    risksIdentified,
    residualLikelihood,
    residualImpact,
    residualRiskScore,
    residualRiskRating: getRiskRating(residualRiskScore),
  }
}
