export type QuestionCategory =
  | 'Security'
  | 'Compliance'
  | 'Financial'
  | 'Operational'

export interface AssessmentQuestion {
  id: string
  question: string
  category: QuestionCategory
  required: boolean
}

export interface TierClassification {
  tier: number
  rationale: string
  keyRiskFactors: string[]
}

export interface ScoreResult {
  scores: Record<string, number>
  overallScore: number
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'
  aiNarrative: string
  keyStrengths: string[]
  keyFindings: Array<{ text: string; severity: 'high' | 'medium' | 'low' }>
  recommendations: string[]
}

export interface VendorFormData {
  companyName: string
  country: string
  employeeCount: string
  contactName: string
  contactEmail: string
  serviceType: string
  natureOfBusiness?: string
  productsServices: string
  dataCategories: string[]
  subcontractors: string
  criticality: string
  substitutability: string
  dataVolume?: string
  dataRetentionPeriod?: string
  geographicPresence?: string[]
  certifications?: string[]
  regulatoryBodies?: string[]
}

export interface LatestAssessmentSummary {
  id: string
  overallScore: number
  riskLevel: string
  residualRiskRating?: string | null
  approvalStatus?: string | null
  completedAt: string
}

export interface VendorWithAssessment {
  id: string
  companyName: string
  serviceType: string
  dataTypes: string
  contactEmail: string
  contactName: string
  country: string
  employeeCount: string
  tier: number
  tierRationale: string
  status: string
  inherentLikelihood?: number | null
  inherentImpact?: number | null
  inherentRiskScore?: number | null
  inherentRiskRating?: string | null
  createdAt: string
  updatedAt: string
  latestAssessment?: LatestAssessmentSummary | null
}
