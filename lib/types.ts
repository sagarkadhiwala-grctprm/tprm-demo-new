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
  keyFindings: string[]
  recommendations: string[]
}

export interface VendorFormData {
  companyName: string
  country: string
  employeeCount: string
  contactName: string
  contactEmail: string
  serviceType: string
  serviceDescription: string
  dataTypes: string[]
  subcontractors: string
  criticality: string
  substitutability: string
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
  createdAt: string
  updatedAt: string
  latestAssessment?: {
    id: string
    overallScore: number
    riskLevel: string
    completedAt: string
  } | null
}
