export function predictTier(
  dataTypes: string[],
  criticality: string
): number {
  const hasPII = dataTypes.includes('Customer PII (names, addresses, SSNs)')
  const hasFinancial = dataTypes.includes(
    'Financial Records & Transactions'
  )
  const hasNoSensitive = dataTypes.includes('No Sensitive Data Access')
  const sensitiveLabels = [
    'Customer PII (names, addresses, SSNs)',
    'Financial Records & Transactions',
    'Trading & Market Data',
    'Employee Data',
    'Authentication & Credentials',
    'Internal Systems Access',
  ]
  const hasSensitive = dataTypes.some((d) => sensitiveLabels.includes(d))

  if ((hasPII && hasFinancial) || criticality.startsWith('Critical')) {
    return 1
  }
  if (hasSensitive || criticality.startsWith('High')) {
    return 2
  }
  if (hasNoSensitive && (criticality.startsWith('Medium') || criticality.startsWith('Low'))) {
    return 3
  }
  return 2
}

export function tierBadgeColor(tier: number): string {
  if (tier === 1) return 'bg-danger/20 text-danger border-danger/40'
  if (tier === 2) return 'bg-warning/20 text-warning border-warning/40'
  return 'bg-success/20 text-success border-success/40'
}

export function tierLabel(tier: number): string {
  if (tier === 1) return 'Tier 1 — Critical'
  if (tier === 2) return 'Tier 2 — Moderate'
  return 'Tier 3 — Low Risk'
}

export function riskLevelColor(level: string): string {
  switch (level) {
    case 'Critical':
      return 'bg-danger text-white'
    case 'High':
      return 'bg-orange-500 text-white'
    case 'Medium':
      return 'bg-warning text-navy'
    case 'Low':
      return 'bg-success text-white'
    default:
      return 'bg-gray-500 text-white'
  }
}

export function scoreBarColor(score: number): string {
  if (score <= 40) return 'bg-danger'
  if (score <= 70) return 'bg-warning'
  return 'bg-success'
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
